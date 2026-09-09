/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChunkVectorPrimaryKey, ChunkVectorStorageSchema, SqliteVectorStorage } from "workglow";
import { withSqliteDb } from "../config/testing/withSqliteDb";
import { getDb } from "../util/db";
import { KB_CHUNK_TABLE } from "./secKbTables";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "./secKnowledgeBase";

/** Narrow enough to seed a few thousand rows without a real embedding model. */
const DIMENSIONS = 4;
const CHUNKS = 1200;

/**
 * Similarity to `[1, 0, 0, 0]` is `1 / sqrt(1 + spread²)`, so the best chunks
 * are the ones with the smallest spread — and the seeding puts those LAST in
 * `chunk_id` order, where a scan that stops early would never reach them.
 */
function seedVector(index: number): Float32Array {
  return new Float32Array([1, CHUNKS - 1 - index, 0, 0]);
}

function chunkId(index: number): string {
  return `c${String(index).padStart(5, "0")}`;
}

/**
 * `sec index` is documented as a build that "takes hours to days", and `sec
 * ask` tells the user to run it. The query side has to survive what that
 * builds: the inherited `SqliteVectorStorage.similaritySearch` is
 * `SELECT * FROM kb_chunk` with no bound, followed by a JS cosine per row, so
 * every question hydrated the entire index — text and a JSON-encoded vector per
 * row — before scoring one query.
 */
describe("the SEC knowledge base's chunk search", () => {
  withSqliteDb("kb_search", []);

  beforeEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    process.env.SEC_EMBEDDING_MODEL = "onnx:test/fixture-encoder";
    process.env.SEC_EMBEDDING_DIMENSIONS = String(DIMENSIONS);
  });

  afterEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    delete process.env.SEC_EMBEDDING_MODEL;
    delete process.env.SEC_EMBEDDING_DIMENSIONS;
  });

  it("reads kb_chunk in bounded pages and still ranks the whole index", async () => {
    // Opening the base creates the three tables; the seeding then writes
    // through a plain vector storage onto the very same table.
    const kb = await getSecKnowledgeBase();
    const seeder = new SqliteVectorStorage(
      getDb(),
      KB_CHUNK_TABLE,
      ChunkVectorStorageSchema,
      ChunkVectorPrimaryKey,
      [],
      DIMENSIONS
    );
    await seeder.putBulk(
      Array.from({ length: CHUNKS }, (_unused, index) => ({
        chunk_id: chunkId(index),
        doc_id: "0000320193-26-000001:primary.htm",
        vector: seedVector(index),
        metadata: { text: `chunk ${index}` },
      })) as never
    );

    const db = getDb();
    const prepared: string[] = [];
    const realPrepare = db.prepare.bind(db);
    vi.spyOn(db, "prepare").mockImplementation(((sql: string) => {
      prepared.push(sql);
      return realPrepare(sql);
    }) as never);

    const hits = await kb.similaritySearch(new Float32Array([1, 0, 0, 0]), { topK: 3 });

    // The whole index is still ranked — the three best chunks are the last
    // three rows, which only a scan that reaches the end can find.
    expect(hits.map((hit) => (hit as { chunk_id: string }).chunk_id)).toEqual([
      chunkId(CHUNKS - 1),
      chunkId(CHUNKS - 2),
      chunkId(CHUNKS - 3),
    ]);

    const chunkReads = prepared.filter((sql) =>
      new RegExp(`FROM \`?${KB_CHUNK_TABLE}\``).test(sql)
    );
    expect(chunkReads.length).toBeGreaterThan(1);
    // Not one of them may be the unbounded read: a corpus of any size is then
    // in the heap at once, every row hydrated before a single score is taken.
    for (const sql of chunkReads) expect(sql).toMatch(/LIMIT/);
  });
});
