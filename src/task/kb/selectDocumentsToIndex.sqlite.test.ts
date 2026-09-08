/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DocumentNode } from "workglow";
import { Document, globalServiceRegistry, NodeKind } from "workglow";
import { withSqliteDb } from "../../config/testing/withSqliteDb";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "../../kb/secKnowledgeBase";
import {
  FILING_DOCUMENT_REPOSITORY_TOKEN,
  type FilingDocument,
} from "../../storage/document/FilingDocumentSchema";
import { countAlreadyIndexed, kbDocIdFor, selectDocumentsToIndex } from "./selectDocumentsToIndex";

const doc = (index: number, over: Partial<FilingDocument> = {}): FilingDocument => ({
  cik: 320193,
  accession_number: `0000320193-26-${String(index).padStart(6, "0")}`,
  doc_file: "primary.htm",
  doc_type: "10-K",
  description: null,
  sequence: 1,
  is_primary: true,
  form: "10-K",
  filing_date: "2026-03-01",
  title: `Filing ${index}`,
  section_count: 1,
  char_count: 100,
  converter_version: "1",
  converted_at: "2026-01-01T00:00:00.000Z",
  ...over,
});

/**
 * `limit` used to bound the number of documents INDEXED, and an already-indexed
 * one was skipped without counting toward it. So a small `--limit` on a corpus
 * that is already indexed read every row and probed the knowledge base once per
 * row before concluding there was nothing to do — and `sec ask` builds the
 * index implicitly, so that ran on every question.
 *
 * These cases are about which rows come back and how many, not about embedding.
 */
describe("selectDocumentsToIndex (sqlite)", () => {
  withSqliteDb("select_documents_to_index", [FILING_DOCUMENT_REPOSITORY_TOKEN]);

  beforeEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    delete process.env.SEC_EMBEDDING_MODEL;
  });

  afterEach(async () => {
    await resetSecKnowledgeBaseForTesting();
  });

  async function seed(count: number, over: (i: number) => Partial<FilingDocument> = () => ({})) {
    const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    for (let i = 1; i <= count; i += 1) await repo.put(doc(i, over(i)) as never);
  }

  /** Mark a document as already in the knowledge base. */
  async function markIndexed(index: number) {
    const kb = await getSecKnowledgeBase();
    const title = `Filing ${index}`;
    const root = { kind: NodeKind.DOCUMENT, title, children: [] } as unknown as DocumentNode;
    const docId = kbDocIdFor(`0000320193-26-${String(index).padStart(6, "0")}`, "primary.htm");
    await kb.upsertDocument(new Document(root, { title } as never, [], docId));
  }

  it("returns nothing once every document is indexed", async () => {
    await seed(3);
    for (const i of [1, 2, 3]) await markIndexed(i);

    expect(await selectDocumentsToIndex({ limit: 5 })).toEqual([]);
  });

  it("counts the limit in documents that need work, not documents examined", async () => {
    // The defect: two of five are already indexed, so a limit of 2 must return
    // the two that are NOT — never fewer because the indexed ones consumed it.
    await seed(5);
    await markIndexed(1);
    await markIndexed(2);

    const picked = await selectDocumentsToIndex({ limit: 2 });

    expect(picked).toHaveLength(2);
    expect(picked.map((d) => d.accession_number)).not.toContain("0000320193-26-000001");
    expect(picked.map((d) => d.accession_number)).not.toContain("0000320193-26-000002");
  });

  it("re-selects everything under force", async () => {
    await seed(3);
    for (const i of [1, 2, 3]) await markIndexed(i);

    expect(await selectDocumentsToIndex({ limit: 5, force: true })).toHaveLength(3);
  });

  it("applies `since` in the query rather than after it", async () => {
    await seed(4, (i) => ({ filing_date: i <= 2 ? "2020-01-01" : "2026-06-01" }));

    const picked = await selectDocumentsToIndex({ limit: 10, since: "2026-01-01" });

    expect(picked).toHaveLength(2);
    expect(picked.every((d) => (d.filing_date ?? "") >= "2026-01-01")).toBe(true);
  });

  it("narrows by cik, form and accession", async () => {
    await seed(3, (i) => ({ form: i === 2 ? "8-K" : "10-K" }));

    expect(await selectDocumentsToIndex({ limit: 10, form: "8-K" })).toHaveLength(1);
    expect(await selectDocumentsToIndex({ limit: 10, cik: 999 })).toHaveLength(0);
    expect(
      await selectDocumentsToIndex({ limit: 10, accession: "0000320193-26-000003" })
    ).toHaveLength(1);
  });

  it("returns newest first, so an interrupted backfill covers what people read", async () => {
    await seed(3, (i) => ({ filing_date: `2026-0${i}-01` }));

    const picked = await selectDocumentsToIndex({ limit: 3 });

    expect(picked.map((d) => d.filing_date)).toEqual(["2026-03-01", "2026-02-01", "2026-01-01"]);
  });

  it("leaves out documents with no sections, which can never be indexed", async () => {
    // They embed nothing, so they never enter the knowledge base — selecting
    // them spends the limit on work that cannot happen, on every run.
    await seed(3, (i) => ({ section_count: i === 2 ? 0 : 1 }));

    const picked = await selectDocumentsToIndex({ limit: 10 });

    expect(picked.map((d) => d.accession_number)).not.toContain("0000320193-26-000002");
    expect(picked).toHaveLength(2);
  });

  it("counts nothing as already indexed before the index exists", async () => {
    // The knowledge-base tables are built by the first command that opens the
    // index, and this runs before that — a database with converted filings and
    // no index has no table to join against.
    await seed(2);

    expect(await selectDocumentsToIndex({ limit: 10 })).toHaveLength(2);
    expect(await countAlreadyIndexed({})).toBe(0);
  });

  it("returns nothing for a non-positive limit rather than everything", async () => {
    await seed(2);
    expect(await selectDocumentsToIndex({ limit: 0 })).toEqual([]);
  });
});
