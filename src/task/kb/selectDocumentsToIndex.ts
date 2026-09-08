/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PageCursor } from "workglow";
import { globalServiceRegistry } from "workglow";
import { KB_DOCUMENT_TABLE } from "../../kb/secKbTables";
import {
  FILING_DOCUMENT_REPOSITORY_TOKEN,
  type FilingDocument,
  type FilingDocumentRepositoryStorage,
} from "../../storage/document/FilingDocumentSchema";
import { getDb } from "../../util/db";
import { resolveSqlBackend } from "../../util/sqlBackend";

export interface SelectDocumentsOptions {
  readonly cik?: number | undefined;
  readonly form?: string | undefined;
  readonly since?: string | undefined;
  readonly accession?: string | undefined;
  /** Stop after this many documents that still need indexing; all of them when unset. */
  readonly limit?: number | undefined;
  /** Re-index documents the knowledge base already holds. */
  readonly force?: boolean | undefined;
}

/** The `kb_document.doc_id` a converted document is stored under. */
export function kbDocIdFor(accession: string, docFile: string): string {
  return `${accession}:${docFile}`;
}

function documentRepoIfRegistered(): FilingDocumentRepositoryStorage | undefined {
  return globalServiceRegistry.has(FILING_DOCUMENT_REPOSITORY_TOKEN)
    ? globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN)
    : undefined;
}

/**
 * Whether there is a table to anti-join against.
 *
 * The three knowledge-base tables are built lazily by the first command that
 * opens the index, and this selector runs before that — so on a database with
 * converted filings that has never been indexed they do not exist yet. Nothing
 * is indexed in that case, which is the answer, not an error.
 */
function kbDocumentTableExists(): boolean {
  return (
    getDb()
      .prepare<[string], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
      )
      .all(KB_DOCUMENT_TABLE).length > 0
  );
}

/**
 * Converted documents the knowledge base does not already hold, newest first.
 *
 * The set difference is an anti-join, so it is raw SQL for the same reason
 * `selectFilingsToConvert` is: `ITabularStorage` cannot express one, and the
 * alternative is a knowledge-base round trip per document over a table with
 * hundreds of thousands of rows.
 *
 * That alternative is what this replaces, and the round trips were not the
 * worst of it. The limit used to count documents actually INDEXED, and an
 * already-indexed one was skipped without counting toward it — so `--limit 5`
 * against a corpus that was already indexed read every row and probed the
 * knowledge base once per row before concluding it had nothing to do. `ask`
 * builds the index implicitly, so that ran on every question.
 *
 * The fast path is SQLite only, and there is no Postgres arm to write: the
 * knowledge base lives in the connection `getDb()` owns and
 * `getSecKnowledgeBase` refuses every other backend by name, so where this
 * query cannot run the index cannot exist either.
 */
export async function selectDocumentsToIndex(
  options: SelectDocumentsOptions
): Promise<FilingDocument[]> {
  if (options.limit !== undefined && options.limit <= 0) return [];
  const documentRepo = documentRepoIfRegistered();
  if (documentRepo === undefined) return [];

  if (resolveSqlBackend("read", documentRepo) !== "sqlite") {
    return await selectByScan(documentRepo, options);
  }

  const antiJoin = options.force !== true && kbDocumentTableExists();
  const params: (string | number)[] = [];
  const clauses: string[] = [];
  if (options.cik !== undefined) {
    clauses.push("d.`cik` = ?");
    params.push(options.cik);
  }
  if (options.form !== undefined) {
    clauses.push("d.`form` = ?");
    params.push(options.form);
  }
  if (options.accession !== undefined) {
    clauses.push("d.`accession_number` = ?");
    params.push(options.accession);
  }
  // In the query rather than after it. Filtered in the loop, `since` cost a
  // full read of everything older than the cutoff to discard it.
  if (options.since !== undefined) {
    clauses.push("d.`filing_date` >= ?");
    params.push(options.since);
  }
  // A document with no sections has nothing to embed, so it never enters the
  // knowledge base and would be re-selected on every run — spending the limit
  // on work that cannot happen. `section_count` is written in the same
  // transaction as the section rows, so it is the same answer reading them
  // gives.
  clauses.push("d.`section_count` > 0");
  if (antiJoin) clauses.push("k.`doc_id` IS NULL");
  // SQLite numbers `?` by position, so the limit binds last because it is
  // written last.
  if (options.limit !== undefined) params.push(options.limit);

  const join = antiJoin
    ? "LEFT JOIN `" +
      KB_DOCUMENT_TABLE +
      "` k ON k.`doc_id` = d.`accession_number` || ':' || d.`doc_file`"
    : "";
  const where = clauses.length === 0 ? "1 = 1" : clauses.join(" AND ");
  return getDb()
    .prepare<(string | number)[], FilingDocument>(
      `SELECT d.*
         FROM \`filing_document\` d
         ${join}
        WHERE ${where}
        ORDER BY d.\`filing_date\` DESC, d.\`accession_number\` DESC
        ${options.limit === undefined ? "" : "LIMIT ?"}`
    )
    .all(...params);
}

