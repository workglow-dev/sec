/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GATES } from "../../scripts/releaseChecks";

const root = join(import.meta.dirname, "../..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  readonly packageManager?: string;
  readonly engines?: { readonly bun?: string };
  readonly devDependencies?: Record<string, string>;
  readonly scripts?: Record<string, string>;
};
const workflow = readFileSync(join(root, ".github/workflows/test.yml"), "utf8");

/**
 * `typecheck` is `bun check`, so the Bun that runs CI decides a run's result
 * as much as any pinned dependency does. It is pinned in one place,
 * `packageManager`, which `setup-bun` reads; everything else that names a Bun
 * version is checked against it here rather than kept in step by hand.
 */
describe("the pinned Bun", () => {
  const pinned = /^bun@(\d+\.\d+\.\d+)$/.exec(pkg.packageManager ?? "")?.[1];

  it("is an exact version in packageManager", () => {
    expect(pkg.packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/);
  });

  it("is the engines floor", () => {
    expect(pkg.engines?.bun).toBe(`>=${pinned}`);
  });

  it("is the version @types/bun describes", () => {
    expect(pkg.devDependencies?.["@types/bun"]).toBe(pinned);
  });

  it("is what CI installs, read from package.json rather than restated", () => {
    expect(workflow).toMatch(/bun-version-file:\s*package\.json/);
    expect(workflow).not.toMatch(/bun-version:/);
  });
});

/**
 * CI and `release` run one gate list. Separate lists drifted: CI ran five of
 * the six release gates and left out the one inspecting the tarball.
 */
describe("the gate list", () => {
  it("is what release-checks runs", () => {
    expect(pkg.scripts?.["release-checks"]).toBe("bun ./scripts/releaseChecks.ts");
  });

  it("is what CI runs, with no gate restated as a step of its own", () => {
    expect(workflow).toMatch(/run:\s*bun run release-checks/);
    for (const gate of GATES) {
      expect(workflow).not.toMatch(new RegExp(`run:\\s*bun run ${gate.name}\\b`));
    }
  });

  it("names only scripts package.json defines", () => {
    for (const gate of GATES) {
      const [runner, verb, script] = gate.command;
      expect([runner, verb]).toEqual(["bun", "run"]);
      expect(pkg.scripts?.[script ?? ""], gate.name).toBeDefined();
    }
  });

  it("inspects the tarball and starts the binaries after build, ahead of the suite", () => {
    const names = GATES.map((gate) => gate.name);
    const build = names.indexOf("build");
    expect(names.indexOf("prepack-check")).toBeGreaterThan(build);
    expect(names.indexOf("smoke-bins")).toBeGreaterThan(build);
    expect(names.indexOf("test")).toBeGreaterThan(names.indexOf("smoke-bins"));
  });
});
