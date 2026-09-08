/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalServiceRegistry } from "workglow";
import type { TableStat } from "../cli/queries/DbStatus";
import { SEC_DB_FOLDER, SEC_DB_NAME, SEC_DB_TYPE } from "../config/tokens";
import { getDb } from "../util/db";
import { SEC_KB_TABLE_NAMES } from "./secKbTables";

/**
 * Row counts for the knowledge base's three tables.
 *
 * `db stats` derives its rows from the storage registry, and these three are
 * not in it: they are a vector store at a fixed width plus its two companions,
 * built lazily against the connection `getDb()` owns. Counting them through a
 * repository token is therefore not available — there is no token — so they are
 * counted here and appended to the report.
 *
 * Returns nothing on a non-SQLite backend. The index is SQLite-only by design
 * and `getSecKnowledgeBase` refuses Postgres by name, so three permanent `n/a`
 * rows would read as a setup gap rather than as an unavailable feature. Also
 * nothing when the SQLite location is unbound: `getDb()` would open a file
 * from an unset folder token, and one unreportable appendix must not cost the
 * operator every row count above it.
 *
 * A table the index has not been built for counts `null`, the same signal a
 * registered table the database has not created reports.
 */
export async function getKbTableStats(): Promise<TableStat[]> {
  const backend = globalServiceRegistry.has(SEC_DB_TYPE)
    ? globalServiceRegistry.get(SEC_DB_TYPE)
    : "sqlite";
  if (backend !== "sqlite") return [];
  if (!globalServiceRegistry.has(SEC_DB_FOLDER) || !globalServiceRegistry.has(SEC_DB_NAME)) {
    return [];
  }

  const db = getDb();
  const present = new Set(
    (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]
    ).map((row) => row.name)
  );

  return SEC_KB_TABLE_NAMES.map((table) => {
    if (!present.has(table)) return { table, rows: null, estimated: false };
    // Safe to interpolate: every name comes from SEC_KB_TABLE_NAMES, which is
    // three compile-time constants. SQLite cannot bind a relation name.
    const counted = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).all() as { n: number }[];
    return { table, rows: Number(counted[0]?.n ?? 0), estimated: false };
  });
}
