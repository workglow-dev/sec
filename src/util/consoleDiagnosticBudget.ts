/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Raw `console.*` writes allowed under the trees a run executes in, per file,
 * keyed by path from `src/`. `consoleDiagnostics.test.ts` fails on a count
 * that does not match — in either direction, so a conversion lowers the
 * number rather than leaving headroom for the next write.
 *
 * Not an allowlist to add to. A write from inside a run lands underneath the
 * live Ink frame, whose erase counts lines, so the frame overwrites the tail of
 * the message. Route it through `reportDiagnostic` (`./diagnostics`), report
 * progress through the task's `updateProgress`, or throw when an operator must
 * act immediately. A command's own output belongs in `src/cli/`, which renders
 * after the run and is not scanned.
 *
 * The one entry is the sink everything else is routed to.
 */
export const CONSOLE_DIAGNOSTIC_BUDGET: Readonly<Record<string, number>> = {
  "util/diagnostics.ts": 1,
};
