/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `AiChatWithKbTask` is the seam: everything in `AskTask` that is checkable
 * without a model is on this side of it — whether an answer with no retrieved
 * text is printed as an answer, and what the scope flags do.
 */
const runMock = vi.fn();
const chunkCountMock = vi.fn(async () => 0);

vi.mock("workglow", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("workglow");
  return {
    ...actual,
    AiChatWithKbTask: class {
      run(input: unknown) {
        return runMock(input);
      }
    },
  };
});

vi.mock("../../kb/secKnowledgeBase", () => ({
  SEC_KB_ID: "sec",
  getSecKnowledgeBase: async () => ({ chunkCount: chunkCountMock }),
}));

vi.mock("../../config/models", () => ({
  secGenerationModel: () => ({ modelId: "onnx:test-model", reason: "test" }),
}));

const { AskTask } = await import("./AskTask");

const REFERENCE = {
  index: 1,
  title: "10-K · 2024-11-01 · 0000320193-24-000123",
  url: "https://example.invalid/filing",
  snippet: "Revenue increased…",
  score: 0.71,
};

describe("AskTask grounding", () => {
  beforeEach(() => {
    runMock.mockReset();
    chunkCountMock.mockReset();
    chunkCountMock.mockResolvedValue(0);
  });

  it("does not present a model's memory as an answer when nothing was retrieved", async () => {
    // The defect this guards: eleven sentences of confident, unsourced
    // financial prose about a company whose filings the database does not hold,
    // returned with exit 0 and `references: []`.
    runMock.mockResolvedValue({
      text: "Apple's revenue reached approximately $383 billion in fiscal year 2023.",
      references: [],
    });

    const out = await new AskTask().run({ question: "What is Apple's revenue?" } as never);

    expect(out.grounded).toBe(false);
    expect(out.answer).not.toContain("383");
    expect(out.answer).toContain("sec index");
    expect(out.references).toEqual([]);
  });

  it("names the index build when nothing is indexed at all", async () => {
    runMock.mockResolvedValue({ text: "The CEO of Tesla is Elon Musk.", references: [] });
    chunkCountMock.mockResolvedValue(0);

    const out = await new AskTask().run({ question: "Who is the CEO of Tesla?" } as never);

    expect(out.answer).toContain("Nothing is indexed");
    expect(out.answer).toContain("sec update documents");
    expect(out.answer).not.toContain("Elon Musk");
  });

  it("distinguishes an index that holds chunks but matched none of them", async () => {
    // Not the same failure, and not the same fix: the index is built, so
    // telling the operator to build it would be wrong.
    runMock.mockResolvedValue({ text: "made up", references: [] });
    chunkCountMock.mockResolvedValue(4210);

    const out = await new AskTask().run({ question: "anything" } as never);

    expect(out.answer).toContain("4210 chunk(s) indexed");
    expect(out.answer).not.toContain("Nothing is indexed");
  });

  it("passes the answer through, marked grounded, when filing text was cited", async () => {
    runMock.mockResolvedValue({ text: "Revenue was $383bn.", references: [REFERENCE] });

    const out = await new AskTask().run({ question: "revenue?" } as never);

    expect(out.grounded).toBe(true);
    expect(out.answer).toBe("Revenue was $383bn.");
    expect(out.references).toHaveLength(1);
    expect(out.references[0]).toMatchObject({ index: 1, score: 0.71 });
  });

  it("states its own score floor rather than inheriting the library's", async () => {
    runMock.mockResolvedValue({ text: "x", references: [REFERENCE] });

    await new AskTask().run({ question: "q" } as never);

    expect(runMock.mock.calls[0]![0]).toMatchObject({ minScore: 0.3, maxIterations: 1 });
  });

  it("carries every scope flag into the prompt it sends", async () => {
    runMock.mockResolvedValue({ text: "x", references: [REFERENCE] });

    await new AskTask().run({
      question: "what happened?",
      cik: 320193,
      form: "10-K",
      since: "2024-01-01",
      accession: "0000320193-24-000123",
    } as never);

    const prompt = String((runMock.mock.calls[0]![0] as { prompt: string }).prompt);
    expect(prompt).toContain("what happened?");
    expect(prompt).toContain("CIK 320193");
    expect(prompt).toContain("form 10-K");
    expect(prompt).toContain("filed on or after 2024-01-01");
    expect(prompt).toContain("accession 0000320193-24-000123");
  });

  it("sends the bare question when no scope is given", async () => {
    runMock.mockResolvedValue({ text: "x", references: [REFERENCE] });

    await new AskTask().run({ question: "just this" } as never);

    expect((runMock.mock.calls[0]![0] as { prompt: string }).prompt).toBe("just this");
  });
});
