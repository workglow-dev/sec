/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { secEmbeddingDimensions } from "./models";

/**
 * The width guard used to compare a compile-time `768` against itself. The
 * model id is free-form env input and the width was a literal, so the clause
 * `stored.dimensions === dimensions` was `768 === 768` on every path — and a
 * genuinely narrower model opened the base without complaint, then failed on
 * the first chunk from inside `@workglow/knowledge-base` with a message naming
 * neither the variable nor the model.
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
    if (saved.model === undefined) delete process.env.SEC_EMBEDDING_MODEL;
    else process.env.SEC_EMBEDDING_MODEL = saved.model;
    if (saved.dims === undefined) delete process.env.SEC_EMBEDDING_DIMENSIONS;
    else process.env.SEC_EMBEDDING_DIMENSIONS = saved.dims;
  });

  it("knows the default model's width", () => {
    expect(secEmbeddingDimensions()).toBe(768);
  });

  it("knows the width of the other models it has verified", () => {
    process.env.SEC_EMBEDDING_MODEL = "onnx:Xenova/all-MiniLM-L6-v2:q8";
    expect(secEmbeddingDimensions()).toBe(384);
  });

  it("refuses a model whose width it does not know, naming the way forward", () => {
    // Refusing at open is the whole point: the alternative is discovering it
    // mid-`sec index`, after the weights have been downloaded.
    process.env.SEC_EMBEDDING_MODEL = "onnx:some-org/some-unlisted-model:q8";

    expect(() => secEmbeddingDimensions()).toThrow(/SEC_EMBEDDING_MODEL/);
    expect(() => secEmbeddingDimensions()).toThrow(/some-unlisted-model/);
    expect(() => secEmbeddingDimensions()).toThrow(/SEC_EMBEDDING_DIMENSIONS/);
  });

  it("takes an explicit width for a model it does not know", () => {
    // The escape hatch that keeps the refusal from being a dead end. Stating
    // the width is also what makes the stored-vs-configured check live.
    process.env.SEC_EMBEDDING_MODEL = "onnx:some-org/some-unlisted-model:q8";
    process.env.SEC_EMBEDDING_DIMENSIONS = "1024";
    expect(secEmbeddingDimensions()).toBe(1024);
  });

  it("lets an explicit width override a known one", () => {
    process.env.SEC_EMBEDDING_MODEL = "onnx:Xenova/bge-base-en-v1.5:q8";
    process.env.SEC_EMBEDDING_DIMENSIONS = "512";
    expect(secEmbeddingDimensions()).toBe(512);
  });

  it.each(["0", "-1", "12.5", "many", ""])("refuses %o as a width", (bad) => {
    // A malformed override must not silently fall back to the table: creating
    // the column at the wrong width is the corruption this whole guard exists
    // to avoid.
    process.env.SEC_EMBEDDING_MODEL = "onnx:some-org/some-unlisted-model:q8";
    process.env.SEC_EMBEDDING_DIMENSIONS = bad;
    expect(() => secEmbeddingDimensions()).toThrow(/SEC_EMBEDDING_DIMENSIONS/);
  });
});
