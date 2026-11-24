/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DocumentNode, IExecuteContext } from "workglow";
import { Document, globalServiceRegistry, NodeKind } from "workglow";
import { syncKbIndexedStamp } from "../../config/kbIndexedStamp";
import { secEmbeddingDimensions } from "../../config/models";
import { withSqliteDb } from "../../config/testing/withSqliteDb";
import { KB_CHUNK_TABLE, KB_DOCUMENT_TABLE } from "../../kb/secKbTables";
import { getSecKnowledgeBase, resetSecKnowledgeBaseForTesting } from "../../kb/secKnowledgeBase";
import { FILING_DOCUMENT_REPOSITORY_TOKEN } from "../../storage/document/FilingDocumentSchema";
import { FILING_SECTION_REPOSITORY_TOKEN } from "../../storage/document/FilingSectionSchema";
import { XBRL_FACT_REPOSITORY_TOKEN } from "../../storage/xbrl/XbrlFactSchema";
import { getDb } from "../../util/db";
import {
  ConvertFilingDocumentTask,
  type ConvertFilingDocumentTaskInput,
} from "../document/ConvertFilingDocumentTask";
import { kbDocIdFor, selectDocumentsToIndex } from "./selectDocumentsToIndex";

const CIK = 1234567;
const CO_FILER = 7654321;
const ACCESSION = "0001234567-26-000001";
const TXT = `${ACCESSION}.txt`;
const HEADING = 'style="font-weight:700;text-align:center;font-size:14pt"';

const member = (type: string, seq: number, file: string, body: string): string =>
  `<DOCUMENT>\n<TYPE>${type}\n<SEQUENCE>${seq}\n<FILENAME>${file}\n<TEXT>\n${body}\n</TEXT>\n</DOCUMENT>`;

const submission = (...members: string[]): string =>
  `<SEC-DOCUMENT>${TXT} : 20260101\n<SEC-HEADER>${ACCESSION}.hdr.sgml : 20260101\n` +
  `COMPANY CONFORMED NAME: EXAMPLE CORP\n</SEC-HEADER>\n${members.join("\n")}\n</SEC-DOCUMENT>`;

const primary = (text: string): string =>
  member("8-K", 1, "form8k.htm", `<html><body><p>Item 7.01. ${text}</p></body></html>`);

const exhibit = member(
  "EX-99.1",
  2,
  "ex99-1.htm",
  `<html><body><p ${HEADING}>PRESS RELEASE</p><p>Example Corp announced a deal.</p></body></html>`
);

class StubbedConvert extends ConvertFilingDocumentTask {
  constructor(
    defaults: ConvertFilingDocumentTaskInput,
    private readonly text: string
  ) {
    super({ defaults });
  }
  protected override async loadSource(
    _input: ConvertFilingDocumentTaskInput,
    _context: IExecuteContext
  ): Promise<{ text: string; docFile: string; fromCache: boolean } | undefined> {
    return { text: this.text, docFile: TXT, fromCache: true };
  }
}

const convert = async (text: string, cik: number = CIK): Promise<void> => {
  await new StubbedConvert(
    { cik, accessionNumber: ACCESSION, form: "8-K", filingDate: "2026-01-01" },
    text
  ).run();
};

/**
 * What `IndexFilingSectionsTask` leaves behind, without an embedding model: the
 * document, one chunk, and the stamp.
 */
const indexSelected = async (): Promise<string[]> => {
  const kb = await getSecKnowledgeBase();
  const repo = globalServiceRegistry.get(FILING_DOCUMENT_REPOSITORY_TOKEN);
  const picked = await selectDocumentsToIndex({});
  for (const header of picked) {
    const docId = kbDocIdFor(header.accession_number, header.doc_file);
    const root = { kind: NodeKind.DOCUMENT, title: header.title, children: [] };
    await kb.upsertDocument(
      new Document(root as unknown as DocumentNode, { title: header.title } as never, [], docId)
    );
    await kb.upsertChunksBulk([
      {
        doc_id: docId,
        vector: new Float32Array(secEmbeddingDimensions()),
        metadata: { text: "embedded text" },
      } as never,
    ]);
    await repo.put({ ...header, kb_indexed_at: new Date().toISOString() });
  }
  return picked.map((header) => header.doc_file);
};

const kbDocIds = (): string[] =>
  (
    getDb().prepare(`SELECT doc_id FROM \`${KB_DOCUMENT_TABLE}\` ORDER BY doc_id`).all() as {
      doc_id: string;
    }[]
  ).map((row) => row.doc_id);

const chunkDocIds = (): string[] =>
  (
    getDb().prepare(`SELECT doc_id FROM \`${KB_CHUNK_TABLE}\` ORDER BY doc_id`).all() as {
      doc_id: string;
    }[]
  ).map((row) => row.doc_id);

/**
 * A `FILING_CONVERTER_VERSION` bump re-converts a filing and replaces its
 * sections. The knowledge base keys a document by accession and member, so
 * unless the conversion takes the old embedding out and the selection offers
 * the document again, `ask` keeps citing the previous converter's text — and a
 * member the new pass no longer emits stays citable forever.
 */
describe.each([
  ["after db setup (the stamp decides)", true],
  ["before db setup (the anti-join decides)", false],
])("re-conversion and the knowledge base, %s", (_label, stampTrusted) => {
  withSqliteDb("reconversion_index", [
    FILING_DOCUMENT_REPOSITORY_TOKEN,
    FILING_SECTION_REPOSITORY_TOKEN,
    XBRL_FACT_REPOSITORY_TOKEN,
  ]);

  beforeEach(async () => {
    await resetSecKnowledgeBaseForTesting();
    delete process.env.SEC_EMBEDDING_MODEL;
    if (stampTrusted) syncKbIndexedStamp(getDb());
  });
  afterEach(async () => {
    await resetSecKnowledgeBaseForTesting();
  });

  it("offers a re-converted document again and drops a member the new pass no longer emits", async () => {
    await convert(submission(primary("See Exhibit 99.1."), exhibit));
    expect((await indexSelected()).sort()).toEqual(["ex99-1.htm", "form8k.htm"]);
    expect(await selectDocumentsToIndex({})).toEqual([]);

    // The new converter skips the exhibit and renders the primary differently.
    await convert(submission(primary("Revised text.")));

    expect((await selectDocumentsToIndex({})).map((d) => d.doc_file)).toEqual(["form8k.htm"]);
    // Neither old embedding is left to cite: the replaced one waits for the
    // index, the dropped one is gone for good.
    expect(kbDocIds()).toEqual([]);
    expect(chunkDocIds()).toEqual([]);

    expect(await indexSelected()).toEqual(["form8k.htm"]);
    expect(kbDocIds()).toEqual([kbDocIdFor(ACCESSION, "form8k.htm")]);
    expect(await selectDocumentsToIndex({})).toEqual([]);
  });

  it("re-offers a co-filer's copy of the member a re-conversion purged", async () => {
    // The knowledge-base id carries no CIK, so both filers' rows point at the
    // one document; purging it for one must not leave the other's stamp
    // claiming it is still there.
    await convert(submission(primary("Same text.")), CIK);
    await convert(submission(primary("Same text.")), CO_FILER);
    await indexSelected();
    expect(await selectDocumentsToIndex({})).toEqual([]);

    await convert(submission(primary("Revised text.")), CIK);

    const ciks = (await selectDocumentsToIndex({})).map((d) => Number(d.cik)).sort();
    expect(ciks).toEqual([CIK, CO_FILER].sort());
  });
});
