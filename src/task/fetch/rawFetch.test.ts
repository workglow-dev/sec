/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "../../..");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "mock_data" || entry.name === "node_modules") continue;
      out.push(...sourceFiles(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

/** Code lines only: a comment naming `fetch()` is not a call. */
function codeLines(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line));
}

function offenders(pattern: RegExp, allowed: readonly string[]): string[] {
  const found: string[] = [];
  for (const tree of ["src", "scripts"]) {
    for (const file of sourceFiles(join(ROOT, tree))) {
      const path = relative(ROOT, file);
      if (allowed.includes(path)) continue;
      codeLines(file).forEach((line) => {
        if (pattern.test(line)) found.push(`${path}: ${line.trim()}`);
      });
    }
  }
  return found;
}

/**
 * Every EDGAR request goes through the fetch queue — `SecFetchTask` and the
 * tasks built on it — which is what applies the request rate shared across
 * processes, the in-flight cap, the 429 cooldown and `SecUserAgent`. A bare
 * `fetch()` gets none of them, and two fixture commands had one each, with a
 * User-Agent default of their own that an empty `SEC_USER_AGENT` blanked.
 */
describe("EDGAR requests", () => {
  it("never call fetch() directly", () => {
    // `fetch(` and `globalThis.fetch(` — not a method that happens to be named
    // so, and not prose ("to fetch (YYYY-MM-DD)"): the formatter never puts a
    // space between a callee and its arguments.
    expect(offenders(/(?:^|[^\w$.])fetch\(|globalThis\.fetch\(/, [])).toEqual([]);
  });

  it("read SEC_USER_AGENT in one place, which trims it and falls back", () => {
    expect(offenders(/SEC_USER_AGENT/, ["src/config/Constants.ts"])).toEqual([]);
  });
});
