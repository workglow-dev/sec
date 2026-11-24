/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A co-filed accession — a holding company and its subsidiaries on one 8-K —
 * is converted once per CIK, from the same bytes. Its XBRL facts are keyed by
 * accession, so a conversion that deletes and rewrites them under its own CIK
 * erases every other filer's view of them: `sec show xbrl --cik <first>` went
 * empty while whichever subsidiary converted last appeared to own the facts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalServiceRegistry, type IExecuteContext } from "workglow";
import { queryXbrlFacts } from "../../cli/queries/XbrlQuery";
import { resetDependencyInjectionsForTesting } from "../../config/TestingDI";
import { FILING_DOCUMENT_REPOSITORY_TOKEN } from "../../storage/document/FilingDocumentSchema";
import { FILING_SECTION_REPOSITORY_TOKEN } from "../../storage/document/FilingSectionSchema";
import { XBRL_FACT_REPOSITORY_TOKEN } from "../../storage/xbrl/XbrlFactSchema";
import {
  ConvertFilingDocumentTask,
  type ConvertFilingDocumentTaskInput,
} from "./ConvertFilingDocumentTask";
import { FILING_CONVERTER_VERSION } from "./convertFilingDocument";

const PARENT = 111;
const SUBSIDIARY = 222;
const ACCESSION = "0000000111-26-000001";

const HEADING = 'style="font-weight:700;text-align:center;font-size:14pt"';
const CONTEXT =
  '<xbrli:context id="c1"><xbrli:entity><xbrli:identifier scheme="urn:test">111' +
  "</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>2026-03-31" +
  "</xbrli:instant></xbrli:period></xbrli:context>";
const fact = (name: string, value: string): string =>
  `<ix:nonNumeric name="${name}" contextRef="c1">${value}</ix:nonNumeric>`;
const body = (...facts: string[]): string => `<html><body>
  <div style="display:none"><ix:header><ix:resources>${CONTEXT}</ix:resources></ix:header></div>
  <p ${HEADING}>COVER PAGE</p>
  <p>${facts.join(" ")}</p>
</body></html>`;

const TWO_FACTS = body(
  fact("dei:EntityRegistrantName", "Example Holdings"),
  fact("dei:DocumentType", "8-K")
);

class StubbedConvert extends ConvertFilingDocumentTask {
  constructor(
    defaults: ConvertFilingDocumentTaskInput,
    private readonly html: string
  ) {
    super({ defaults });
  }
  protected override async loadSource(
    _input: ConvertFilingDocumentTaskInput,
    _context: IExecuteContext
  ): Promise<{ text: string; docFile: string; fromCache: boolean } | undefined> {
    return { text: this.html, docFile: "form8k.htm", fromCache: true };
  }
}

const convert = async (cik: number, html: string = TWO_FACTS): Promise<number> => {
  const out = await new StubbedConvert(
    { cik, accessionNumber: ACCESSION, form: "8-K", filingDate: "2026-04-01" },
    html
  ).run();
  return out.xbrlFacts as number;
};

describe("ConvertFilingDocumentTask on a co-filed accession", () => {
  beforeEach(async () => {
    resetDependencyInjectionsForTesting();
    await globalServiceRegistry.get(FILING_SECTION_REPOSITORY_TOKEN).setupDatabase();
    await globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN).setupDatabase();
    await globalServiceRegistry.get(XBRL_FACT_REPOSITORY_TOKEN).setupDatabase();
  });

  it("keeps the facts answering for every filer", async () => {
    expect(await convert(PARENT)).toBe(2);
    expect(await convert(SUBSIDIARY)).toBe(0);

    expect((await queryXbrlFacts({ cik: PARENT })).total).toBe(2);
    expect((await queryXbrlFacts({ cik: SUBSIDIARY })).total).toBe(2);
    // Stored once, not once per filer.
    expect((await queryXbrlFacts({ accession: ACCESSION })).total).toBe(2);
  });

  it("finds the facts by CIK with a concept filter too", async () => {
    await convert(PARENT);
    await convert(SUBSIDIARY);

    const result = await queryXbrlFacts({ cik: SUBSIDIARY, concept: "registrantname" });
    expect(result.rows.map((row) => row.value_text)).toEqual(["Example Holdings"]);
  });

  it("re-extracts when the co-filer's conversion is from an older converter", async () => {
    await convert(PARENT);
    const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    const [primary] = (await repo.query({ cik: PARENT } as never)) ?? [];
    await repo.put({ ...primary!, converter_version: `${FILING_CONVERTER_VERSION}-old` });

    expect(
      await convert(SUBSIDIARY, body(fact("dei:EntityRegistrantName", "Example Holdings")))
    ).toBe(1);
    // The stale second fact from the older pass is trimmed, and both filers
    // still see what is left.
    expect((await queryXbrlFacts({ accession: ACCESSION })).total).toBe(1);
    expect((await queryXbrlFacts({ cik: PARENT })).total).toBe(1);
  });

  it("writes the new facts before trimming, so a rejected write keeps the old ones", async () => {
    await convert(PARENT);
    const facts = globalServiceRegistry.get(XBRL_FACT_REPOSITORY_TOKEN);
    vi.spyOn(facts, "putBulk").mockRejectedValueOnce(new Error("value too long"));

    await expect(convert(PARENT)).rejects.toThrow(/value too long/);

    expect((await queryXbrlFacts({ accession: ACCESSION })).total).toBe(2);
  });
});
