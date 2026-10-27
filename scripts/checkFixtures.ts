#!/usr/bin/env bun
/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Audits the committed EDGAR golden fixtures against their pinned manifest.
 *
 * A CI check on committed bytes, not something a user runs — which is why it is
 * a script and not a command. It writes nothing and needs no configured
 * database, but it reaches EDGAR the way the pipeline does: through the fetch
 * queue, started here because no CLI boot brings it up. Its rate limiter is
 * in-process, since there is no database to share one through.
 *
 *   bun run check-fixtures            # verify, exit non-zero on any mismatch
 *   bun run check-fixtures --write    # re-download what no longer matches
 */
import { shutdownCliResources } from "../src/cli/shutdownCliResources";
import { startSecJobQueue } from "../src/task/fetch/SecJobQueue";
import { GoldenFixturesTask } from "../src/task/fixtures/GoldenFixturesTask";

const write = process.argv.includes("--write");
const force = process.argv.includes("--force");

await startSecJobQueue();
let result;
try {
  result = await new GoldenFixturesTask().run({
    mode: write ? "download" : "verify",
    force,
  });
} finally {
  // The queue's workers keep the process alive until they are stopped.
  await shutdownCliResources();
}

for (const problem of result.problems) console.error(problem);
console.log(`Done. ok=${result.ok} written=${result.written} failed=${result.failed}`);
if (result.failed > 0) {
  console.error(
    `${result.failed} fixture(s) no longer match the manifest. ` +
      "Re-run with --write once you have confirmed the change is intended."
  );
  process.exit(1);
}
