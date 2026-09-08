/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Command } from "commander";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { AddCommands } from "./commands/index";

const ROOT = join(import.meta.dirname, "..");

/**
 * Every non-test `.ts` under `src/`.
 *
 * Test files are excluded, and that exclusion is the whole point rather than a
 * tidiness preference: this file is itself a `.ts` under `src/`, and the
 * witness table below is a set of string literals in it. Including tests made
 * the corpus contain the very strings it was searching for, so every witness
 * matched itself and the check could not fail.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "mock_data" || entry === "node_modules") continue;
      sourceFiles(full, out);
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

/**
 * The import statements in a file, which is where a witness has to appear.
 *
 * Matching anywhere in the file is what let prose stand in for evidence.
 * `RateLimiter` occurs eleven times outside tests: once as a real
 * `import type { RateLimiter } from "workglow"`, and ten times either inside a
 * prose comment or as a substring of a longer local name like
 * `secFetchRateLimiterTableNames`. Ten of those eleven prove nothing, and a
 * substring check cannot tell them from the one that does.
 */
function importStatements(source: string): string[] {
  // Comments first, so a witness named in prose cannot be read as an import.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  // Statement-wise, not line-wise: these imports are routinely multi-line, and
  // `createStandardKbStrategy` sits on a continuation line of one.
  return [
    ...code.matchAll(/\bimport\s+type\s+[\s\S]*?\bfrom\s*["'][^"']+["']/g),
    ...code.matchAll(/\bimport\s+(?!type\b)[\s\S]*?\bfrom\s*["'][^"']+["']/g),
    ...code.matchAll(/\bexport\s+[\s\S]*?\bfrom\s*["'][^"']+["']/g),
    ...code.matchAll(/\bimport\s*\(\s*["'][^"']+["']\s*\)/g),
    ...code.matchAll(/^\s*import\s*["'][^"']+["']/gm),
  ].map((match) => match[0]);
}

/**
 * The README's "What does the work" table is a promise about which parts of the
 * library this example actually exercises. It is checked, because the promise
 * this repo made before — "an example of using the Workglow AI library" — was
 * true of a tree with no AI call in it for long enough that nobody noticed.
 */
describe("the README's claims about what it demonstrates", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  const sources = sourceFiles(join(ROOT, "src"));
  const importCorpus = sources
    .flatMap((file) => importStatements(readFileSync(file, "utf-8")))
    .join("\n");

  it("searches a corpus that does not contain this file", () => {
    // The self-check. Excluding tests is one line in `sourceFiles`, and without
    // an assertion holding it there the next refactor of that function restores
    // the loop with nothing failing.
    const relatives = sources.map((file) => relative(ROOT, file));
    expect(relatives).not.toContain(join("src", "exampleCoverage.test.ts"));
    expect(relatives.filter((file) => file.endsWith(".test.ts"))).toEqual([]);
    // And it still found the tree: an empty corpus would pass every check below.
    expect(sources.length).toBeGreaterThan(100);
  });

  it("names a real path for every row of the table", () => {
    // Each row ends in one or more backticked paths under `src/`.
    const paths = [...readme.matchAll(/`(src\/[^`]+)`/g)].map((match) => match[1]!);
    expect(paths.length).toBeGreaterThan(5);
    for (const path of new Set(paths)) {
      const cleaned = path.replace(/\/$/, "");
      expect(() => statSync(join(ROOT, cleaned)), cleaned).not.toThrow();
    }
  });

  it("demonstrates every `@workglow/*` package it says it does", () => {
    const claimed = new Set(
      [...readme.matchAll(/`(@workglow\/[a-z-]+)`/g)].map((match) => match[1]!)
    );
    expect(claimed.size).toBeGreaterThan(4);

    // Reached through the `workglow` meta package, so a bare import of the
    // scoped name is not the evidence — the symbols are. One well-known export
    // per package stands for it, and has to appear on an import line.
    const witness: Readonly<Record<string, string>> = {
      "@workglow/job-queue": "RateLimiter",
      "@workglow/storage": "ITabularStorage",
      "@workglow/sqlite": "SqliteTabularStorage",
      "@workglow/postgres": "PostgresTabularStorage",
      "@workglow/task-graph": "Task",
      "@workglow/knowledge-base": "KnowledgeBase",
      "@workglow/ai": "createStandardKbStrategy",
      "@workglow/huggingface-transformers": "hf-transformers",
      "@workglow/anthropic": "anthropic/runtime",
      "@workglow/cli": "@workglow/cli",
    };

    const unproven = [...claimed].filter((pkg) => {
      const symbol = witness[pkg];
      // A package the README names and this test has no witness for is itself a
      // failure: the check is only worth anything if it covers the whole claim.
      return symbol === undefined || !importCorpus.includes(symbol);
    });
    expect(unproven).toEqual([]);
  });
});

/**
 * The README prints commands for a reader to run. A command that does not exist
 * costs that reader the first ten minutes of the example — which is the one
 * stretch this repo exists to make work.
 *
 * Resolved against the registered tree rather than against `--help` text, for
 * the reason `commandsBoot.test.ts` gives: help output is prose, and a group
 * name that appears in some description satisfies a substring check without
 * being registered at all.
 */
describe("the commands the README tells a reader to run", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");

  const program = new Command();
  AddCommands(program);

  /** Walks `sec a b c` down the command tree, or reports where it broke. */
  function resolve(words: readonly string[]): string | undefined {
    let node: Command = program;
    for (const word of words) {
      const next: Command | undefined = node.commands.find(
        (c) => c.name() === word || c.aliases().includes(word)
      );
      if (next === undefined) return word;
      node = next;
    }
    return undefined;
  }

  it("resolves every backticked `sec …` against the command tree", () => {
    const invocations = [...readme.matchAll(/`sec ([^`]+)`/g)].map((m) => m[1]!.trim());
    expect(invocations.length).toBeGreaterThan(5);

    const broken: string[] = [];
    for (const invocation of new Set(invocations)) {
      // Stop at the first thing that is not a bare word: a flag, a placeholder
      // like <CIK>, or a shell operator. Only the leading subcommand path is
      // resolvable, and the rest is arguments.
      const words: string[] = [];
      for (const word of invocation.split(/\s+/)) {
        if (!/^[a-z][a-z0-9-]*$/.test(word)) break;
        words.push(word);
      }
      if (words.length === 0) continue;
      const missing = resolve(words);
      if (missing !== undefined) broken.push(`sec ${invocation} (no "${missing}")`);
    }

    expect(broken).toEqual([]);
  });
});
