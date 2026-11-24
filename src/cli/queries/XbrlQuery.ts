/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SearchCriteria } from "workglow";
import { globalServiceRegistry } from "workglow";
import { FILING_DOCUMENT_REPOSITORY_TOKEN } from "../../storage/document/FilingDocumentSchema";
import {
  XBRL_FACT_REPOSITORY_TOKEN,
  type XbrlFactRepositoryStorage,
  type XbrlFactRow,
} from "../../storage/xbrl/XbrlFactSchema";
import { collectPage, streamMatchingRows } from "./_streamMatches";
import type { QueryResult } from "./EntityQuery";

export interface XbrlQueryParams {
  /** Filing accession number; either this or `cik` must be provided. */
  readonly accession?: string;
  readonly cik?: number;
  /** Case-insensitive substring filter on the concept QName (e.g. "TrustAccount"). */
  readonly concept?: string;
  readonly numericOnly?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

/** Accessions per `in` list: SQLite binds one parameter per value. */
const ACCESSION_CHUNK = 500;

/**
 * Every accession this CIK has a converted document under, ascending.
 *
 * The facts of a co-filed submission are stored once, under whichever filer's
 * conversion extracted them, so the `cik` column cannot answer "this issuer's
 * facts" for the others. `filing_document` can: each filer's conversion writes
 * its own rows there, in the same pass that writes (or finds) the facts.
 */
async function accessionsConvertedFor(cik: number): Promise<string[]> {
  if (!globalServiceRegistry.has(FILING_DOCUMENT_REPOSITORY_TOKEN)) return [];
  const rows =
    (await globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN).query({ cik } as never)) ??
    [];
  return [...new Set(rows.map((row) => row.accession_number))].sort();
}

/**
 * The fact criteria to read, as a list whose members cover ascending,
 * disjoint ranges of accessions, so reading them in order IS reading in
 * `(accession, fact_index)` order.
 *
 * A CIK with no converted documents falls back to the `cik` column, which is
 * all a database holding facts without their documents can answer from.
 */
async function factCriteria(params: XbrlQueryParams): Promise<SearchCriteria<XbrlFactRow>[]> {
  if (params.accession !== undefined) {
    return [{ accession_number: params.accession } as SearchCriteria<XbrlFactRow>];
  }
  const accessions = await accessionsConvertedFor(params.cik!);
  if (accessions.length === 0) return [{ cik: params.cik } as SearchCriteria<XbrlFactRow>];
  const chunks: SearchCriteria<XbrlFactRow>[] = [];
  for (let i = 0; i < accessions.length; i += ACCESSION_CHUNK) {
    chunks.push({
      accession_number: { value: accessions.slice(i, i + ACCESSION_CHUNK), operator: "in" },
    } as SearchCriteria<XbrlFactRow>);
  }
  return chunks;
}

/**
 * One page across several criteria read in order: each is counted for the
 * total, and rows are taken from the one the offset lands in onward.
 */
async function pageAcross(
  repo: XbrlFactRepositoryStorage,
  criteriaList: readonly SearchCriteria<XbrlFactRow>[],
  offset: number,
  limit: number
): Promise<QueryResult<XbrlFactRow>> {
  const rows: XbrlFactRow[] = [];
  let total = 0;
  let skip = offset;
  for (const criteria of criteriaList) {
    const count = await repo.count(criteria);
    total += count;
    const want = limit - rows.length;
    if (want <= 0) continue;
    if (skip >= count) {
      skip -= count;
      continue;
    }
    // Push ORDER BY (accession, fact_index) down to storage so pagination is
    // consistent across pages. Sorting only the returned page would leave the
    // overall order at the backend's default, letting offset/limit skip or
    // duplicate rows across pages.
    const page =
      (await repo.query(criteria, {
        orderBy: [
          { column: "accession_number", direction: "ASC" },
          { column: "fact_index", direction: "ASC" },
        ],
        limit: want,
        offset: skip,
      })) ?? [];
    rows.push(...page);
    skip = 0;
  }
  return { rows, total };
}

async function* streamAcross(
  repo: XbrlFactRepositoryStorage,
  criteriaList: readonly SearchCriteria<XbrlFactRow>[],
  predicate: (row: XbrlFactRow) => boolean
): AsyncGenerator<XbrlFactRow, void, undefined> {
  for (const criteria of criteriaList) yield* streamMatchingRows(repo, criteria, predicate);
}

/**
 * XBRL facts for a filing, or for every filing a CIK filed (co-filed ones
 * included), in extraction order.
 */
export async function queryXbrlFacts(params: XbrlQueryParams): Promise<QueryResult<XbrlFactRow>> {
  if (params.accession === undefined && params.cik === undefined) {
    throw new Error("queryXbrlFacts requires an accession number or a CIK");
  }
  const repo = globalServiceRegistry.get(XBRL_FACT_REPOSITORY_TOKEN);
  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;

  const criteriaList = await factCriteria(params);

  // Order by (accession, fact_index): extraction order within a filing, and a
  // stable per-filing grouping for the across-issuer (CIK) case.
  const byFilingOrder = (a: XbrlFactRow, b: XbrlFactRow): number =>
    a.accession_number.localeCompare(b.accession_number) || a.fact_index - b.fact_index;

  const hasConcept = params.concept !== undefined && params.concept !== "";
  if (!hasConcept && params.numericOnly !== true) {
    return await pageAcross(repo, criteriaList, offset, limit);
  }

  const conceptLower = hasConcept ? params.concept!.toLowerCase() : null;
  const predicate = (f: XbrlFactRow): boolean => {
    if (conceptLower !== null && !f.concept.toLowerCase().includes(conceptLower)) return false;
    if (params.numericOnly === true && !f.is_numeric) return false;
    return true;
  };

  const { rows, total, exhausted } = await collectPage(
    streamAcross(repo, criteriaList, predicate),
    offset,
    limit
  );
  // Within-page extraction order, matching the unfiltered path above.
  rows.sort(byFilingOrder);
  return exhausted ? { rows, total } : { rows, total, totalApprox: { atLeast: total } };
}

/** Compact period display: instant date, "start..end" duration, or "". */
export function formatXbrlPeriod(row: XbrlFactRow): string {
  if (row.period_instant !== null) return row.period_instant;
  if (row.period_start !== null || row.period_end !== null) {
    return `${row.period_start ?? "?"}..${row.period_end ?? "?"}`;
  }
  return "";
}

interface StoredDimension {
  readonly dimension: string;
  readonly member: string;
}

/** Local part of a QName, dropping the prefix and the noise Axis/Member/Domain suffix. */
function dimensionLabel(qname: string): string {
  const local = qname.includes(":") ? qname.slice(qname.indexOf(":") + 1) : qname;
  return local.replace(/(Axis|Member|Domain)$/, "");
}

/**
 * Compact dimensional-qualifier display for a fact row: `Axis=Member` pairs
 * joined with "; " (e.g. `StatementClassOfStock=CommonClassA`), or "" when the
 * fact is on the default (undimensioned) context. Malformed JSON degrades to "".
 */
export function formatXbrlDimensions(row: XbrlFactRow): string {
  if (row.dimensions_json === null || row.dimensions_json === "") return "";
  try {
    const dims = JSON.parse(row.dimensions_json) as readonly StoredDimension[];
    if (!Array.isArray(dims)) return "";
    return dims.map((d) => `${dimensionLabel(d.dimension)}=${dimensionLabel(d.member)}`).join("; ");
  } catch {
    return "";
  }
}
