/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `primary_doc` is copied from the filer's submissions JSON. The conversion
 * sweep fetches it on a cache miss, so a name that is not one file in the
 * accession folder must stop there: no request, and a line saying why.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IExecuteContext } from "workglow";
import { resetDependencyInjectionsForTesting } from "../../config/TestingDI";
import { captureDiagnosticsForTesting, resetDiagnosticsForTesting } from "../../util/diagnostics";
import {
  ConvertFilingDocumentTask,
  type ConvertFilingDocumentTaskInput,
  conversionCandidates,
  conversionFetchFileName,
} from "./ConvertFilingDocumentTask";

const ACCESSION = "0001213900-26-000001";
const UNSAFE = ["../../x", "a?b", "a#b"] as const;

describe("conversionCandidates and conversionFetchFileName with an unsafe primary_doc", () => {
  it.each(UNSAFE)("%j is never probed", (primaryDoc) => {
    expect(conversionCandidates(ACCESSION, primaryDoc)).toEqual([`${ACCESSION}.txt`]);
  });

  it.each(UNSAFE)("%j is never fetched as a primary document", (primaryDoc) => {
    expect(conversionFetchFileName("DEF 14A", ACCESSION, primaryDoc)).toBeUndefined();
  });

  it.each(UNSAFE)(
    "%j does not stop a form fetched as the whole submission, which never uses it",
    (primaryDoc) => {
      expect(conversionFetchFileName("8-K", ACCESSION, primaryDoc)).toBe(`${ACCESSION}.txt`);
    }
  );

  it("still falls back to the whole submission when no primary document is named", () => {
    expect(conversionFetchFileName("DEF 14A", ACCESSION, null)).toBe(`${ACCESSION}.txt`);
  });
});

/** Exposes the source loader, the seam between the cache, the network and the parser. */
class LoadOnly extends ConvertFilingDocumentTask {
  load(input: ConvertFilingDocumentTaskInput, context: IExecuteContext) {
    return this.loadSource(input, context);
  }
}

describe("ConvertFilingDocumentTask with an unsafe primary_doc", () => {
  let capture: ReturnType<typeof captureDiagnosticsForTesting>;

  beforeEach(() => {
    resetDependencyInjectionsForTesting();
    resetDiagnosticsForTesting();
    capture = captureDiagnosticsForTesting();
  });

  afterEach(() => {
    capture.restore();
    resetDiagnosticsForTesting();
  });

  it.each(UNSAFE)("%j makes no request and says why", async (primaryDoc) => {
    const own = vi.fn();
    const context = { own, disown: vi.fn() } as unknown as IExecuteContext;

    const source = await new LoadOnly().load(
      { cik: 1811882, accessionNumber: ACCESSION, form: "DEF 14A", primaryDoc },
      context
    );

    expect(source).toBeUndefined();
    // Every fetch goes through `context.own(new SecFetchAccessionDocTask(...))`.
    expect(own).not.toHaveBeenCalled();
    expect(capture.lines).toEqual([
      `Refusing unsafe primary_doc for 1811882/${ACCESSION}: ${JSON.stringify(primaryDoc)} — not fetched`,
    ]);
  });
});