/**
 * How many documents in scope the knowledge base already holds.
 *
 * Its own query rather than a by-product of the selection, because the
 * selection stops at the limit and so cannot count what it never reached. One
 * COUNT replaces the unfiltered `count` this run used to take for its progress
 * denominator, so it costs no extra query — and the denominator it replaces was
 * wrong anyway, measuring a run that indexes three filings out of three hundred
 * candidates at one percent.
 *
 * Zero where the anti-join cannot run, which is the same answer
 * {@link selectDocumentsToIndex} gives there: no index, nothing already in it.
 */
export async function countAlreadyIndexed(
  options: Omit<SelectDocumentsOptions, "limit" | "force">
): Promise<number> {
  const documentRepo = documentRepoIfRegistered();
  if (documentRepo === undefined) return 0;
  if (resolveSqlBackend("read", documentRepo) !== "sqlite") return 0;
  if (!kbDocumentTableExists()) return 0;

  const params: (string | number)[] = [];
  const clauses: string[] = [];
  if (options.cik !== undefined) {
    clauses.push("d.`cik` = ?");
    params.push(options.cik);
  }
  if (options.form !== undefined) {
    clauses.push("d.`form` = ?");
    params.push(options.form);
  }
  if (options.accession !== undefined) {
    clauses.push("d.`accession_number` = ?");
    params.push(options.accession);
  }
  if (options.since !== undefined) {
    clauses.push("d.`filing_date` >= ?");
    params.push(options.since);
  }
  const where = clauses.length === 0 ? "1 = 1" : clauses.join(" AND ");
  const row = getDb()
    .prepare<(string | number)[], { n: number }>(
      `SELECT COUNT(*) AS n
         FROM \`filing_document\` d
         JOIN \`${KB_DOCUMENT_TABLE}\` k
           ON k.\`doc_id\` = d.\`accession_number\` || ':' || d.\`doc_file\`
        WHERE ${where}`
    )
    .get(...params);
  return row?.n ?? 0;
}

const HEADER_PAGE_SIZE = 500;

/**
 * The repository path: page the document table, apply the filters, stop at the
 * limit.
 *
 * It consults no knowledge base, because it is reached only where there cannot
 * be one to consult. A non-durable document repository is invisible to
 * `getDb()`, so opening the index here would read a real database this caller
 * never wrote to and report the wrong documents as already indexed; and on
 * Postgres the index does not exist at all. Both are better served by naming
 * the candidates and letting the caller fail where the knowledge base itself
 * refuses.
 */
async function selectByScan(
  repo: FilingDocumentRepositoryStorage,
  options: SelectDocumentsOptions
): Promise<FilingDocument[]> {
  const criteria: Record<string, unknown> = {};
  if (options.cik !== undefined) criteria.cik = options.cik;
  if (options.form !== undefined) criteria.form = options.form;
  if (options.accession !== undefined) criteria.accession_number = options.accession;

  const picked: FilingDocument[] = [];
  for await (const header of streamHeaders(repo, criteria)) {
    if (options.since !== undefined && (header.filing_date ?? "") < options.since) continue;
    if (header.section_count <= 0) continue;
    picked.push(header);
    if (options.limit !== undefined && picked.length >= options.limit) break;
  }
  return picked;
}

/**
 * The matching documents, a page at a time.
 *
 * Streamed rather than collected: the unscoped case is every converted filing
 * in the database, and materializing that to take the first few of it costs the
 * whole corpus in memory before any work starts.
 */
async function* streamHeaders(
  repo: FilingDocumentRepositoryStorage,
  criteria: Record<string, unknown>
): AsyncGenerator<FilingDocument> {
  if (Object.keys(criteria).length === 0) {
    yield* repo.records(HEADER_PAGE_SIZE);
    return;
  }
  let cursor: PageCursor | undefined;
  for (;;) {
    const page = await repo.queryPage(criteria as never, { limit: HEADER_PAGE_SIZE, cursor });
    yield* page.items;
    // Both conditions: a cursor can be handed back for a page that concurrent
    // deletes have since emptied, and looping on it alone would not terminate.
    if (page.nextCursor === undefined || page.items.length === 0) return;
    cursor = page.nextCursor;
  }
}
