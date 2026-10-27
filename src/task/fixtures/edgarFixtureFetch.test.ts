/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** The User-Agent a fixture fetch puts on the wire, with `SEC_USER_AGENT` set to `value`. */
async function userAgentSent(value: string | undefined): Promise<string> {
  vi.resetModules();
  if (value === undefined) vi.stubEnv("SEC_USER_AGENT", undefined);
  else vi.stubEnv("SEC_USER_AGENT", value);
  const { SecFetchTask } = await import("../fetch/SecFetchTask");
  const { fetchEdgarText } = await import("./edgarFixtureFetch");
  let sent: string | undefined;
  vi.spyOn(SecFetchTask.prototype, "run").mockImplementation(async function (this: {
    defaults: { headers?: Record<string, string> };
  }) {
    sent = this.defaults.headers?.["User-Agent"];
    return { text: "ok" };
  });
  await fetchEdgarText("https://www.sec.gov/x");
  return sent ?? "";
}

describe("fixture fetches identify themselves as the pipeline does", () => {
  it("sends the compiled-in default when SEC_USER_AGENT is empty or blank", async () => {
    // The fixture commands used `process.env.SEC_USER_AGENT ?? default`, which
    // keeps an empty string — and EDGAR refuses a request with no User-Agent.
    const unset = await userAgentSent(undefined);
    expect(unset.length).toBeGreaterThan(0);
    expect(await userAgentSent("")).toBe(unset);
    expect(await userAgentSent("   ")).toBe(unset);
  });

  it("sends the configured value, trimmed", async () => {
    expect(await userAgentSent("  Acme Research ops@acme.example  ")).toBe(
      "Acme Research ops@acme.example"
    );
  });
});

describe("a fixture fetch that fails", () => {
  it("throws rather than returning an empty body", async () => {
    const { SecFetchTask } = await import("../fetch/SecFetchTask");
    const { fetchEdgarText, fetchEdgarBytes } = await import("./edgarFixtureFetch");
    vi.spyOn(SecFetchTask.prototype, "run").mockRejectedValue(new Error("429 Too Many Requests"));
    await expect(fetchEdgarText("https://www.sec.gov/x")).rejects.toThrow("429");
    await expect(fetchEdgarBytes("https://www.sec.gov/x")).rejects.toThrow("429");
  });

  it("throws on a response with no body", async () => {
    const { SecFetchTask } = await import("../fetch/SecFetchTask");
    const { fetchEdgarText } = await import("./edgarFixtureFetch");
    vi.spyOn(SecFetchTask.prototype, "run").mockResolvedValue({});
    await expect(fetchEdgarText("https://www.sec.gov/x")).rejects.toThrow(/no body/);
  });
});

describe("the S-1 candidate feeds", () => {
  it("fail the listing when a feed fails, instead of reporting no candidates", async () => {
    // A blocked run used to read as "Selected 0 of 0": each feed swallowed its
    // error into an empty document.
    const { SecFetchTask } = await import("../fetch/SecFetchTask");
    const { edgarS1Deps } = await import("./s1FixtureSource");
    vi.spyOn(SecFetchTask.prototype, "run").mockRejectedValue(new Error("429 Too Many Requests"));
    await expect(edgarS1Deps(() => {}).listCandidates()).rejects.toThrow("429");
  });

  it("names a filer it skips", async () => {
    const { SecFetchTask } = await import("../fetch/SecFetchTask");
    const { edgarS1Deps } = await import("./s1FixtureSource");
    vi.spyOn(SecFetchTask.prototype, "run").mockImplementation(async function (this: {
      defaults: { url: string };
    }) {
      const { url } = this.defaults;
      if (url.includes("SIC=6770")) return { text: "<a href='?CIK=0001234567'/>" };
      if (url.includes("getcurrent")) return { text: "" };
      throw new Error("404 Not Found");
    });
    const lines: string[] = [];
    const candidates = await edgarS1Deps((m) => lines.push(m)).listCandidates();
    expect(candidates).toEqual([]);
    expect(lines).toEqual(["Skipping CIK 0001234567: 404 Not Found"]);
  });
});
