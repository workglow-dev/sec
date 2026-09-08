/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { globalServiceRegistry } from "workglow";
import { withSqliteDb } from "../config/testing/withSqliteDb";
import { resetDependencyInjectionsForTesting } from "../config/TestingDI";
import { SEC_DB_TYPE } from "../config/tokens";
import { getKbTableStats } from "./kbTableStats";
import { SEC_KB_TABLE_NAMES } from "./secKbTables";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "./secKnowledgeBase";

/**
 * `db stats` loops the storage registry, and the knowledge base's three tables
 * are deliberately not in it — they are built lazily against the `getDb()`
 * connection. The consequence was that an operator had no way to see whether an
 * index existed or how large it was.
 */
describe("getKbTableStats", () => {
  withSqliteDb("kb_stats", []);

  beforeEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    delete process.env.SEC_EMBEDDING_MODEL;
  });

  afterEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    delete process.env.SEC_EMBEDDING_MODEL;
  });

  it("reports every knowledge-base table as n/a before the index is built", async () => {
    // `null` is the same "registered, not created" signal the registry tables
    // use, so the report reads the same whether or not an index exists.
    expect(await getKbTableStats()).toEqual(
      SEC_KB_TABLE_NAMES.map((table) => ({ table, rows: null, estimated: false }))
    );
  });

  it("counts the tables once the index exists", async () => {
    await getSecKnowledgeBase();

    const stats = await getKbTableStats();

    expect(stats.map((s) => s.table)).toEqual([...SEC_KB_TABLE_NAMES]);
    // kb_index carries the one row recording which model built the index; the
    // document and chunk tables are created empty.
    expect(stats.find((s) => s.table === "kb_index")?.rows).toBe(1);
    expect(stats.find((s) => s.table === "kb_document")?.rows).toBe(0);
    expect(stats.find((s) => s.table === "kb_chunk")?.rows).toBe(0);
    expect(stats.every((s) => s.estimated === false)).toBe(true);
  });
});

describe("getKbTableStats on a non-SQLite backend", () => {
  beforeEach(() => resetDependencyInjectionsForTesting());
  afterEach(() => resetDependencyInjectionsForTesting());

  it("reports nothing rather than n/a", async () => {
    // The index is SQLite-only by design — `getSecKnowledgeBase` refuses
    // Postgres by name. Three permanent `n/a` rows would read as a setup gap an
    // operator could close, and there is nothing to close.
    globalServiceRegistry.registerInstance(SEC_DB_TYPE, "postgres");
    expect(await getKbTableStats()).toEqual([]);
  });
});

describe("getKbTableStats with no SQLite location bound", () => {
  beforeEach(() => resetDependencyInjectionsForTesting());
  afterEach(() => resetDependencyInjectionsForTesting());

  it("reports nothing rather than opening a database from an unset folder", async () => {
    // `db stats` degrades one unreadable table to n/a rather than losing the
    // whole report; an appendix that cannot be read at all is the same promise.
    expect(await getKbTableStats()).toEqual([]);
  });
});
