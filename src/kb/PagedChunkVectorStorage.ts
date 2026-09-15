/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ChunkVectorPrimaryKey,
  ChunkVectorStorageSchema,
  PageCursor,
  TypedArray,
  VectorSearchOptions,
} from "workglow";
import {
  assertVectorShape,
  cosineSimilarity,
  emitSimilaritySearch,
  matchesFilter,
  SqliteVectorStorage,
} from "workglow";

/**
 * Rows read per page.
 *
 * A chunk carries its text and a JSON-encoded vector, so a page is the working
 * set: large enough that the scan is a few hundred statements over a corpus of
 * hundreds of thousands of chunks, small enough to stay a fixed cost.
 *
 * Exported so a test can seed exactly one page boundary rather than a number
 * that happens to cross one today.
 */
export const SCAN_PAGE = 512;

/** A scored row, as {@link SqliteVectorStorage.similaritySearch} returns them. */
interface Scored {
  readonly score: number;
}

/**
 * Inserts into a list held at `topK`, descending by score.
 *
 * Linear rather than a heap: `topK` is single digits by default and the
 * comparison runs once per candidate that beats the current floor, which on a
 * long scan is a vanishing fraction of the rows.
 */
function keepBest<T extends Scored>(kept: T[], row: T, topK: number): void {
  let low = 0;
  let high = kept.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (kept[mid]!.score >= row.score) low = mid + 1;
    else high = mid;
  }
  if (low >= topK) return;
  kept.splice(low, 0, row);
  if (kept.length > topK) kept.pop();
}

/**
 * The chunk store `sec ask` searches, scored a page at a time.
 *
 * The inherited search is `SELECT * FROM kb_chunk` with no bound followed by a
 * cosine per row, which puts the whole index in the heap to answer one
 * question. `sec index` is a build measured in hours to days and `sec ask`
 * tells the user to run it, so the index this has to read is exactly the one
 * that does not fit.
 *
 * Bounded memory, not bounded time: there is no approximate-nearest-neighbour
 * index here, so every question still scores every chunk and latency grows with
 * the corpus. What this removes is the heap ceiling that made a large index
 * unqueryable rather than slow.
 *
 * The pages are keyset (seek) pages, not `OFFSET` pages. `OFFSET n` makes the
 * database walk and discard the first `n` rows on every page, so paging a table
 * that way costs O(rows²) and a large index is slower to read a page at a time
 * than to read whole — which is the opposite of what paging it is for. Resuming
 * from the last key seen reads each row once: the ordering is the primary key,
 * which is the index SQLite already keeps, so a page is a seek into it and the
 * scan is linear again.
 */
export class PagedChunkVectorStorage extends SqliteVectorStorage<
  ChunkVectorStorageSchema,
  ChunkVectorPrimaryKey
> {
  override async similaritySearch(
    query: TypedArray,
    options: VectorSearchOptions<Record<string, unknown>> = {}
  ) {
    assertVectorShape(query, this.getVectorDimensions(), "query");
    const { topK = 10, filter, scoreThreshold = 0 } = options;

    type Row = Awaited<ReturnType<PagedChunkVectorStorage["getPage"]>>["items"][number];
    const kept: (Row & Scored)[] = [];
    if (topK <= 0) return emitSimilaritySearch(this.events, query, kept);

    // Ordered by the primary key so the pages partition the table, and resumed
    // from the last key of the previous page rather than from a row count. The
    // cursor is the store's own, which encodes that key and is refused if the
    // ordering it was built under stops matching.
    let cursor: PageCursor | undefined;
    for (;;) {
      const page = await this.getPage({
        orderBy: [{ column: "chunk_id", direction: "ASC" }],
        limit: SCAN_PAGE,
        cursor,
      });
      for (const entity of page.items) {
        const metadata = (entity.metadata ?? {}) as Record<string, unknown>;
        if (filter && !matchesFilter(metadata, filter)) continue;
        const score = cosineSimilarity(query, toVector(entity.vector));
        if (score < scoreThreshold) continue;
        keepBest(kept, { ...entity, score }, topK);
      }
      // Both conditions. A table whose size is an exact multiple of the page
      // hands back a cursor for its last full page, and the page after it is
      // empty rather than absent; looping on the cursor alone would not end.
      if (page.nextCursor === undefined || page.items.length === 0) break;
      cursor = page.nextCursor;
    }

    return emitSimilaritySearch(this.events, query, kept);
  }
}

/**
 * The stored vector as a TypedArray, from whichever form the read produced.
 *
 * SQLite holds it as a JSON string and the tabular read usually decodes it
 * already; a row written by an older release, or handed back raw, does not.
 */
function toVector(stored: unknown): TypedArray {
  if (typeof stored === "string") return new Float32Array(JSON.parse(stored) as number[]);
  if (Array.isArray(stored)) return new Float32Array(stored);
  return stored as TypedArray;
}
