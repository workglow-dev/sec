/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { Type } from "typebox";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type IExecuteContext, Task } from "workglow";
import { setupAllDatabases } from "../config/setupAllDatabases";
import { resetDependencyInjectionsForTesting } from "../config/TestingDI";
import { fetchAndStoreSubmission } from "../task/submissions/fetchAndStoreSubmission";
import { captureDiagnosticsForTesting, resetDiagnosticsForTesting } from "../util/diagnostics";

/**
 * Stands in for the Ink frame: what matters is the moment it mounts and the
 * moment it closes, and what the console had been handed in between.
 */
const frame: string[] = [];
let capture: ReturnType<typeof captureDiagnosticsForTesting> | undefined;

vi.mock("@workglow/cli", () => ({
  withCli: vi.fn((wf: { run: (input?: unknown) => Promise<unknown> }) => ({
    run: async (input?: unknown) => {
      frame.push(`mounted, console had ${capture?.lines.length ?? 0} line(s)`);
      try {
        return await wf.run(input);
      } finally {
        frame.push(`closed, console had ${capture?.lines.length ?? 0} line(s)`);
      }
    },
  })),
}));

/** One CIK of `sec update submissions`, whose EDGAR fetch fails. */
class FailingCikTask extends Task<Record<string, never>, { readonly success: boolean }> {
  static readonly type = "RunWorkflowDiagnosticsFailingCikTask";
  static readonly title = "Failing CIK";

  public static inputSchema() {
    return Type.Object({});
  }

  public static outputSchema() {
    return Type.Object({ success: Type.Boolean() });
  }

  async execute(_input: Record<string, never>, context: IExecuteContext) {
    const failingFetch = {
      run: async (): Promise<never> => {
        throw new Error("HTTP 503 from data.sec.gov");
      },
    };
    const ctx = { ...context, own: () => failingFetch } as unknown as IExecuteContext;
    return fetchAndStoreSubmission({ cik: 320193 }, ctx);
  }
}

describe("runWorkflowCli and a failing CIK", () => {
  beforeEach(async () => {
    resetDependencyInjectionsForTesting();
    resetDiagnosticsForTesting();
    await setupAllDatabases();
    frame.length = 0;
    capture = captureDiagnosticsForTesting();
  });

  afterEach(() => {
    capture?.restore();
    capture = undefined;
    resetDiagnosticsForTesting();
  });

  it("says nothing while the frame is up, and names the CIK once it has closed", async () => {
    const { runWorkflowCli } = await import("./runWorkflow");

    const out = await runWorkflowCli<{ readonly success: boolean }>([new FailingCikTask()]);

    // One CIK failing never fails the sweep.
    expect(out.success).toBe(true);
    expect(frame).toEqual(["mounted, console had 0 line(s)", "closed, console had 0 line(s)"]);
    expect(capture?.lines).toEqual([
      "Failed to fetch/store submission for CIK 320193: HTTP 503 from data.sec.gov",
    ]);
  });
});
