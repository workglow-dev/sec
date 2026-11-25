/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { globalServiceRegistry } from "workglow";
import { withSqliteDb } from "../../config/testing/withSqliteDb";
import { FILING_DOCUMENT_REPOSITORY_TOKEN } from "../../storage/document/FilingDocumentSchema";
import { getDb } from "../../util/db";

/**
 * Every conversion reads all of its submission's `filing_document` rows, every
 * co-filer's included, by accession alone. The primary key leads with `cik`, so
 * without an index on `accession_number` that read scans the whole table, and a
 * sweep re-converting N filings costs N full scans.
 */
describe("filing_document by accession (sqlite)", () => {
  withSqliteDb("filing_document_by_accession", [FILING_DOCUMENT_REPOSITORY_TOKEN]);

  it("reads one submission's rows through an index, not a table scan", () => {
    const plan = (
      getDb()
        .prepare("EXPLAIN QUERY PLAN SELECT * FROM `filing_document` WHERE `accession_number` = ?")
        .all("0000320193-26-000001") as Array<{ detail?: string }>
    ).map((row) => row.detail ?? "");
    expect(plan.join(" | ")).toMatch(/\bSEARCH\b.*\bUSING\b.*\bINDEX\b/);
  });

  it("finds every co-filer's rows of the submission", async () => {
    const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    const row = (cik: number, accession: string) => ({
      cik,
      accession_number: accession,
      doc_file: "form8k.htm",
      doc_type: "8-K",
      description: null,
      sequence: 1,
      is_primary: true,
      form: "8-K",
      filing_date: "2026-03-01",
      title: "8-K",
      section_count: 1,
      char_count: 10,
      converter_version: "1",
      converted_at: "2026-03-02T00:00:00.000Z",
      kb_indexed_at: null,
    });
    await repo.put(row(1, "0000000001-26-000001") as never);
    await repo.put(row(2, "0000000001-26-000001") as never);
    await repo.put(row(1, "0000000001-26-000002") as never);
    const found = (await repo.query({ accession_number: "0000000001-26-000001" } as never)) ?? [];
    expect(found.map((r) => Number(r.cik)).sort()).toEqual([1, 2]);
  });
});
