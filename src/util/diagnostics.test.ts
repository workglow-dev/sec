/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  reportDiagnostic,
  reportDryRun,
  resetDiagnosticsForTesting,
  withDeferredDiagnostics,
} from "./diagnostics";

/** Captures everything `reportDiagnostic` lets through to the console. */
function captureWarnings(): { readonly lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const warn = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    lines.push(String(args[0] ?? ""));
  });
  return { lines, restore: () => warn.mockRestore() };
}

describe("reportDiagnostic", () => {
  afterEach(() => {
    resetDiagnosticsForTesting();
  });

  it("writes straight to the console when no scope is open", () => {
    // The fall-through case, and the reason routing a call site through this
    // module is safe on its own: a parser called from a unit test, a library
    // consumer or any path that never reaches the CLI keeps printing exactly
    // as it did before. Nothing is buffered into a scope that will never flush.
    const { lines, restore } = captureWarnings();
    try {
      reportDiagnostic("straight through");
    } finally {
      restore();
    }
    expect(lines).toEqual(["straight through"]);
  });

  it("buffers a dry-run line like any other, marked as one", async () => {
    // A `--dry-run` task runs under the same live frame as a real one, so its
    // "Would …" line is deferred the same way — and prefixed, so the flushed
    // lines tell what was skipped on purpose from what failed.
    const { lines, restore } = captureWarnings();
    let duringRun: string[] = [];
    try {
      await withDeferredDiagnostics(async () => {
        reportDryRun("Would download the archive");
        duringRun = [...lines];
      });
    } finally {
      restore();
    }
    expect(duringRun).toEqual([]);
    expect(lines).toEqual(["dry run: Would download the archive"]);
  });

  it("says nothing until the deferred scope closes, then says it in order", async () => {
    const { lines, restore } = captureWarnings();
    let duringRun: string[] = [];
    try {
      await withDeferredDiagnostics(async () => {
        reportDiagnostic("first");
        reportDiagnostic("second");
        // The property the whole module exists for: while the run is live —
        // and on a TTY, while the Ink frame is mounted — the console has seen
        // nothing at all.
        duringRun = [...lines];
      });
    } finally {
      restore();
    }
    expect(duringRun).toEqual([]);
    expect(lines).toEqual(["first", "second"]);
  });

  it("flushes what it collected when the run throws", async () => {
    // The diagnostics a failing run collected are usually the explanation for
    // the failure, so they must survive it — and reach the console BEFORE the
    // error propagates to the command's handler, so they read above it.
    const { lines, restore } = captureWarnings();
    try {
      await expect(
        withDeferredDiagnostics(async () => {
          reportDiagnostic("observed before the throw");
          throw new Error("run failed");
        })
      ).rejects.toThrow("run failed");
    } finally {
      restore();
    }
    expect(lines).toEqual(["observed before the throw"]);
  });

  it("flushes once, at the outermost scope", async () => {
    // A command that nests runs would otherwise have the inner scope print into
    // the frame the outer one is still drawing — the exact bug being fixed,
    // reintroduced by the fix.
    const { lines, restore } = captureWarnings();
    let afterInner: string[] = [];
    try {
      await withDeferredDiagnostics(async () => {
        reportDiagnostic("outer");
        await withDeferredDiagnostics(async () => {
          reportDiagnostic("inner");
        });
        afterInner = [...lines];
      });
    } finally {
      restore();
    }
    expect(afterInner).toEqual([]);
    expect(lines).toEqual(["outer", "inner"]);
  });

  it("reopens cleanly for the next run", async () => {
    const { lines, restore } = captureWarnings();
    try {
      await withDeferredDiagnostics(async () => reportDiagnostic("run one"));
      await withDeferredDiagnostics(async () => reportDiagnostic("run two"));
    } finally {
      restore();
    }
    expect(lines).toEqual(["run one", "run two"]);
  });

  it("caps the buffer by dropping the middle, keeping both ends", async () => {
    // Volume is driven by the archive, not by us. The cap keeps a pathological
    // snapshot from holding an unbounded array, and the marker keeps it from
    // reading as the complete list.
    //
    // It drops the MIDDLE rather than the tail because of what sits at each
    // end: a run's cheap repetitive lines (one per malformed row batch, one per
    // failed ticker window) are what reach the cap, and its end-of-run
    // accounting — the replacement report, the quote sweep's anchor failures —
    // is raised last. Keeping a prefix alone threw away the outcome and kept
    // the noise that caused the overrun.
    const { lines, restore } = captureWarnings();
    try {
      await withDeferredDiagnostics(async () => {
        for (let i = 0; i < 250; i += 1) reportDiagnostic(`line ${i}`);
      });
    } finally {
      restore();
    }
    expect(lines).toHaveLength(201);
    expect(lines[0]).toBe("line 0");
    expect(lines[149]).toBe("line 149");
    expect(lines[150]).toContain("50 further diagnostic(s)");
    expect(lines[151]).toBe("line 200");
    expect(lines[200]).toBe("line 249");
  });

  it("flushes from a process exit the run never returns from", async () => {
    // The `finally` is not enough on its own. On a TTY the workflow renderer
    // answers a thrown run by calling `process.exit(1)` itself, so nothing on
    // the stack unwinds and the lines explaining the failure would be lost in
    // exactly the environment the deferral exists for.
    const { lines, restore } = captureWarnings();
    const before = process.listeners("exit");
    let duringRun = 0;
    let flushedOnExit: string[] = [];
    try {
      await withDeferredDiagnostics(async () => {
        reportDiagnostic("observed before the exit");
        const installed = process.listeners("exit").filter((l) => !before.includes(l));
        duringRun = installed.length;
        // What `process.exit()` does to the listener this scope installed —
        // only that one, so the runner's own exit handling is left alone.
        for (const listener of installed) listener(0);
        flushedOnExit = [...lines];
      });
    } finally {
      restore();
      resetDiagnosticsForTesting();
    }
    expect(duringRun).toBe(1);
    expect(flushedOnExit).toEqual(["observed before the exit"]);
    // The listener is removed with the scope, so runs do not accumulate them.
    expect(process.listenerCount("exit")).toBe(before.length);
  });

  it("survives a reset taken from inside an open scope", async () => {
    // `resetDiagnosticsForTesting` exists to be called after a test threw
    // inside a scope, so it zeroes the depth the scope is still holding. A bare
    // decrement in the scope's `finally` then left it negative, and every later
    // run in the process silently stopped deferring.
    const { lines, restore } = captureWarnings();
    try {
      await withDeferredDiagnostics(async () => {
        resetDiagnosticsForTesting();
      });
      await withDeferredDiagnostics(async () => {
        reportDiagnostic("still deferred");
        expect(lines).toEqual([]);
      });
    } finally {
      restore();
    }
    expect(lines).toEqual(["still deferred"]);
  });
});
