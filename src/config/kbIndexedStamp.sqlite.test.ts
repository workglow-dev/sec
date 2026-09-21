/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DocumentNode } from "workglow";
import { Document, globalServiceRegistry, NodeKind } from "workglow";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "../kb/secKnowledgeBase";
import {
  FILING_DOCUMENT_REPOSITORY_TOKEN,
  type FilingDocument,
} from "../storage/document/FilingDocumentSchema";
import { kbDocIdFor } from "../task/kb/selectDocumentsToIndex";
import { selectDocumentsToIndex } from "../task/kb/selectDocumentsToIndex";
import { getDb } from "../util/db";
import { syncKbIndexedStamp } from "./kbIndexedStamp";
import { withSqliteDb } from "./testing/withSqliteDb";

const accession = (index: number) => `0000320193-26-${String(index).padStart(6, "0")}`;

const doc = (index: number, over: Partial<FilingDocument> = {}): FilingDocument => ({
  cik: 320193,
  accession_number: accession(index),
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
  kb_indexed_at: null,
  ...over,
});

/**
 * The stamp is a cache of "is there a `kb_document` row for this", and the three
 * properties below are what make it safe to read: it never claims more than the
 * anti-join, `db setup` never leaves it empty, and the steady state stops
 * touching the table.
 */
describe("kb_indexed_at stamp (sqlite)", () => {
  withSqliteDb("kb_indexed_stamp", [FILING_DOCUMENT_REPOSITORY_TOKEN]);

  beforeEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    delete process.env.SEC_EMBEDDING_MODEL;
  });
  afterEach(async () => {
    await resetSecKnowledgeBaseForTesting();
  });

  async function seed(count: number) {
    const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
    for (let i = 1; i <= count; i += 1) await repo.put(doc(i) as never);
  }

  async function putInKb(index: number) {
    const kb = await getSecKnowledgeBase();
    const title = `Filing ${index}`;
    const root = { kind: NodeKind.DOCUMENT, title, children: [] } as unknown as DocumentNode;
    await kb.upsertDocument(
      new Document(root, { title } as never, [], kbDocIdFor(accession(index), "primary.htm"))
    );
  }

  const stampOf = (index: number): string | null =>
    (
      getDb()
        .prepare("SELECT `kb_indexed_at` AS s FROM `filing_document` WHERE `accession_number` = ?")
        .get(accession(index)) as { s: string | null } | undefined
    )?.s ?? null;

  it("backfills a database whose documents were indexed before the column existed", async () => {
    // The state every existing deployment is in: rows in the knowledge base,
    // no stamp. Left un-backfilled the partial index would cover the whole
    // table and the selection would walk it, which is the plan this replaces.
    await seed(3);
    await putInKb(1);
    await putInKb(2);

    syncKbIndexedStamp(getDb());

    expect(stampOf(1)).not.toBeNull();
    expect(stampOf(2)).not.toBeNull();
    expect(stampOf(3)).toBeNull();
  });

  it("is idempotent, and does not restamp a row on a second run", async () => {
    await seed(1);
    await putInKb(1);

    syncKbIndexedStamp(getDb());
    const first = stampOf(1);
    syncKbIndexedStamp(getDb());

    expect(stampOf(1)).toBe(first);
  });

  it("creates the partial index, and the steady state reads it instead of the table", async () => {
    await seed(3);
    for (const i of [1, 2, 3]) await putInKb(i);
    syncKbIndexedStamp(getDb());

    const plan = getDb()
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT d.* FROM \`filing_document\` d
          WHERE d.\`section_count\` > 0 AND d.\`kb_indexed_at\` IS NULL
          ORDER BY d.\`filing_date\` DESC, d.\`accession_number\` DESC`
      )
      .all() as Array<{ detail?: string }>;
    const detail = plan.map((row) => row.detail ?? "").join(" | ");

    expect(detail).toContain("filing_document_kb_unindexed");
    // The point of the partial index: no table scan, and no temp B-tree to
    // sort what a scan would have produced.
    expect(detail).not.toContain("SCAN d\n");
    expect(detail).not.toContain("TEMP B-TREE");
  });

  it("never widens the selection: an unstamped document already in the kb is still skipped", async () => {
    // The stamp is a narrowing of the anti-join, never a replacement for it.
    // If a stamp goes missing — a crash between the upsert and the stamp, a
    // database restored from before the backfill — the anti-join still has to
    // keep that document out, because indexing it twice spends embedding calls.
    await seed(2);
    await putInKb(1);
    // Deliberately NOT stamped.
    expect(stampOf(1)).toBeNull();

    const picked = await selectDocumentsToIndex({ limit: 10 });

    expect(picked.map((d) => d.accession_number)).toEqual([accession(2)]);
  });
});
