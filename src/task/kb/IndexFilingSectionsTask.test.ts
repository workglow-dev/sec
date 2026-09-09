/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentNode } from "workglow";
import { Document, globalServiceRegistry, NodeKind } from "workglow";
import { withSqliteDb } from "../../config/testing/withSqliteDb";
import { SEC_DRY_RUN } from "../../config/tokens";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "../../kb/secKnowledgeBase";
import {
  FILING_DOCUMENT_REPOSITORY_TOKEN,
  type FilingDocument,
} from "../../storage/document/FilingDocumentSchema";
import { FILING_SECTION_REPOSITORY_TOKEN } from "../../storage/document/FilingSectionSchema";
import { IndexFilingSectionsTask } from "./IndexFilingSectionsTask";
import { kbDocIdFor } from "./selectDocumentsToIndex";

const header = (index: number, filingDate: string): FilingDocument => ({
  cik: 320193,
  accession_number: `0000320193-26-${String(index).padStart(6, "0")}`,
  doc_file: "primary.htm",
  doc_type: "10-K",
  description: null,
  sequence: 1,
  is_primary: true,
  form: "10-K",
  filing_date: filingDate,
  title: `Filing ${index}`,
  section_count: 1,
  char_count: 100,
  converter_version: "1",
  converted_at: "2026-01-01T00:00:00.000Z",
});

/**
 * Embedding is the expensive half, and a `limit` of 0 is what lets these cases
 * exercise the selection — how filings are read, and when the run stops —
 * without loading a model to embed one.
 */
describe("IndexFilingSectionsTask selection", () => {
  withSqliteDb("kb_index_selection", [
    FILING_DOCUMENT_REPOSITORY_TOKEN,
    FILING_SECTION_REPOSITORY_TOKEN,
  ]);

  afterEach(async () => {
    await resetSecKnowledgeBaseForTesting();
  });

  const seed = async (count: number, filingDate = "2026-01-02"): Promise<void> => {
    const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    for (let index = 0; index < count; index += 1) {
      await repo.put(header(index, filingDate));
    }
  };

  /** Mark a filing as already in the knowledge base. */
  const markIndexed = async (index: number): Promise<void> => {
    const kb = await getSecKnowledgeBase();
    const title = `Filing ${index}`;
    const root = { kind: NodeKind.DOCUMENT, title, children: [] } as unknown as DocumentNode;
    const docId = kbDocIdFor(`0000320193-26-${String(index).padStart(6, "0")}`, "primary.htm");
    await kb.upsertDocument(new Document(root, { title } as never, [], docId));
  };

  it("picks the work in the database rather than reading headers to sift them", async () => {
    await seed(5);
    const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    const reads = (["getAll", "records", "query", "queryPage"] as const).map((method) =>
      vi.spyOn(repo, method)
    );

    const out = await new IndexFilingSectionsTask().run({ cik: 320193, limit: 0 });

    // Reading headers to decide is the whole converted corpus crossing the
    // process boundary to take the first few of it.
    for (const read of reads) expect(read).not.toHaveBeenCalled();
    expect(out.truncated).toBe(true);
  });

  it("still reports what is already indexed once nothing is left to do", async () => {
    // The count `sec index` prints, and what makes it suggest asking a question
    // rather than converting filings there are none of.
    await seed(3);
    for (const index of [0, 1, 2]) await markIndexed(index);

    const out = await new IndexFilingSectionsTask().run({ limit: 5 });

    expect(out).toMatchObject({ indexed: 0, sections: 0, skipped: 3, truncated: false });
  });

  it("spends its limit on filings that need work, not on ones already indexed", async () => {
    // The defect: `limit` counted filings INDEXED, and an already-indexed one
    // was skipped without counting toward it — so a small limit on an indexed
    // corpus read every row and probed the knowledge base once per row.
    await seed(4);
    await markIndexed(0);
    await markIndexed(1);
    const kb = await getSecKnowledgeBase();
    const getDocument = vi.spyOn(kb, "getDocument");

    const out = await new IndexFilingSectionsTask().run({ limit: 2 });

    expect(getDocument).not.toHaveBeenCalled();
    expect(out).toMatchObject({ skipped: 2, truncated: false });
  });

  it("reports no truncation when the scope leaves nothing to index", async () => {
    // Every filing predates `since`, so the run stopping at its limit would be
    // a lie: there is nothing behind it. `sec ask` prints that as advice to run
    // a build that has no work to do.
    await seed(3, "2020-01-02");

    const out = await new IndexFilingSectionsTask().run({ since: "2026-01-01", limit: 0 });

    expect(out).toMatchObject({ indexed: 0, skipped: 0, truncated: false });
  });

  it("reports no truncation when there is nothing converted at all", async () => {
    const out = await new IndexFilingSectionsTask().run({ limit: 0 });

    expect(out).toMatchObject({ indexed: 0, sections: 0, skipped: 0, truncated: false });
  });
});

/**
 * `--dry-run` promises to change nothing, and `runCommand` prints that promise
 * before the task runs. The knowledge base's three storages are built directly
 * against `getDb()` rather than through `createStorage`, so no
 * `ReadOnlyTabularStorage` wrapper stands between this task and a real write —
 * and the guard that recognised that covered only the DDL and the `kb_index`
 * row, not the documents and chunk vectors the ingest lands.
 */
describe("IndexFilingSectionsTask under --dry-run", () => {
  withSqliteDb("kb_index_dry", [FILING_DOCUMENT_REPOSITORY_TOKEN, FILING_SECTION_REPOSITORY_TOKEN]);

  beforeEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    const documents = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    await documents.put(header(0, "2026-01-02"));
    const sections = globalServiceRegistry.get(FILING_SECTION_REPOSITORY_TOKEN);
    await sections.put({
      cik: 320193,
      accession_number: "0000320193-26-000000",
      doc_file: "primary.htm",
      ordinal: 0,
      slug: "risk-factors",
      title: "Risk Factors",
      depth: 1,
      char_count: 24,
      markdown: "# Risk Factors\n\nProse.",
    });
  });

  afterEach(async () => {
    globalServiceRegistry.registerInstance(SEC_DRY_RUN, false);
    await resetSecKnowledgeBaseForTesting();
  });

  it("embeds and persists nothing", async () => {
    // Opened first, so the tables exist: `getSecKnowledgeBase`'s own dry-run
    // refusal covers the index that does not exist yet, and an already-indexed
    // database is the case it lets through.
    const kb = await getSecKnowledgeBase();
    const upsert = vi
      .spyOn(kb, "upsert")
      .mockResolvedValue({ doc_id: "0000320193-26-000000:primary.htm" } as never);

    globalServiceRegistry.registerInstance(SEC_DRY_RUN, true);
    const out = await new IndexFilingSectionsTask().run({});

    expect(upsert).not.toHaveBeenCalled();
    expect(out).toMatchObject({ success: true, indexed: 0, sections: 0 });
  });

  it("still indexes when this is not a dry run", async () => {
    const kb = await getSecKnowledgeBase();
    const upsert = vi
      .spyOn(kb, "upsert")
      .mockResolvedValue({ doc_id: "0000320193-26-000000:primary.htm" } as never);

    globalServiceRegistry.registerInstance(SEC_DRY_RUN, false);
    const out = await new IndexFilingSectionsTask().run({});

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ success: true, indexed: 1, sections: 1 });
  });
});
