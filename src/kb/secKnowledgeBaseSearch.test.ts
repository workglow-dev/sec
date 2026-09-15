/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChunkVectorPrimaryKey, ChunkVectorStorageSchema, SqliteVectorStorage } from "workglow";
import { withSqliteDb } from "../config/testing/withSqliteDb";
import { getDb } from "../util/db";
import { SCAN_PAGE } from "./PagedChunkVectorStorage";
import { KB_CHUNK_TABLE } from "./secKbTables";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "./secKnowledgeBase";

/** Narrow enough to seed a few thousand rows without a real embedding model. */
const DIMENSIONS = 4;

function chunkId(index: number): string {
  return `c${String(index).padStart(5, "0")}`;
}

/**
 * Similarity to `[1, 0, 0, 0]` is `1 / sqrt(1 + spread²)`, so the best chunks
 * are the ones with the smallest spread — and the seeding puts those LAST in
 * `chunk_id` order, where a scan that stops early would never reach them.
 */
function seedVector(index: number, total: number): Float32Array {
  return new Float32Array([1, total - 1 - index, 0, 0]);
}

/** Writes `count` chunks onto the table the knowledge base just created. */
async function seedChunks(count: number): Promise<void> {
  const seeder = new SqliteVectorStorage(
    getDb(),
    KB_CHUNK_TABLE,
    ChunkVectorStorageSchema,
    ChunkVectorPrimaryKey,
    [],
    DIMENSIONS
  );
  await seeder.putBulk(
    Array.from({ length: count }, (_unused, index) => ({
      chunk_id: chunkId(index),
      doc_id: "0000320193-26-000001:primary.htm",
      vector: seedVector(index, count),
      metadata: { text: `chunk ${index}` },
    })) as never
  );
}

/** Records every statement the shared connection prepares while `run` executes. */
async function recordSql<T>(run: () => Promise<T>): Promise<{ result: T; prepared: string[] }> {
  const db = getDb();
  const prepared: string[] = [];
  const realPrepare = db.prepare.bind(db);
  vi.spyOn(db, "prepare").mockImplementation(((sql: string) => {
    prepared.push(sql);
    return realPrepare(sql);
  }) as never);
  const result = await run();
  return { result, prepared };
}

function chunkReads(prepared: readonly string[]): string[] {
  return prepared.filter((sql) => new RegExp(`FROM \`?${KB_CHUNK_TABLE}\``).test(sql));
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
    const total = SCAN_PAGE * 2 + 37;
    await seedChunks(total);

    const { result: hits, prepared } = await recordSql(() =>
      kb.similaritySearch(new Float32Array([1, 0, 0, 0]), { topK: 3 })
    );

    // The whole index is still ranked — the three best chunks are the last
    // three rows, which only a scan that reaches the end can find.
    expect(hits.map((hit) => (hit as { chunk_id: string }).chunk_id)).toEqual([
      chunkId(total - 1),
      chunkId(total - 2),
      chunkId(total - 3),
    ]);

    const reads = chunkReads(prepared);
    expect(reads.length).toBeGreaterThan(1);
    // Not one of them may be the unbounded read: a corpus of any size is then
    // in the heap at once, every row hydrated before a single score is taken.
    for (const sql of reads) expect(sql).toMatch(/LIMIT/);
  });

  it("seeks to the last key seen rather than counting rows past", async () => {
    // The distinction this pins: `OFFSET n` makes SQLite walk and discard the
    // first n rows of every page, so scanning the table a page at a time costs
    // O(rows²) — at a few hundred thousand chunks, slower than the unbounded
    // read the paging replaced. A keyset page is a seek into the primary-key
    // index and reads each row once.
    const kb = await getSecKnowledgeBase();
    await seedChunks(SCAN_PAGE * 2 + 5);

    const { prepared } = await recordSql(() =>
      kb.similaritySearch(new Float32Array([1, 0, 0, 0]), { topK: 3 })
    );

    const reads = chunkReads(prepared);
    expect(reads.length).toBe(3);
    for (const sql of reads) expect(sql).not.toMatch(/OFFSET/i);
    // The first page starts at the beginning; every page after it resumes from
    // the last `chunk_id` of the one before.
    expect(reads[0]).not.toMatch(/chunk_id`? >/);
    for (const sql of reads.slice(1)) expect(sql).toMatch(/`chunk_id` >/);
  });

  it("terminates on a corpus that is an exact multiple of the page", async () => {
    // The empty-final-page case: the last full page still hands back a cursor,
    // because nothing about it says it was the last. A loop that trusts the
    // cursor alone asks for one more page, gets none, and asks again forever.
    const kb = await getSecKnowledgeBase();
    const total = SCAN_PAGE * 2;
    await seedChunks(total);

    const { result: hits, prepared } = await recordSql(() =>
      kb.similaritySearch(new Float32Array([1, 0, 0, 0]), { topK: 2 })
    );

    expect(hits.map((hit) => (hit as { chunk_id: string }).chunk_id)).toEqual([
      chunkId(total - 1),
      chunkId(total - 2),
    ]);
    // Two full pages plus the empty one that ends the scan.
    expect(chunkReads(prepared).length).toBe(3);
  });

  it("ranks an empty index without reading a page twice", async () => {
    const kb = await getSecKnowledgeBase();

    const { result: hits, prepared } = await recordSql(() =>
      kb.similaritySearch(new Float32Array([1, 0, 0, 0]), { topK: 3 })
    );

    expect(hits).toEqual([]);
    expect(chunkReads(prepared).length).toBe(1);
  });
});
