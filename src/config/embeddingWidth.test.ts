/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { huggingFaceRepoOf, resolveEmbeddingWidth, widthFromModelConfig } from "./embeddingWidth";
import { secEmbeddingDimensions } from "./models";

/**
 * The width guard used to compare a compile-time `768` against itself. The
 * model id is free-form env input and the width was a literal, so the clause
 * `stored.dimensions === dimensions` was `768 === 768` on every path — and a
 * genuinely narrower model opened the base without complaint, then failed on
 * the first chunk from inside `@workglow/knowledge-base` with a message naming
 * neither the variable nor the model.
 *
 * The first fix for that was a table of model names kept here. This is the
 * second: the model states its own width, so nothing has to be kept in step
 * and a model nobody listed still opens.
 */
describe("resolving the embedding width", () => {
  const saved = {
    model: process.env.SEC_EMBEDDING_MODEL,
    dims: process.env.SEC_EMBEDDING_DIMENSIONS,
    raw: process.env.SEC_RAW_DATA_FOLDER,
  };

  beforeEach(() => {
    delete process.env.SEC_EMBEDDING_MODEL;
    delete process.env.SEC_EMBEDDING_DIMENSIONS;
    // Its own folder per test, so one test's remembered width is not another's
    // answer and the cache is observable rather than inferred.
    process.env.SEC_RAW_DATA_FOLDER = mkdtempSync(join(tmpdir(), "sec-width-"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const [key, value] of [
      ["SEC_EMBEDDING_MODEL", saved.model],
      ["SEC_EMBEDDING_DIMENSIONS", saved.dims],
      ["SEC_RAW_DATA_FOLDER", saved.raw],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  /** A Hub that answers with one config, and counts how often it was asked. */
  function stubHub(config: unknown): { calls: string[] } {
    const calls: string[] = [];
    vi.stubGlobal("fetch", (url: string) => {
      calls.push(String(url));
      return Promise.resolve({ ok: true, json: () => Promise.resolve(config) } as Response);
    });
    return { calls };
  }

  describe("huggingFaceRepoOf", () => {
    it.each([
      ["onnx:Xenova/bge-base-en-v1.5:q8", "Xenova/bge-base-en-v1.5"],
      ["onnx:Xenova/bge-base-en-v1.5", "Xenova/bge-base-en-v1.5"],
      ["onnx:Xenova/all-MiniLM-L6-v2:fp16", "Xenova/all-MiniLM-L6-v2"],
    ])("reads the repo out of %o", (modelId, repo) => {
      // The runtime prefix and the quantization tail name neither the model nor
      // its width, and both variants of one repo have one width.
      expect(huggingFaceRepoOf(modelId)).toBe(repo);
    });

    it.each(["gemini-embedding-001", "text-embedding-3-small", "onnx:", "gguf:model.gguf"])(
      "has no repo for %o",
      (modelId) => {
        // A cloud endpoint publishes no config. Inventing a repo path would ask
        // the Hub about a model that is not there and read the 404 as a width.
        expect(huggingFaceRepoOf(modelId)).toBeUndefined();
      }
    );
  });

  describe("widthFromModelConfig", () => {
    it("reads hidden_size, which is what mean pooling produces", () => {
      expect(widthFromModelConfig({ hidden_size: 384, model_type: "bert" })).toBe(384);
    });

    it.each([
      [{ d_model: 1024 }, 1024],
      [{ n_embd: 2048 }, 2048],
      [{ hidden_dim: 512 }, 512],
    ])("reads the other architectures' spellings (%o)", (config, width) => {
      expect(widthFromModelConfig(config)).toBe(width);
    });

    it.each([{}, { hidden_size: 0 }, { hidden_size: -1 }, { hidden_size: "768" }, null, "x"])(
      "states no width for %o",
      (config) => {
        expect(widthFromModelConfig(config)).toBeUndefined();
      }
    );
  });

  describe("resolveEmbeddingWidth", () => {
    it("asks the model, and takes the answer", async () => {
      const hub = stubHub({ hidden_size: 384 });

      expect(await resolveEmbeddingWidth("onnx:Xenova/all-MiniLM-L6-v2:q8")).toBe(384);
      expect(hub.calls).toEqual([
        "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/config.json",
      ]);
    });

    it("asks once and remembers, so a used model resolves offline", async () => {
      const hub = stubHub({ hidden_size: 768 });
      expect(await resolveEmbeddingWidth("onnx:Xenova/bge-base-en-v1.5:q8")).toBe(768);

      // Not a second request, and not a second answer either — the same one,
      // now from disk. First use needs the network because first use downloads
      // the weights over the same connection.
      vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
      expect(await resolveEmbeddingWidth("onnx:Xenova/bge-base-en-v1.5:q8")).toBe(768);
      expect(hub.calls).toHaveLength(1);
    });

    it("shares one answer across a repo's quantizations", async () => {
      stubHub({ hidden_size: 768 });
      await resolveEmbeddingWidth("onnx:Xenova/bge-base-en-v1.5:q8");

      const cache = JSON.parse(
        readFileSync(
          join(process.env.SEC_RAW_DATA_FOLDER!, "model-cache", "embedding-widths.json"),
          "utf8"
        )
      ) as Record<string, number>;
      expect(cache).toEqual({ "Xenova/bge-base-en-v1.5": 768 });
    });

    it.each([
      ["an unreachable Hub", () => vi.stubGlobal("fetch", () => Promise.reject(new Error("no")))],
      [
        "a repo that is not there",
        () => vi.stubGlobal("fetch", () => Promise.resolve({ ok: false } as Response)),
      ],
      ["a config that states no width", () => stubHub({ model_type: "bert" })],
    ])("does not know the width from %s", async (_label, arrange) => {
      arrange();
      expect(await resolveEmbeddingWidth("onnx:some-org/some-model:q8")).toBeUndefined();
    });
  });
});

describe("secEmbeddingDimensions", () => {
  const saved = {
    model: process.env.SEC_EMBEDDING_MODEL,
    dims: process.env.SEC_EMBEDDING_DIMENSIONS,
    raw: process.env.SEC_RAW_DATA_FOLDER,
  };

  beforeEach(() => {
    delete process.env.SEC_EMBEDDING_MODEL;
    delete process.env.SEC_EMBEDDING_DIMENSIONS;
    process.env.SEC_RAW_DATA_FOLDER = mkdtempSync(join(tmpdir(), "sec-width-"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const [key, value] of [
      ["SEC_EMBEDDING_MODEL", saved.model],
      ["SEC_EMBEDDING_DIMENSIONS", saved.dims],
      ["SEC_RAW_DATA_FOLDER", saved.raw],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("gets the default model's width from the model", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ hidden_size: 768 }) } as Response)
    );
    expect(await secEmbeddingDimensions()).toBe(768);
  });

  it("opens a model no table here lists", async () => {
    // The table this replaced refused one, and refusing was the entire cost:
    // the model had the answer the whole time.
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ hidden_size: 1024 }) } as Response)
    );
    process.env.SEC_EMBEDDING_MODEL = "onnx:some-org/some-unlisted-model:q8";
    expect(await secEmbeddingDimensions()).toBe(1024);
  });

  it("refuses when the model cannot be asked, naming the way forward", async () => {
    // Refusing at open is the point: the alternative is discovering it
    // mid-`sec index`, after the weights have been downloaded.
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    process.env.SEC_EMBEDDING_MODEL = "onnx:some-org/some-unlisted-model:q8";

    await expect(secEmbeddingDimensions()).rejects.toThrow(/SEC_EMBEDDING_MODEL/);
    await expect(secEmbeddingDimensions()).rejects.toThrow(/some-unlisted-model/);
    await expect(secEmbeddingDimensions()).rejects.toThrow(/SEC_EMBEDDING_DIMENSIONS/);
  });

  it("takes an explicit width without asking anything", async () => {
    // The escape hatch for a model with no config to read — a cloud endpoint,
    // or an air-gapped run of one that has never been used here.
    const calls: string[] = [];
    vi.stubGlobal("fetch", (url: string) => {
      calls.push(String(url));
      return Promise.reject(new Error("should not be called"));
    });
    process.env.SEC_EMBEDDING_MODEL = "gemini-embedding-001";
    process.env.SEC_EMBEDDING_DIMENSIONS = "3072";

    expect(await secEmbeddingDimensions()).toBe(3072);
    expect(calls).toEqual([]);
  });

  it("lets an explicit width override what the model says", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ hidden_size: 768 }) } as Response)
    );
    process.env.SEC_EMBEDDING_MODEL = "onnx:Xenova/bge-base-en-v1.5:q8";
    process.env.SEC_EMBEDDING_DIMENSIONS = "512";
    expect(await secEmbeddingDimensions()).toBe(512);
  });

  it.each(["0", "-1", "12.5", "many"])("refuses %o as a width", async (bad) => {
    // A malformed override must not silently fall back to the derivation:
    // creating the column at the wrong width is the corruption this whole guard
    // exists to avoid.
    process.env.SEC_EMBEDDING_MODEL = "onnx:some-org/some-unlisted-model:q8";
    process.env.SEC_EMBEDDING_DIMENSIONS = bad;
    await expect(secEmbeddingDimensions()).rejects.toThrow(/SEC_EMBEDDING_DIMENSIONS/);
  });
});
