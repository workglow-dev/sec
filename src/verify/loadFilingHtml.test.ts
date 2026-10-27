/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IExecuteContext } from "workglow";
import { resetDependencyInjectionsForTesting } from "../config/TestingDI";
import { EntityRepo } from "../storage/entity/EntityRepo";
import type { Filing } from "../storage/filing/FilingSchema";
import { loadFilingHtml } from "./loadFilingHtml";

const CIK = 1811882;
const ACCESSION = "0001213900-26-000001";

function recordFiling(primary_doc: string, form: string): void {
  vi.spyOn(EntityRepo.prototype, "getFiling").mockResolvedValue({
    cik: CIK,
    accession_number: ACCESSION,
    form,
    primary_doc,
  } as unknown as Filing);
}

/**
 * `sec read --fetch` reaches EDGAR for a filing named only by CIK and
 * accession, using the `primary_doc` the filer recorded. A name that is not
 * one file in the accession folder is refused before any request.
 */
describe("loadFilingHtml with an unsafe primary_doc", () => {
  beforeEach(() => {
    resetDependencyInjectionsForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["../../x", "a?b", "a#b"])("refuses %j and fetches nothing", async (primaryDoc) => {
    recordFiling(primaryDoc, "DEF 14A");
    const own = vi.fn();
    const context = { own, disown: vi.fn() } as unknown as IExecuteContext;

    await expect(
      loadFilingHtml({ cik: CIK, accession: ACCESSION, allowFetch: true }, context)
    ).rejects.toThrow(`Refusing unsafe primary_doc for ${CIK}/${ACCESSION}`);
    expect(own).not.toHaveBeenCalled();
  });

  it("still fetches the whole submission for a form read that way", async () => {
    // An 8-K is read from its `.txt`; the unsafe name is never part of the URL.
    recordFiling("a?b", "8-K");
    const run = vi.fn().mockResolvedValue({ text: "<html>8-K</html>" });
    const own = vi.fn((task: { defaults: { fileName: string } }) => {
      expect(task.defaults.fileName).toBe(`${ACCESSION}.txt`);
      return { run };
    });
    const context = { own, disown: vi.fn() } as unknown as IExecuteContext;

    const source = await loadFilingHtml(
      { cik: CIK, accession: ACCESSION, allowFetch: true },
      context
    );
    expect(source.html).toBe("<html>8-K</html>");
    expect(own).toHaveBeenCalledTimes(1);
  });
});
