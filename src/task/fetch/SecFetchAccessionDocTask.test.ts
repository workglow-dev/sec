/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { type FetchUrlTaskInput, type IExecuteContext, TaskError } from "workglow";
import { SecFetchAccessionDocTask } from "./SecFetchAccessionDocTask";

describe("SecFetchAccessionDocTask", () => {
  it("constructs: URL rewrite lives on resolveFetchInput, not execute", async () => {
    // FetchUrlTask is streamable: TaskRunner never calls execute(), and the
    // constructor throws if a subclass overrides it. A cache-miss fetch
    // constructs this task; that throw used to surface as FETCH_ERROR on every
    // uncached filing (BHAV 2097288 424B4, Form 3/4, D).
    const task = new SecFetchAccessionDocTask({
      cik: 2097288,
      accessionNumber: "0001213900-26-012345",
      fileName: "ea123.htm",
    });
    const resolved = await (
      task as unknown as {
        resolveFetchInput: (
          input: FetchUrlTaskInput,
          context: IExecuteContext
        ) => Promise<FetchUrlTaskInput>;
      }
    ).resolveFetchInput(
      {
        cik: 2097288,
        accessionNumber: "0001213900-26-012345",
        fileName: "ea123.htm",
      } as unknown as FetchUrlTaskInput,
      {} as IExecuteContext
    );
    expect(resolved.url).toBe(
      "https://www.sec.gov/Archives/edgar/data/0002097288/000121390026012345/ea123.htm"
    );
    expect(resolved.method).toBe("GET");
    expect(resolved.response_type).toBe("text");
  });

  it('honors an explicit response_type "stream" instead of guessing from the URL', async () => {
    // The extension mapping decides only for a caller that stated nothing.
    // A caller asking for "stream" wants the bytes on disk and no value in
    // memory (`sec spac download`); SecFetchFileOutputCache sinks that through
    // saveOutputStreamPort to the same path a "text" fetch would write, so
    // downgrading it here would re-materialize the very document the caller
    // asked not to hold.
    const task = new SecFetchAccessionDocTask({
      cik: 2097288,
      accessionNumber: "0001213900-26-012345",
      fileName: "ea123.htm",
      response_type: "stream",
    });
    const resolved = await (
      task as unknown as {
        resolveFetchInput: (
          input: FetchUrlTaskInput,
          context: IExecuteContext
        ) => Promise<FetchUrlTaskInput>;
      }
    ).resolveFetchInput(
      {
        cik: 2097288,
        accessionNumber: "0001213900-26-012345",
        fileName: "ea123.htm",
        response_type: "stream",
      } as unknown as FetchUrlTaskInput,
      {} as IExecuteContext
    );
    expect(resolved.response_type).toBe("stream");
  });

  /**
   * The name is filer-written and becomes a URL path segment here. Refusing it
   * in the constructor, which builds the URL, means a caller that skipped the
   * check still queues no request.
   */
  it.each(["../../x", "a?b", "a#b", "sub/doc.htm", "%2e%2e%2fx", ""])(
    "refuses %j before any request exists",
    (fileName) => {
      const build = () =>
        new SecFetchAccessionDocTask({
          cik: 2097288,
          accessionNumber: "0001213900-26-012345",
          fileName,
        });
      expect(build).toThrow(TaskError);
      expect(build).toThrow(/Refusing unsafe document name for 2097288\/0001213900-26-012345/);
    }
  );

  it("refuses the same names from inputToUrl and inputToFileName", () => {
    const task = new SecFetchAccessionDocTask({
      cik: 2097288,
      accessionNumber: "0001213900-26-012345",
      fileName: "ea123.htm",
    });
    for (const fileName of ["../../x", "a?b", "a#b"]) {
      const input = { cik: 2097288, accessionNumber: "0001213900-26-012345", fileName };
      expect(() => task.inputToUrl(input)).toThrow(TaskError);
      expect(() => task.inputToFileName(input)).toThrow(TaskError);
    }
  });

  it("keeps a safe name's URL and cache path exactly as before", () => {
    const task = new SecFetchAccessionDocTask({
      cik: 2097288,
      accessionNumber: "0001213900-26-012345",
      fileName: "tm2412345-1_s1.htm",
    });
    const input = {
      cik: 2097288,
      accessionNumber: "0001213900-26-012345",
      fileName: "tm2412345-1_s1.htm",
    };
    expect(task.inputToUrl(input)).toBe(
      "https://www.sec.gov/Archives/edgar/data/0002097288/000121390026012345/tm2412345-1_s1.htm"
    );
    expect(task.inputToFileName(input)).toBe(
      "accessiondocs/0002097288/000121390026012345-tm2412345-1_s1.htm"
    );
  });
});
