/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sqlite } from "workglow";
import { KB_DOCUMENT_TABLE } from "../kb/secKbTables";

/** The partial index the steady-state selection walks. */
const PARTIAL_INDEX = "filing_document_kb_unindexed";

/**
 * Brings `filing_document.kb_indexed_at` up to date and indexes the nulls.
 *
 * Two statements that have to travel together, which is why they are one
 * function rather than a registry entry. The column is a cache of "is there a
 * `kb_document` row for this", and a cache that is added empty is worse than no
 * cache: every row reads as unindexed, so the partial index below covers the
 * whole table and the planner walks it in `filing_date` order, issuing a random
 * probe per row — the access path that measured 11x slower than the plain scan
 * it replaced. Backfilling in the same pass that creates the index is what
 * keeps that state from existing.
 *
 * Both statements are idempotent and cheap on a database already in step: the
 * `UPDATE` matches nothing once every indexed document is stamped, and
 * `CREATE INDEX IF NOT EXISTS` is a catalog read.
 *
 * Callers must have applied the schema's columns first — the column is added
 * generically from the registry, not here — so this no-ops when it is absent
 * rather than assuming an order it cannot see.
 */
export function syncKbIndexedStamp(db: Sqlite.Database): void {
  if (!hasColumn(db, "filing_document", "kb_indexed_at")) return;
  if (!tableExists(db, KB_DOCUMENT_TABLE)) {
    // No knowledge base yet, so nothing is indexed and every row's null is
    // already the truth. The index still pays off on the first `ask`.
    createPartialIndex(db);
    return;
  }

  // `converted_at` rather than a timestamp taken here: the row's own history is
  // a better answer than "whenever someone ran db setup", and it keeps the
  // backfill deterministic, so two runs cannot disagree about a row.
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

  createPartialIndex(db);
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

/** Whether the fast path is available — the column exists, so setup backfilled it. */
export function kbIndexedStampAvailable(db: Sqlite.Database): boolean {
  return hasColumn(db, "filing_document", "kb_indexed_at");
}
