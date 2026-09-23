/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DocumentNode } from "workglow";
import { Document, globalServiceRegistry, NodeKind } from "workglow";
import { KB_DOCUMENT_TABLE, SEC_KB_TABLE_NAMES } from "../kb/secKbTables";
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
import { SEC_DRY_RUN } from "./tokens";

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
 * The stamp is a cache of "is there a `kb_document` row for this", and the
 * properties below are what make it safe to read: it never claims more than the
 * anti-join, `db setup` never leaves it empty, a stamp the knowledge base stops
 * backing is cleared rather than left to hide the document, and the steady state
 * stops touching the table.
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

  const selectionPlan = (): string[] =>
    (
      getDb()
        .prepare(
          `EXPLAIN QUERY PLAN
           SELECT d.* FROM \`filing_document\` d
            WHERE d.\`section_count\` > 0 AND d.\`kb_indexed_at\` IS NULL
            ORDER BY d.\`filing_date\` DESC, d.\`accession_number\` DESC`
        )
        .all() as Array<{ detail?: string }>
    ).map((row) => row.detail ?? "");

  const selectionPlanDetail = (): string => selectionPlan().join(" | ");

  /** A plan step that walks `filing_document` itself rather than an index. */
  const scansTheTable = (): boolean =>
    selectionPlan().some((step) => /^SCAN\b/.test(step) && !/\bUSING\b.*\bINDEX\b/.test(step));

  const indexExists = (name: string): boolean =>
    getDb().prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?").all(name)
      .length > 0;

  const dropKbTables = (): void => {
    for (const table of SEC_KB_TABLE_NAMES) getDb().exec(`DROP TABLE \`${table}\``);
  };

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

    // One access path and it is the partial index — which on a fully indexed
    // corpus holds nothing, so the selection reads no rows at all. Spelled as
    // the whole plan rather than a substring: SQLite reports a walk of the
    // partial index as `SCAN d USING INDEX …` too, so a check for the absence
    // of "SCAN" says nothing about which index is being walked.
    const plan = selectionPlan();
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatch(/\bUSING\b.*\bINDEX filing_document_kb_unindexed\b/);
    // No step reaches the table itself, and none sorts into a temp B-tree.
    expect(scansTheTable()).toBe(false);
    expect(selectionPlanDetail()).not.toContain("TEMP B-TREE");
  });

  it("falls back to an index over every row once the partial index is dropped", async () => {
    // What gives the assertions above their teeth, and names what they buy.
    // Without the partial index the planner still avoids a table scan — the
    // schema carries a `filing_date, accession_number` index that serves the
    // ORDER BY — so the cost of losing it is not a scan but an index that
    // covers the whole corpus instead of only its unindexed tail.
    await seed(3);
    for (const i of [1, 2, 3]) await putInKb(i);
    syncKbIndexedStamp(getDb());

    getDb().exec("DROP INDEX `filing_document_kb_unindexed`");

    expect(selectionPlanDetail()).not.toContain("filing_document_kb_unindexed");
    expect(selectionPlanDetail()).toContain("filing_document_filing_date_accession_number");
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

  it("clears a stamp the knowledge base no longer backs", async () => {
    // The direction that costs a document rather than a traversal: the
    // selection reads the stamp as a narrowing of its anti-join, so a stamp
    // outliving its `kb_document` row hides a filing that is no longer indexed.
    await seed(2);
    await putInKb(1);
    await putInKb(2);
    syncKbIndexedStamp(getDb());
    expect(stampOf(2)).not.toBeNull();

    getDb()
      .prepare(`DELETE FROM \`${KB_DOCUMENT_TABLE}\` WHERE \`doc_id\` = ?`)
      .run(kbDocIdFor(accession(2), "primary.htm"));
    syncKbIndexedStamp(getDb());

    expect(stampOf(1)).not.toBeNull();
    expect(stampOf(2)).toBeNull();

    const picked = await selectDocumentsToIndex({ limit: 10 });
    expect(picked.map((d) => d.accession_number)).toEqual([accession(2)]);
  });

  it("clears every stamp when the knowledge base tables are gone", async () => {
    await seed(2);
    await putInKb(1);
    syncKbIndexedStamp(getDb());
    expect(stampOf(1)).not.toBeNull();

    await resetSecKnowledgeBaseForTesting();
    dropKbTables();
    syncKbIndexedStamp(getDb());

    expect(stampOf(1)).toBeNull();
  });

  it("re-offers every document after the index is dropped and rebuilt empty", async () => {
    // The documented way to change the embedding model: drop the three tables
    // and re-run `sec index`. Opening the index re-creates `kb_document` empty,
    // so the anti-join has nothing to exclude — and the stamps the previous
    // index left behind must not exclude anything either, or the rebuild
    // indexes nothing and `sec ask` answers from an empty index.
    await seed(3);
    for (const i of [1, 2, 3]) await putInKb(i);
    syncKbIndexedStamp(getDb());
    expect(stampOf(1)).not.toBeNull();

    await resetSecKnowledgeBaseForTesting();
    dropKbTables();
    await getSecKnowledgeBase();

    const picked = await selectDocumentsToIndex({ limit: 10 });

    expect(picked.map((d) => d.accession_number)).toEqual([
      accession(3),
      accession(2),
      accession(1),
    ]);
  });

  it("leaves the stamps alone when the index still holds documents", async () => {
    // The other half of the rule above: re-opening a populated index must not
    // throw away the stamps, which would put the whole corpus back in front of
    // every run.
    await seed(2);
    await putInKb(1);
    syncKbIndexedStamp(getDb());
    const stamp = stampOf(1);

    await resetSecKnowledgeBaseForTesting();
    await getSecKnowledgeBase();

    expect(stampOf(1)).toBe(stamp);
  });

  it("writes nothing under a dry run", async () => {
    // Raw SQL goes around the ReadOnlyTabularStorage wrapper `--dry-run`
    // installs, so the bail lives in the function rather than at its callers.
    await seed(1);
    await putInKb(1);

    globalServiceRegistry.registerInstance(SEC_DRY_RUN, true);
    try {
      syncKbIndexedStamp(getDb());
    } finally {
      globalServiceRegistry.registerInstance(SEC_DRY_RUN, false);
    }

    expect(stampOf(1)).toBeNull();
    expect(indexExists("filing_document_kb_unindexed")).toBe(false);
  });
});
