/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Operator-facing diagnostics raised from inside a run: a CIK that failed to
 * fetch, a skipped index row, a run's closing summary, what a dry run would
 * have done. Worth telling an operator, never worth failing over.
 *
 * Inside {@link withDeferredDiagnostics} they are buffered and printed after
 * the run, clear of the CLI's live progress frame. Anywhere else — a unit test,
 * a library caller — they go straight to `console.warn`.
 */

/** How many diagnostics one deferred run prints; the rest are counted and dropped. */
const MAX_BUFFERED = 200;

/**
 * How much of {@link MAX_BUFFERED} is reserved for the LAST diagnostics a run
 * raised: end-of-run accounting comes last, and the repetitive per-row lines
 * that fill the buffer come first, so an overrun keeps both ends and drops the
 * middle.
 */
const TAIL_BUFFERED = 50;
const HEAD_BUFFERED = MAX_BUFFERED - TAIL_BUFFERED;

let buffered: string[] | null = null;
/** The most recent {@link TAIL_BUFFERED} diagnostics, once the head is full. */
let bufferedTail: string[] = [];
let dropped = 0;
/** Nesting depth of {@link withDeferredDiagnostics}; only the outermost scope flushes. */
let depth = 0;
/** Where a test told the console's lines to go instead; see {@link captureDiagnosticsForTesting}. */
let captured: string[] | null = null;

/** The one sink: the capture a test installed, else the console. */
function emit(message: string): void {
  if (captured !== null) {
    captured.push(message);
    return;
  }
  console.warn(message);
}

/**
 * Buffered while a deferred scope is open, written to `console.warn` otherwise.
 *
 * No level and no category — everything here is the same severity. Anything an
 * operator must act on immediately should throw instead.
 */
export function reportDiagnostic(message: string): void {
  if (buffered === null) {
    emit(message);
    return;
  }
  if (buffered.length < HEAD_BUFFERED) {
    buffered.push(message);
    return;
  }
  bufferedTail.push(message);
  if (bufferedTail.length > TAIL_BUFFERED) {
    bufferedTail.shift();
    dropped += 1;
  }
}

/**
 * What a `--dry-run` would have done, stated as `Would …`. A task under
 * `--dry-run` still runs under the live frame, so a `console.log` of that line
 * shifts the frame exactly as a warning does; it goes through the same buffer,
 * with a prefix so the flushed lines tell a skipped write from a failed one.
 */
export function reportDryRun(message: string): void {
  reportDiagnostic(`dry run: ${message}`);
}

/**
 * Runs `body` with diagnostics buffered, flushing them once it settles.
 *
 * The `finally` is backed by a `process.on("exit")` flush, since the TTY
 * renderer answers a thrown run with `process.exit(1)` rather than by
 * rejecting; there they land below the `Error:` line it prints first. A run
 * killed by a signal loses them — `exit` does not fire.
 */
export async function withDeferredDiagnostics<T>(body: () => Promise<T>): Promise<T> {
  if (depth === 0) {
    buffered = [];
    bufferedTail = [];
    dropped = 0;
    process.on("exit", flushDiagnostics);
  }
  depth += 1;
  try {
    return await body();
  } finally {
    // Clamped, since `resetDiagnosticsForTesting` zeroes the depth from inside
    // an open scope.
    depth = Math.max(0, depth - 1);
    if (depth === 0) {
      process.removeListener("exit", flushDiagnostics);
      flushDiagnostics();
    }
  }
}

/** Prints and clears whatever the open scope collected. */
function flushDiagnostics(): void {
  const head = buffered ?? [];
  const tail = bufferedTail;
  const suppressed = dropped;
  buffered = null;
  bufferedTail = [];
  dropped = 0;
  for (const message of head) emit(message);
  if (suppressed > 0) {
    emit(
      `... ${suppressed} further diagnostic(s) from this run are not shown — the buffer holds ` +
        `${MAX_BUFFERED}, the first ${HEAD_BUFFERED} and the last ${TAIL_BUFFERED}. A run raising ` +
        `this many is reporting a systematic problem with the data rather than a handful of ` +
        `rows, so read the lines above as a sample and the lines below as the outcome`
    );
  }
  for (const message of tail) emit(message);
}

/**
 * Routes every line that would reach the console into `lines` instead, until
 * `restore()`. Test only.
 *
 * A test that wants to know what a run told the operator used to spy on
 * `console.warn`, which pins it to the sink rather than to the seam: the same
 * spy also catches a stray console write from anything else on the path, and
 * its restore is one more thing for the `finally` to get right. This observes
 * exactly what {@link reportDiagnostic} lets through — the immediate
 * fall-through outside a scope, and the flush at the end of one, overrun line
 * included. Captures nest; each `restore()` reinstates the sink it replaced.
 */
export function captureDiagnosticsForTesting(): {
  readonly lines: readonly string[];
  restore(): void;
} {
  const previous = captured;
  const lines: string[] = [];
  captured = lines;
  return {
    lines,
    restore(): void {
      captured = previous;
    },
  };
}

/** Drops any open scope and any capture. Test setup only. */
export function resetDiagnosticsForTesting(): void {
  buffered = null;
  bufferedTail = [];
  dropped = 0;
  depth = 0;
  captured = null;
  process.removeListener("exit", flushDiagnostics);
}
