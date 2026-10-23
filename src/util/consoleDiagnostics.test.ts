/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSOLE_DIAGNOSTIC_BUDGET } from "./consoleDiagnosticBudget";

const SRC_DIR = join(import.meta.dirname, "..");

/**
 * Every tree a task's work can reach while the frame is up. `src/cli/` is the
 * exception: it holds the commands, which render their answer after the run,
 * and the entrypoints at the top of `src/` print before any run exists.
 */
const SCANNED = [
  "commands",
  "config",
  "kb",
  "sec",
  "storage",
  "task",
  "util",
  "verify",
  "web",
] as const;

const CONSOLE_RE = /\bconsole\.(log|warn|error|info|debug|trace)\s*\(/g;

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "mock_data" || entry.name === "node_modules") continue;
      out.push(...tsFiles(full));
      continue;
    }
    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) continue;
    out.push(full);
  }
  return out;
}

function countConsoleWrites(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tree of SCANNED) {
    for (const file of tsFiles(join(SRC_DIR, tree))) {
      const matches = readFileSync(file, "utf8").match(CONSOLE_RE);
      if (matches) counts.set(relative(SRC_DIR, file), matches.length);
    }
  }
  return counts;
}

/**
 * A console write from inside a run prints underneath the live Ink frame,
 * whose erase is a line count, so the frame overwrites the tail of the message
 * — usually the part worth reading. `runWorkflowCli` defers whatever goes
 * through `reportDiagnostic` until the frame has closed.
 *
 * All the console methods count: the hazard is the line, not the severity, and
 * most of the writes converted here were `console.log` summaries and dry-run
 * lines rather than warnings. The budget is exact in both directions, so a
 * converted file cannot quietly grow back to where it was.
 */
describe("console writes under the run trees", () => {
  const counts = countConsoleWrites();

  it("does not grow past the recorded budget", () => {
    const regressions: string[] = [];
    for (const [file, count] of [...counts].sort()) {
      const budget = CONSOLE_DIAGNOSTIC_BUDGET[file] ?? 0;
      if (count > budget) {
        regressions.push(
          `${file}: ${count} console write(s), budget ${budget} — use reportDiagnostic() from ` +
            `src/util/diagnostics.ts, the task's updateProgress for progress text, or throw if ` +
            `an operator must act on it immediately`
        );
      }
    }
    expect(regressions).toEqual([]);
  });

  it("has no budget left over from a conversion that already happened", () => {
    const stale: string[] = [];
    for (const [file, budget] of Object.entries(CONSOLE_DIAGNOSTIC_BUDGET).sort()) {
      const count = counts.get(file) ?? 0;
      if (count < budget) {
        stale.push(
          count === 0
            ? `${file}: none left — remove its entry from CONSOLE_DIAGNOSTIC_BUDGET`
            : `${file}: ${count} left, budget ${budget} — lower it to ${count}`
        );
      }
    }
    expect(stale).toEqual([]);
  });

  it("finds the sink, so a broken scan cannot pass by finding nothing", () => {
    expect(counts.get("util/diagnostics.ts")).toBe(1);
  });
});
