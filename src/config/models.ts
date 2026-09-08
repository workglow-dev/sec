/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecCliConfigurationError } from "./EnvToDI";

/**
 * The two model roles this CLI has.
 *
 * `sec ask` embeds filing sections and then answers from what it retrieves.
 * There is no third role, and no per-command override matrix: the extraction
 * pipeline that needed one lives elsewhere now.
 */

/**
 * Embeddings, local by default.
 *
 * A demo that requires a credit card before it prints anything is not a demo,
 * so the default runs on the machine: `bge-base-en-v1.5` through
 * `@workglow/huggingface-transformers`, quantized, no key. The weights are
 * downloaded once into `SEC_RAW_DATA_FOLDER/onnx-cache` and reused.
 */
const DEFAULT_EMBEDDING_MODEL = "onnx:Xenova/bge-base-en-v1.5:q8";

/**
 * Output widths for the embedding models this project has verified, keyed by
 * the bare model name — `onnx:Xenova/bge-base-en-v1.5:q8` is looked up as
 * `bge-base-en-v1.5`, so the runtime prefix and the quantization suffix do not
 * each need their own entry.
 *
 * The width is a property of the model, and the model id is free-form env
 * input. A constant cannot stand in for it: the vector column is created at
 * whatever width is resolved here and every stored vector has it, so a value
 * that does not match the configured model builds a store the query cannot
 * read.
 */
const KNOWN_EMBEDDING_WIDTHS: Readonly<Record<string, number>> = {
  "bge-base-en-v1.5": 768,
  "bge-small-en-v1.5": 384,
  "bge-large-en-v1.5": 1024,
  "all-MiniLM-L6-v2": 384,
  "all-mpnet-base-v2": 768,
  "gte-base": 768,
  "gte-small": 384,
  "e5-base-v2": 768,
  "e5-small-v2": 384,
  "e5-large-v2": 1024,
};

/** The embedding model id, overridable with `SEC_EMBEDDING_MODEL`. */
export function secEmbeddingModel(): string {
  return process.env.SEC_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

/**
 * The bare model name {@link KNOWN_EMBEDDING_WIDTHS} is keyed by: the segment
 * after the last `/`, with a trailing `:quantization` dropped.
 */
function bareModelName(modelId: string): string {
  const afterOrg = modelId.slice(modelId.lastIndexOf("/") + 1);
  const colon = afterOrg.indexOf(":");
  return colon === -1 ? afterOrg : afterOrg.slice(0, colon);
}

/**
 * The configured embedding model's output width.
 *
 * Resolved rather than assumed, and it refuses rather than guessing. The
 * alternative is what this replaced: the width was a literal `768` used both to
 * create the column and to check it, so `stored.dimensions === dimensions` was
 * `768 === 768` on every path, and a genuinely narrower model opened the
 * knowledge base without complaint and failed on the first chunk with a
 * `@workglow/knowledge-base` internal message naming neither the variable nor
 * the model — after the weights had been downloaded and the run had started.
 *
 * `SEC_EMBEDDING_DIMENSIONS` is the way forward for a model this table does not
 * carry, and stating it is also what makes the stored-vs-configured comparison
 * in `kb_index` mean something.
 */
export function secEmbeddingDimensions(): number {
  const model = secEmbeddingModel();
  const override = process.env.SEC_EMBEDDING_DIMENSIONS?.trim();

  if (override !== undefined && override !== "") {
    const width = Number(override);
    // A malformed override must not fall through to the table: creating the
    // column at a width the model does not produce is the corruption the whole
    // guard exists to avoid.
    if (!Number.isInteger(width) || width <= 0) {
      throw new SecCliConfigurationError(
        `SEC_EMBEDDING_DIMENSIONS is "${override}", which is not a positive whole number. ` +
          `It is the output width of SEC_EMBEDDING_MODEL ("${model}") in dimensions — ` +
          `768 for the default model. Unset it to use the width this project has recorded ` +
          `for the model.`
      );
    }
    return width;
  }

  const known = KNOWN_EMBEDDING_WIDTHS[bareModelName(model)];
  if (known !== undefined) return known;

  throw new SecCliConfigurationError(
    `SEC_EMBEDDING_MODEL is "${model}", and this project has no recorded output width for ` +
      `it. The width cannot be guessed: the vector column is created at it, so the wrong ` +
      `value builds an index the query cannot read. Either set ` +
      `SEC_EMBEDDING_DIMENSIONS to the model's width, or use one of the models whose width ` +
      `is recorded: ${Object.keys(KNOWN_EMBEDDING_WIDTHS).join(", ")}.`
  );
}

/** Cloud generation models, in the order a key is looked for. */
const CLOUD_GENERATION: readonly { readonly env: string; readonly model: string }[] = [
  { env: "ANTHROPIC_API_KEY", model: "claude-sonnet-5" },
  { env: "OPENAI_API_KEY", model: "gpt-5" },
  { env: "GEMINI_API_KEY", model: "gemini-2.5-pro" },
];

/**
 * A local generation model, so `ask` answers with no key at all.
 *
 * Small, and it shows: retrieval-grounded answering is a far easier task than
 * schema-constrained extraction, but the key-less experience is visibly worse
 * than the cloud one. `ask` prints which model answered, so a disappointing
 * answer is attributable rather than mysterious.
 */
const DEFAULT_LOCAL_GENERATION = "onnx:onnx-community/LFM2.5-350M-ONNX";

export interface ResolvedModel {
  readonly modelId: string;
  /** One clause saying why this one, for the line printed under an answer. */
  readonly reason: string;
}

/**
 * The generation model, and why.
 *
 * `SEC_MODEL` wins outright. Otherwise the first cloud provider whose key is in
 * the environment, and failing that the local model — which always resolves, so
 * this function does not throw. What it will not do is silently pick a cloud
 * model whose key is absent: that fails later, inside a task, as an error about
 * a provider rather than about configuration.
 */
export function secGenerationModel(): ResolvedModel {
  const override = process.env.SEC_MODEL?.trim();
  if (override) return { modelId: override, reason: "SEC_MODEL" };
  for (const candidate of CLOUD_GENERATION) {
    if (process.env[candidate.env]?.trim()) {
      return { modelId: candidate.model, reason: `${candidate.env} is set` };
    }
  }
  return { modelId: DEFAULT_LOCAL_GENERATION, reason: "no API key found — running locally" };
}

/**
 * Every model id this CLI registers: the two roles, deduplicated.
 */
export function secModelIds(): readonly string[] {
  return [...new Set([secEmbeddingModel(), secGenerationModel().modelId])];
}

/** The provider keys present, for the message when a cloud id resolves nothing. */
export function describeMissingKeyFor(modelId: string): string {
  const names = CLOUD_GENERATION.map((candidate) => candidate.env).join(", ");
  throw new SecCliConfigurationError(
    `No provider is registered for model "${modelId}". Set one of ${names}, ` +
      `or unset SEC_MODEL to fall back to the local model.`
  );
}
