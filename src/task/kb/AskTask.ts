/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "typebox";
import type { IHumanConnector, IHumanRequest, IHumanResponse } from "workglow";
import { AiChatWithKbTask, globalServiceRegistry, HUMAN_CONNECTOR, Task } from "workglow";
import { getSecKnowledgeBase, SEC_KB_ID } from "../../kb/secKnowledgeBase";
import { secGenerationModel } from "../../config/models";
import type { TaskPorts } from "../taskPorts";

/**
 * The connector that ends the conversation after one answer.
 *
 * `AiChatWithKbTask` is a chat: after each turn it asks the human for the next
 * message, before the iteration cap is checked. `sec ask` is one question and
 * one answer, so the human it asks always declines — which is the honest way to
 * say "there is no next message" to a task built to expect one.
 */
const ONE_SHOT_CONNECTOR: IHumanConnector = {
  send: async (request: IHumanRequest): Promise<IHumanResponse> => ({
    requestId: request.requestId,
    action: "decline",
    content: undefined,
    done: true,
  }),
};

/** One citation, in the shape `sec ask` prints under an answer. */
export interface AskReference {
  readonly index: number;
  readonly title: string;
  readonly url: string | undefined;
  readonly snippet: string;
  readonly score: number;
}

export interface AskTaskInput {
  readonly question: string;
  /** Retrieval scope — a CIK narrows to one issuer's filings. */
  readonly cik?: number | undefined;
  readonly form?: string | undefined;
  readonly since?: string | undefined;
  readonly accession?: string | undefined;
  /** Chunks retrieved before the answer is written. */
  readonly topK?: number | undefined;
}

export interface AskTaskOutput {
  readonly answer: string;
  readonly references: readonly AskReference[];
  /** The model that answered, and why it was the one. */
  readonly modelId: string;
  readonly modelReason: string;
  /**
   * Whether filing text was actually retrieved and cited.
   *
   * A field rather than something a caller infers from `references.length`: a
   * consumer should not have to work out that an answer is fiction from an
   * array being empty, and `--json` has no other way to tell.
   */
  readonly grounded: boolean;
}

/**
 * Score floor for a chunk to count as a match, stated here rather than
 * inherited.
 *
 * `AiChatWithKbTask` defaults it to the same 0.3, but the floor is what decides
 * whether an answer is grounded, so `sec ask` names its own instead of moving
 * whenever the library's default does.
 */
const ASK_MIN_SCORE = 0.3;

/**
 * What to say when nothing was retrieved.
 *
 * The model is not asked and its text is not printed. A 350M local model is the
 * default path — deliberately, so `ask` works with no API key — and it will
 * answer a question about Apple's revenue from memory however firmly the system
 * prompt tells it not to. An instruction is a request; this is the guard.
 */
function ungroundedAnswer(indexedChunks: number): string {
  if (indexedChunks === 0) {
    return (
      "Nothing is indexed, so there is no filing text to answer from.\n\n" +
      "Run `sec index` to build the index — or `sec update documents` first, if no " +
      "filings have been converted yet."
    );
  }
  return (
    `Nothing in the index matched this question closely enough to answer from ` +
    `(${indexedChunks} chunk(s) indexed, none scoring at or above ${ASK_MIN_SCORE}).\n\n` +
    "Try rewording it, widen the scope flags, or run `sec index` to cover more filings."
  );
}

/**
 * Answers a question from the filing prose already indexed.
 *
 * Retrieval, not extraction: it quotes what a filing says. A NUMBER comes from
 * `sec show xbrl` or `sec show facts`, which report what the filer tagged
 * rather than what a model read — and the README says so, because the first
 * question anyone asks a tool like this is a number.
 */
export class AskTask extends Task<TaskPorts<AskTaskInput>, TaskPorts<AskTaskOutput>> {
  static readonly type = "AskTask";
  static readonly category = "SEC";
  static readonly title = "Ask about filings";
  static readonly description =
    "Answers a question from indexed filing sections, citing the filings it read.";
  static readonly cacheable = false;

