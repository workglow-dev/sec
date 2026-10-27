#!/usr/bin/env bun
/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The gate list, once. `bun run release-checks` and CI both run this script,
 * so what a release is checked against and what every push is checked against
 * cannot drift apart — they did: CI ran five of the six, and the one it left
 * out (what the tarball holds) was then found only on the maintainer's machine
 * at release time.
 *
 * Cheapest first, stopping at the first failure. Under GitHub Actions each gate
 * is a collapsible log group and a failure is an annotation naming the gate,
 * which is what separate workflow steps used to give.
 *
 * `bun ./scripts/releaseChecks.ts --list` prints the gate names.
 */
import { spawnSync } from "node:child_process";

interface Gate {
  readonly name: string;
  readonly command: readonly string[];
}

export const GATES: readonly Gate[] = [
  { name: "format-check", command: ["bun", "run", "format-check"] },
  { name: "lint", command: ["bun", "run", "lint"] },
  { name: "typecheck", command: ["bun", "run", "typecheck"] },
  { name: "build", command: ["bun", "run", "build"] },
  // Both read `dist`, so they follow `build`; both take seconds, so they go
  // ahead of the suite rather than after it.
  { name: "prepack-check", command: ["bun", "run", "prepack-check"] },
  { name: "smoke-bins", command: ["bun", "run", "smoke-bins"] },
  { name: "test", command: ["bun", "run", "test"] },
];

const inActions = process.env.GITHUB_ACTIONS === "true";

function runGate(gate: Gate): boolean {
  const started = performance.now();
  if (inActions) console.log(`::group::${gate.name}`);
  else console.log(`\n== ${gate.name} ==`);
  const [command, ...args] = gate.command;
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (inActions) console.log("::endgroup::");
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const ok = result.status === 0;
  if (ok) {
    console.log(`ok ${gate.name} (${seconds}s)`);
  } else {
    const why = result.error?.message ?? `exit ${result.status ?? result.signal}`;
    console.log(
      inActions
        ? `::error title=${gate.name}::${gate.name} failed (${why})`
        : `FAILED ${gate.name} (${why})`
    );
  }
  return ok;
}

if (import.meta.main) {
  if (process.argv.includes("--list")) {
    for (const gate of GATES) console.log(gate.name);
  } else {
    for (const gate of GATES) {
      if (!runGate(gate)) process.exit(1);
    }
  }
}
