/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: LicenseRef-Proprietary
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { secEmbeddingDimensions, secEmbeddingModel } from "./models";

/**
 * The width guard used to compare a compile-time `768` against itself. The
 * model id is free-form env input and the width was a literal, so the clause
 * `stored.dimensions === dimensions` was `768 === 768` on every path — and a
 * genuinely narrower model opened the base without complaint, then failed on
 * the first chunk from inside `@workglow/knowledge-base` with a message naming
 * neither the variable nor the model.
 *
 * The width is declared beside the model it belongs to now, so the two cannot
 * disagree; the guard is what happens when the model is not that one.
 */
describe("secEmbeddingDimensions", () => {
  const saved = {
    model: process.env.SEC_EMBEDDING_MODEL,
    dims: process.env.SEC_EMBEDDING_DIMENSIONS,
  };

  beforeEach(() => {
    delete process.env.SEC_EMBEDDING_MODEL;
    delete process.env.SEC_EMBEDDING_DIMENSIONS;
  });

  afterEach(() => {
    for (const [key, value] of [
      ["SEC_EMBEDDING_MODEL", saved.model],
      ["SEC_EMBEDDING_DIMENSIONS", saved.dims],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("states the pinned model's width with nothing configured", () => {
    expect(secEmbeddingDimensions()).toBe(768);
  });

  it("states it for the pinned model named explicitly, not just by default", () => {
    // The two are one constant, so naming the default model in the environment
    // must reach the same answer as leaving it unset.
    process.env.SEC_EMBEDDING_MODEL = secEmbeddingModel();
    expect(secEmbeddingDimensions()).toBe(768);
  });

  it("refuses another model rather than assuming the pinned model's width", () => {
    // The whole guard: 768 is a fact about `bge-base-en-v1.5`, and applying it
    // to anything else is the bug this replaced. Refusing at open is what keeps
    // it from being discovered mid-`sec index`, after the weights downloaded.
    process.env.SEC_EMBEDDING_MODEL = "onnx:Xenova/all-MiniLM-L6-v2:q8";

    expect(() => secEmbeddingDimensions()).toThrow(/SEC_EMBEDDING_MODEL/);
    expect(() => secEmbeddingDimensions()).toThrow(/all-MiniLM-L6-v2/);
    expect(() => secEmbeddingDimensions()).toThrow(/SEC_EMBEDDING_DIMENSIONS/);
  });

  it("takes another model once its width is stated", () => {
    // The escape hatch that keeps the refusal from being a dead end — and the
    // only answer for a cloud endpoint, which has no local weights to inspect.
    process.env.SEC_EMBEDDING_MODEL = "onnx:Xenova/all-MiniLM-L6-v2:q8";
    process.env.SEC_EMBEDDING_DIMENSIONS = "384";
    expect(secEmbeddingDimensions()).toBe(384);
  });

  it("lets an explicit width override the pinned model's", () => {
    process.env.SEC_EMBEDDING_DIMENSIONS = "512";
    expect(secEmbeddingDimensions()).toBe(512);
  });

  it.each(["0", "-1", "12.5", "many"])("refuses %o as a width", (bad) => {
    // A malformed override must not silently fall back to the default: creating
    // the column at the wrong width is the corruption this whole guard exists
    // to avoid.
    process.env.SEC_EMBEDDING_DIMENSIONS = bad;
    expect(() => secEmbeddingDimensions()).toThrow(/SEC_EMBEDDING_DIMENSIONS/);
  });
});
