#!/usr/bin/env bun
/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Starts each built binary the way a fresh install meets it: no `SEC_*`
 * environment, no `.env.local`, a working directory holding nothing. `--help`
 * and `--version` must exit 0 there.
 *
 * `checkPackedContents.ts` proves the files ship; nothing else proves they
 * start. A binary that boots its runtime before commander parses dies on
 * `--help` with a configuration error, and every unit test still passes,
 * because none of them run `dist`.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** Each `bin` entry; each must print its help and version unconfigured. */
const BINARIES = ["dist/sec.js"] as const;
const ARGS = [["--help"], ["--version"]] as const;

const root = resolve(import.meta.dirname, "..");
const scratch = mkdtempSync(join(tmpdir(), "sec-smoke-"));
const failures: string[] = [];

try {
  for (const binary of BINARIES) {
    for (const args of ARGS) {
      const line = `${binary} ${args.join(" ")}`;
      const result = spawnSync(process.execPath, [join(root, binary), ...args], {
        cwd: scratch,
        // PATH alone: the runtime under test is this one, and everything a
        // configured machine would add is what the check exists to leave out.
        env: { PATH: process.env.PATH ?? "", HOME: scratch },
        encoding: "utf8",
        timeout: 60_000,
      });
      if (result.status === 0) {
        console.log(`ok ${line}`);
        continue;
      }
      const why = result.error?.message ?? `exit ${result.status ?? result.signal}`;
      const output = `${result.stderr}${result.stdout}`.trim().split("\n").slice(0, 15).join("\n");
      failures.push(`${line}: ${why}\n${output}`);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`smoke-bins FAILED:\n\n${failures.join("\n\n")}`);
  process.exit(1);
}
