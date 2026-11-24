/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDb } from "../util/db";
import { type MaybeDurable, resolveSqlBackend } from "../util/sqlBackend";
import { KB_CHUNK_TABLE, KB_DOCUMENT_TABLE } from "./secKbTables";

/**
 * Removes documents and their chunks from the knowledge base, returning how
 * many document rows went.
 *
 * Raw SQL rather than `KnowledgeBase.deleteDocument`, because the caller is the
 * converter, which has no business opening the index: that resolves the
 * embedding model and refuses when it differs from the one that built the
 * index, and a conversion must not fail over a setting only `ask` reads. The
 * knowledge base holds no text index, so the two tables are all there is.
 *
 * A no-op wherever the index cannot exist — any backend but the SQLite
 * connection `getDb()` owns, a non-durable document repository (`repo`), a dry
 * run, or a database never indexed — because there is nothing there to purge.
 */
export function purgeKbDocuments(
  docIds: readonly string[],
  repo: MaybeDurable | undefined
): number {
  if (docIds.length === 0) return 0;
  if (resolveSqlBackend("write", repo) !== "sqlite") return 0;
  const db = getDb();
  const tables = new Set(
    db
      .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
  );
  if (!tables.has(KB_DOCUMENT_TABLE)) return 0;

  const deleteChunks = tables.has(KB_CHUNK_TABLE)
    ? db.prepare<[string], unknown>(`DELETE FROM \`${KB_CHUNK_TABLE}\` WHERE \`doc_id\` = ?`)
    : undefined;
  const deleteDocument = db.prepare<[string], unknown>(
    `DELETE FROM \`${KB_DOCUMENT_TABLE}\` WHERE \`doc_id\` = ?`
  );
  // Chunks first, in one transaction: a document row left without its chunks
  // is harmless, but chunks outliving their document are still searched and
  // cited with nothing to resolve them against.
  let removed = 0;
  const purge = db.transaction((ids: readonly string[]) => {
    for (const id of ids) {
      deleteChunks?.run(id);
      removed += Number(deleteDocument.run(id).changes);
    }
  });
  purge(docIds);
  return removed;
}