  public static inputSchema() {
    return Type.Object({
      question: Type.String(),
      cik: Type.Optional(Type.Number()),
      form: Type.Optional(Type.String()),
      since: Type.Optional(Type.String()),
      accession: Type.Optional(Type.String()),
      topK: Type.Optional(Type.Number()),
    });
  }

  public static outputSchema() {
    return Type.Object({
      answer: Type.String(),
      references: Type.Array(Type.Unknown()),
      modelId: Type.String(),
      modelReason: Type.String(),
      grounded: Type.Boolean(),
    });
  }

  async execute(input: TaskPorts<AskTaskInput>): Promise<TaskPorts<AskTaskOutput>> {
    // Resolved before the KB is touched, so a machine with no usable model says
    // so before it spends time embedding a query.
    const model = secGenerationModel();
    const kb = await getSecKnowledgeBase();
    if (!globalServiceRegistry.has(HUMAN_CONNECTOR)) {
      globalServiceRegistry.registerInstance(HUMAN_CONNECTOR, ONE_SHOT_CONNECTOR);
    }

    const scope = describeScope(input);
    const result = (await new AiChatWithKbTask().run({
      model: model.modelId,
      // No `embeddingModel`: the knowledge base has a strategy installed, so
      // retrieval goes through its own callback with the model it was built
      // against. Passing one here routes it through the chat task's capability
      // gate, which asks for `text.generation` and rejects the embedder.
      knowledgeBaseIds: [SEC_KB_ID],
      // One turn. `AiChatWithKbTask` is a conversation, and a conversation asks
      // the human for the next message — through the human connector, which a
      // one-shot `sec ask` has not registered and should not need to.
      maxIterations: 1,
      topKPerKb: input.topK ?? 8,
      minScore: ASK_MIN_SCORE,
      prompt: scope === undefined ? input.question : `${input.question}\n\n(${scope})`,
      system:
        "You answer questions about SEC filings using only the retrieved excerpts. " +
        "Cite the excerpt numbers you used. When the excerpts do not answer the " +
        "question, say so plainly rather than filling the gap from memory — the " +
        "filings are the only source you have.",
    } as never)) as {
      text: string;
      references: readonly {
        index: number;
        title: string;
        url?: string;
        snippet: string;
        score: number;
      }[];
    };

    const references = (result.references ?? []).map((reference) => ({
      index: reference.index,
      title: reference.title,
      url: reference.url,
      snippet: reference.snippet,
      score: reference.score,
    }));

    // Retrieved nothing means the model answered from memory, and the answer is
    // about SEC filings the database does not contain. Suppressed here rather
    // than in the renderer, so `--json` consumers get the same refusal.
    if (references.length === 0) {
      return {
        answer: ungroundedAnswer(await kb.chunkCount()),
        references: [],
        modelId: model.modelId,
        modelReason: model.reason,
        grounded: false,
      };
    }

    return {
      answer: result.text,
      references,
      modelId: model.modelId,
      modelReason: model.reason,
      grounded: true,
    };
  }
}

/**
 * The scope as a clause appended to the question.
 *
 * Retrieval here is over one knowledge base with no per-query filter, so the
 * scope steers the model rather than the search. Said plainly instead of
 * implied: a narrowing that only lives in a flag is a narrowing the answer can
 * silently ignore.
 */
function describeScope(input: TaskPorts<AskTaskInput>): string | undefined {
  const parts: string[] = [];
  if (input.cik !== undefined) parts.push(`CIK ${input.cik}`);
  if (input.form !== undefined) parts.push(`form ${input.form}`);
  if (input.since !== undefined) parts.push(`filed on or after ${input.since}`);
  if (input.accession !== undefined) parts.push(`accession ${input.accession}`);
  return parts.length === 0 ? undefined : `Restrict your answer to: ${parts.join(", ")}`;
}
