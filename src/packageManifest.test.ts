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
 * On a 0.x line the minor is the break slot, so a consumer on `^0.1.5` resolves
 * a patch on their next install. `release` used to cut a patch unconditionally
 * and offer the minor as a second script, which left the number to whoever
 * remembered which one to type.
 *
 * `--auto` derives it instead — from the commits, and from a diff of this
 * manifest against the one at the last tag, which raises the bump to the break
 * slot when the package lost an entry point or gained a runtime floor. That is
 * the class of break no commit message describes, because nothing about it
 * looks like a breaking edit.
 */
describe("release scripts", () => {
  it("derives the bump rather than naming one", () => {
    const release = manifest.scripts?.release ?? "";
    expect(release).toContain("--auto");
    // A second script that names a level is the choice `--auto` removes, back
    // in the place it was made from.
    expect(release).not.toMatch(/--(patch|minor|major)\b/);
    expect(Object.keys(manifest.scripts ?? {})).not.toContain("release-minor");
  });

  it("runs the gates before the bump", () => {
    expect(manifest.scripts?.release).toContain("release-checks");
    const checks = manifest.scripts?.["release-checks"] ?? "";
    for (const gate of ["format", "lint", "typecheck", "build", "prepack-check"]) {
      expect(checks).toContain(gate);
    }
  });

  it("pins a bunset that has `--auto`", () => {
    // `--auto` arrived in 1.1.0 and the 0.x bump table it uses was corrected in
    // 1.1.1. An older pin does not fail loudly — it takes the flag as unknown.
    expect(manifest.devDependencies?.bunset).toBe("1.1.1");
  });
});
