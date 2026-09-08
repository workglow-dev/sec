/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "typebox";
import type { DocumentNode, IExecuteContext } from "workglow";
import {
  Document,
  globalServiceRegistry,
  KbAddDocumentTask,
  NodeKind,
  Task,
  TaskAbortedError,
} from "workglow";
import { getSecKnowledgeBase } from "../../kb/secKnowledgeBase";
import type { FilingDocument } from "../../storage/document/FilingDocumentSchema";
import {
  FILING_SECTION_REPOSITORY_TOKEN,
  type FilingSection,
} from "../../storage/document/FilingSectionSchema";
import { accessionWithoutDashes } from "../../util/accession";
import type { TaskPorts } from "../taskPorts";
import { countAlreadyIndexed, kbDocIdFor, selectDocumentsToIndex } from "./selectDocumentsToIndex";

export interface IndexFilingSectionsTaskInput {
  /** Only this issuer's filings. */
  readonly cik?: number | undefined;
  /** Only this form. */
  readonly form?: string | undefined;
  /** Only filings on or after this date (YYYY-MM-DD). */
  readonly since?: string | undefined;
  /** Only this accession. */
  readonly accession?: string | undefined;
  /** Stop after this many filings. */
  readonly limit?: number | undefined;
  /** Re-index filings already in the knowledge base. */
  readonly force?: boolean | undefined;
}

export interface IndexFilingSectionsTaskOutput {
  readonly success: boolean;
  /** Filings indexed this run. */
  readonly indexed: number;
  /** Sections embedded across them. */
  readonly sections: number;
  /** Filings already in the index, skipped. */
  readonly skipped: number;
  /** True when the run hit its limit with filings still unexamined. */
  readonly truncated: boolean;
}

/**
 * How many converted filings `sec ask` embeds before answering.
 *
 * Small on purpose. Embedding runs on CPU ONNX by default, and a corpus of any
 * size takes hours to days — which is a build to start deliberately with `sec
 * index`, not something a question should trigger on its way to an answer.
 */
export const DEFAULT_ASK_INDEX_LIMIT = 25;

/** The EDGAR URL a citation points at. */
function filingUrl(cik: number, accession: string, docFile: string): string {
  return (
    `https://www.sec.gov/Archives/edgar/data/${cik}/` +
    `${accessionWithoutDashes(accession)}/${docFile}`
  );
}

/**
 * One filing's sections as a document tree.
 *
 * `filing_section` rows are flat and ordered, which is exactly what the tree
 * wants: each row becomes a section node under the root, in `ordinal` order, so
 * the chunker sees the same boundaries the converter wrote.
 */
function toDocument(header: FilingDocument, sections: readonly FilingSection[]): Document {
  const children: DocumentNode[] = sections.map((section) => ({
    kind: NodeKind.SECTION,
    title: section.title,
    children: [{ kind: NodeKind.PARAGRAPH, text: section.markdown }],
  })) as DocumentNode[];

  // The title is what a citation prints, so it has to identify the FILING, not
  // the document within it: `EX-4.6` repeated down a list of six references
  // names none of them, and that is what the converter's own title gives for
  // an exhibit.
  const title = [header.form, header.filing_date, header.accession_number]
    .filter((part): part is string => typeof part === "string" && part !== "")
    .join(" · ");
  const label = title === "" ? header.title : `${title} — ${header.title}`;

  const root = {
    kind: NodeKind.DOCUMENT,
    title: label,
    children,
  } as unknown as DocumentNode;

  return new Document(root, {
    title: label,
    sourceUri: filingUrl(Number(header.cik), header.accession_number, header.doc_file),
    // Everything a citation needs to name the filing it came from. The metadata
    // schema takes extra properties, and a reference that cannot say which
    // filing it is quoting is not a citation.
    cik: Number(header.cik),
    accession: header.accession_number,
    docFile: header.doc_file,
    form: header.form ?? undefined,
    filingDate: header.filing_date ?? undefined,
  } as never);
}

/**
 * Embeds converted filing sections into the knowledge base `sec ask` reads.
 *
 * Resumable by anti-join, like every other sweep here: a filing whose document
 * id is already stored is skipped unless `--force`, so a large index is many
 * bounded runs rather than one that has to finish.
 */
export class IndexFilingSectionsTask extends Task<
  TaskPorts<IndexFilingSectionsTaskInput>,
  TaskPorts<IndexFilingSectionsTaskOutput>
> {
  static readonly type = "IndexFilingSectionsTask";
  static readonly category = "SEC";
  static readonly title = "Index filings for search";
  static readonly description =
    "Chunks and embeds converted filing sections into the knowledge base `sec ask` reads.";
  static readonly cacheable = false;

  public static inputSchema() {
    return Type.Object({
      cik: Type.Optional(Type.Number()),
      form: Type.Optional(Type.String()),
      since: Type.Optional(Type.String()),
      accession: Type.Optional(Type.String()),
      limit: Type.Optional(Type.Number()),
      force: Type.Optional(Type.Boolean()),
    });
  }

  public static outputSchema() {
    return Type.Object({
      success: Type.Boolean(),
      indexed: Type.Integer(),
      sections: Type.Integer(),
      skipped: Type.Integer(),
      truncated: Type.Boolean(),
    });
  }

  async execute(
    input: TaskPorts<IndexFilingSectionsTaskInput>,
    context: IExecuteContext
  ): Promise<TaskPorts<IndexFilingSectionsTaskOutput>> {
    const kb = await getSecKnowledgeBase();
    const sectionRepo = globalServiceRegistry.get(FILING_SECTION_REPOSITORY_TOKEN);

    const scope = {
      cik: input.cik,
      form: input.form,
      since: input.since,
      accession: input.accession,
    };

    // One document more than asked for, so "there are more" is something this
    // run observed rather than inferred from having filled the limit exactly.
    const limit = input.limit;
    const candidates = await selectDocumentsToIndex({
      ...scope,
      limit: limit === undefined ? undefined : limit + 1,
      force: input.force,
    });
    const truncated = limit !== undefined && candidates.length > limit;
    const work = truncated ? candidates.slice(0, limit) : candidates;
    const skipped = input.force === true ? 0 : await countAlreadyIndexed(scope);
    const denominator = Math.max(1, work.length);

    let indexed = 0;
    let sectionTotal = 0;
    for (const header of work) {
      if (context.signal?.aborted) throw new TaskAbortedError();
      const docId = kbDocIdFor(header.accession_number, header.doc_file);

      const sections = (
        (await sectionRepo.query({
          cik: header.cik,
          accession_number: header.accession_number,
          doc_file: header.doc_file,
        } as never)) ?? []
      ).sort((a, b) => a.ordinal - b.ordinal);
      if (sections.length === 0) continue;

      const document = toDocument(header, sections);
      document.doc_id = docId;
      await new KbAddDocumentTask().run({ knowledgeBase: kb, document } as never);

      indexed += 1;
      sectionTotal += sections.length;
      await context.updateProgress(
        Math.min(100, Math.floor((indexed / denominator) * 100)),
        `${indexed} filings indexed`
      );
    }

    return { success: true, indexed, sections: sectionTotal, skipped, truncated };
  }
}
