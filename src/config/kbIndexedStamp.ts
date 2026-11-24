/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sqlite } from "workglow";
import { isDryRun } from "../cli/isDryRun";
import { KB_DOCUMENT_TABLE } from "../kb/secKbTables";

/** The partial index the steady-state selection walks. */
const PARTIAL_INDEX = "filing_document_kb_unindexed";

/**
 * Brings `filing_document.kb_indexed_at` into step with the knowledge base and
 * indexes the nulls.
 *
 * Statements that have to travel together, which is why they are one function
 * rather than a registry entry. The column is a cache of "is there a
 * `kb_document` row for this", and a cache that is added empty is worse than no
 * cache: every row reads as unindexed, so the partial index below covers the
 * whole table and the planner walks it in `filing_date` order, issuing a random
 * probe per row — the access path that measured 11x slower than the plain scan
 * it replaced. Backfilling in the same pass that creates the index is what
 * keeps that state from existing.
 *
 * Once backfilled, the stamp is what the index selection reads: null means
 * "not embedded from the conversion on disk". The two ways it can be wrong cost
 * differently. A missing stamp costs one re-embedding. A stamp the knowledge
 * base no longer backs costs the document itself — a filing whose
 * `kb_document` row has gone is never offered again, and a knowledge base
 * rebuilt from empty stays empty. So a stamp the knowledge base does not back
 * is cleared on every pass.
 *
 * Every statement is idempotent and cheap on a database already in step: the
 * backfill runs only in the pass that creates the index, the clear matches
 * nothing once the stamps and the knowledge base agree, and
 * `CREATE INDEX IF NOT EXISTS` is a catalog read.
 *
 * Callers must have applied the schema's columns first — the column is added
 * generically from the registry, not here — so this no-ops when it is absent
 * rather than assuming an order it cannot see.
 */
export function syncKbIndexedStamp(db: Sqlite.Database): void {
  // Raw SQL reaches around the repositories' ReadOnlyTabularStorage wrapper, so
  // the bail lives here rather than at each call site, where a future caller
  // would have to remember it.
  if (isDryRun()) return;
  if (!hasColumn(db, "filing_document", "kb_indexed_at")) return;
  if (!tableExists(db, KB_DOCUMENT_TABLE)) {
    // No knowledge base, so nothing is indexed: a null is already the truth,
    // and any stamp left by one that used to exist is not. The index still
    // pays off on the first `ask`.
    clearStampsWithNoKbRow(db);
    createPartialIndex(db);
    return;
  }

  // Once only, in the pass that creates the partial index, whose presence is
  // what says it ran. Afterwards an unstamped row beside a `kb_document` row is
  // not a gap in the cache but a document re-converted since it was embedded —
  // the conversion clears the stamp — and stamping it would hide it from the
  // index for good, leaving `ask` quoting the old converter's text.
  //
  // `converted_at` rather than a timestamp taken here: the row's own history is
  // a better answer than "whenever someone ran db setup", and it keeps the
  // backfill deterministic, so two runs cannot disagree about a row.
  if (!indexExists(db, PARTIAL_INDEX)) backfillStamps(db);
  clearStampsWithNoKbRow(db);

  createPartialIndex(db);
}

function backfillStamps(db: Sqlite.Database): void {
  db.prepare(
    `UPDATE \`filing_document\`
        SET \`kb_indexed_at\` = \`converted_at\`
      WHERE \`kb_indexed_at\` IS NULL
        AND EXISTS (
              SELECT 1 FROM \`${KB_DOCUMENT_TABLE}\` k
               WHERE k.\`doc_id\` = \`filing_document\`.\`accession_number\`
                                 || ':' || \`filing_document\`.\`doc_file\`
            )`
  ).run();
}

/**
 * Clears every stamp when the knowledge base holds no documents at all.
 *
 * For the path that opens the index before filling it, which is where a rebuild
 * starts: dropping the knowledge-base tables and re-running `sec index`
 * re-creates them empty, and the stamps the previous index left in
 * `filing_document` outlive it. The selection reads the stamp, so those stamps
 * would exclude the whole corpus from the rebuild, and the run would report
 * nothing to do.
 *
 * Cheap enough to run on every open, which the full reconciliation
 * {@link syncKbIndexedStamp} is not: this is one `LIMIT 1` probe wherever the
 * index holds anything, which is the steady state, against a probe per stamped
 * row. The scan it falls through to happens only where nothing is indexed, so
 * it is charged against a run that is about to embed a corpus.
 */
export function clearKbIndexedStampIfIndexEmpty(db: Sqlite.Database): void {
  if (isDryRun()) return;
  if (!hasColumn(db, "filing_document", "kb_indexed_at")) return;
  if (tableExists(db, KB_DOCUMENT_TABLE) && kbHoldsAnyDocument(db)) return;
  db.prepare(
    "UPDATE `filing_document` SET `kb_indexed_at` = NULL WHERE `kb_indexed_at` IS NOT NULL"
  ).run();
}

/**
 * Drops the stamp from every document the knowledge base does not hold, which
 * is all of them when the table itself is gone.
 */
function clearStampsWithNoKbRow(db: Sqlite.Database): void {
  const orphaned = tableExists(db, KB_DOCUMENT_TABLE)
    ? `AND NOT EXISTS (
              SELECT 1 FROM \`${KB_DOCUMENT_TABLE}\` k
               WHERE k.\`doc_id\` = \`filing_document\`.\`accession_number\`
                                 || ':' || \`filing_document\`.\`doc_file\`
            )`
    : "";
  db.prepare(
    `UPDATE \`filing_document\`
        SET \`kb_indexed_at\` = NULL
      WHERE \`kb_indexed_at\` IS NOT NULL
        ${orphaned}`
  ).run();
}

function kbHoldsAnyDocument(db: Sqlite.Database): boolean {
  return db.prepare(`SELECT 1 AS present FROM \`${KB_DOCUMENT_TABLE}\` LIMIT 1`).all().length > 0;
}

/**
 * Indexed on the order the selection reads — newest first, ties by accession —
 * so the same walk serves both the filter and the `ORDER BY`. Partial, because
 * the rows it must not contain are the ones that accumulate: a corpus that is
 * fully indexed leaves it empty, which is the point.
 */
function createPartialIndex(db: Sqlite.Database): void {
  db.prepare(
    `CREATE INDEX IF NOT EXISTS \`${PARTIAL_INDEX}\`
        ON \`filing_document\` (\`filing_date\` DESC, \`accession_number\` DESC)
     WHERE \`kb_indexed_at\` IS NULL`
  ).run();
}

function hasColumn(db: Sqlite.Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(\`${table}\`)`).all() as Array<{ name?: unknown }>;
  return rows.some((row) => row.name === column);
}

function tableExists(db: Sqlite.Database, table: string): boolean {
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").all(table)
      .length > 0
  );
}

/**
 * Whether the stamp can be trusted: the column exists AND the partial index
 * does, because the index is created in the pass that backfills the column. A
 * column added without that pass reads every document as unindexed, and taking
 * it at its word would re-embed the corpus.
 */
export function kbIndexedStampAvailable(db: Sqlite.Database): boolean {
  return hasColumn(db, "filing_document", "kb_indexed_at") && indexExists(db, PARTIAL_INDEX);
}

function indexExists(db: Sqlite.Database, name: string): boolean {
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?").all(name)
      .length > 0
  );
}
