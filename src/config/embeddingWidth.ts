/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The fields a model's own `config.json` states its hidden width in.
 *
 * BERT-family encoders — every model this CLI embeds with — write
 * `hidden_size`. The rest are the spellings the other architectures on the Hub
 * use, listed in the order a config that carries more than one should be read.
 */
const WIDTH_FIELDS = ["hidden_size", "d_model", "n_embd", "hidden_dim", "dim"] as const;

/** Where the derived widths are remembered, under the raw-data folder. */
function widthCachePath(): string {
  const root = process.env.SEC_RAW_DATA_FOLDER?.trim() || ".";
  return join(root, "model-cache", "embedding-widths.json");
}

function readWidthCache(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(widthCachePath(), "utf8"));
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, number>) : {};
  } catch {
    // Absent or unreadable is the same answer: nothing is remembered.
    return {};
  }
}

function rememberWidth(repo: string, width: number): void {
  try {
    const path = widthCachePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify({ ...readWidthCache(), [repo]: width }, null, 2)}\n`);
  } catch {
    // A cache that cannot be written costs a request next time and nothing
    // else, so it must not fail the run that derived the width successfully.
  }
}

/**
 * The HuggingFace repo behind a model id, or `undefined` where there is none.
 *
 * Strips the `onnx:` runtime prefix and the `:q8`-style quantization tail —
 * neither names the model, and both variants of one repo have one width. A
 * cloud model id (`gemini-embedding-001`) has no `org/name` shape and returns
 * `undefined`: there is no config to read, and inventing a repo path would ask
 * the Hub about a model that is not there.
 */
export function huggingFaceRepoOf(modelId: string): string | undefined {
  const withoutPrefix = modelId.includes(":") ? modelId.slice(modelId.indexOf(":") + 1) : modelId;
  const bare = withoutPrefix.replace(/:(?:q\d+f?\d*|fp\d+|int\d+)$/i, "");
  return /^[^/\s:]+\/[^/\s:]+$/.test(bare) ? bare : undefined;
}

/** The width a parsed `config.json` states, or `undefined` if it states none. */
export function widthFromModelConfig(config: unknown): number | undefined {
  if (typeof config !== "object" || config === null) return undefined;
  const record = config as Record<string, unknown>;
  for (const field of WIDTH_FIELDS) {
    const value = record[field];
    if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  }
  return undefined;
}

/**
 * The model's output width, read off the model.
 *
 * A hand-maintained table of model names was the alternative, and it is wrong
 * in the direction that costs: a model it does not carry is refused even though
 * the model itself has always been able to answer, and an entry that drifts is
 * believed. So this asks the model — its published `config.json`, which is the
 * same file the runtime loads the architecture from.
 *
 * `hidden_size` IS the width here rather than an approximation of it: these
 * records are registered with `pooling: "mean"`, so the vector handed back is
 * the mean of the last hidden states and has exactly that many components.
 *
 * The config is a couple of kilobytes and the answer is remembered per repo, so
 * a model that has been used once resolves offline. First use needs the network
 * — but first use downloads the weights over the same connection, so there is
 * no case where this is the request that cannot be made.
 *
 * Returns `undefined` rather than throwing for every way of not knowing, so the
 * caller can say which variable to set; the distinctions between "no repo",
 * "unreachable" and "no width field" do not change that answer.
 */
export async function resolveEmbeddingWidth(modelId: string): Promise<number | undefined> {
  const repo = huggingFaceRepoOf(modelId);
  if (repo === undefined) return undefined;

  const remembered = readWidthCache()[repo];
  if (typeof remembered === "number" && Number.isInteger(remembered) && remembered > 0) {
    return remembered;
  }

  let config: unknown;
  try {
    const response = await fetch(`https://huggingface.co/${repo}/resolve/main/config.json`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return undefined;
    config = await response.json();
  } catch {
    return undefined;
  }

  const width = widthFromModelConfig(config);
  if (width !== undefined) rememberWidth(repo, width);
  return width;
}
