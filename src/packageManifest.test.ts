/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface Manifest {
  readonly engines?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly trustedDependencies?: readonly string[];
  readonly scripts?: Record<string, string>;
  readonly bin?: Record<string, string>;
  readonly exports?: unknown;
  readonly main?: unknown;
  readonly types?: unknown;
}

const manifest = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "package.json"), "utf8")
) as Manifest;

/**
 * The runtime floor is asserted in three places that can drift apart: this
 * manifest, `.claude/CLAUDE.md`, and `@workglow/sqlite`'s own `engines`. Only
 * the manifest is enforced at install time — the other two are prose. A floor
 * that is documented but not declared installs cleanly on Node 22 and fails
 * later, inside `node:sqlite`, reading as a storage bug rather than a version
 * error.
 */
describe("runtime floor", () => {
  it("declares the Node floor node:sqlite needs", () => {
    expect(manifest.engines?.node).toBe(">=24");
  });

  it("declares the Bun floor", () => {
    expect(manifest.engines?.bun).toBe(">=1.4.0");
  });
});

/**
 * `@workglow/sqlite` moved off `better-sqlite3` onto the built-in
 * `node:sqlite`. Nothing here loads a native SQLite driver any more, so a
 * reappearance is a stale copy-paste rather than a dependency — and its
 * `trustedDependencies` entry would run that package's install scripts.
 */
describe("no native SQLite driver", () => {
  const maps = [
    ["dependencies", manifest.dependencies],
    ["devDependencies", manifest.devDependencies],
    ["peerDependencies", manifest.peerDependencies],
  ] as const;

  it.each(maps)("keeps better-sqlite3 out of %s", (_name, map) => {
    expect(Object.keys(map ?? {})).not.toContain("better-sqlite3");
  });

  it("keeps better-sqlite3 out of trustedDependencies", () => {
    expect(manifest.trustedDependencies ?? []).not.toContain("better-sqlite3");
  });
});

/**
 * The package is binary-only by intent, not by accident: the re-founding
 * removed the library surface, so there is no `exports` map, no `main` and no
 * `types` — just the two `bin` entries. Asserting the shape is what separates
 * "decided" from "a field someone deleted by mistake".
 */
describe("binary-only distribution", () => {
  it("ships the two binaries", () => {
    expect(Object.keys(manifest.bin ?? {}).sort()).toEqual(["sec", "sec-base"]);
  });

  it("exposes no import entry point", () => {
    expect(manifest.exports).toBeUndefined();
    expect(manifest.main).toBeUndefined();
    expect(manifest.types).toBeUndefined();
  });
});

/**
 * On a 0.x line the minor is the break slot, so a consumer on `^0.1.5`
 * resolves a patch on the next install. `release` cuts a patch and cannot know
 * whether the changelog's leading heading says BREAKING; what it can do is
 * offer the minor path as a first-class script rather than leaving it to be
 * remembered as a flag.
 */
describe("release scripts", () => {
  it("offers both bump levels over one set of gates", () => {
    expect(manifest.scripts?.release).toContain("--patch");
    expect(manifest.scripts?.["release-minor"]).toContain("--minor");
    for (const script of ["release", "release-minor"]) {
      expect(manifest.scripts?.[script]).toContain("release-checks");
    }
  });

  it("runs the same gates before either bump", () => {
    const checks = manifest.scripts?.["release-checks"] ?? "";
    for (const gate of ["format", "lint", "typecheck", "build", "prepack-check"]) {
      expect(checks).toContain(gate);
    }
  });
});
