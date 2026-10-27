/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "typebox";
import { DataPortSchemaObject, TaskError, TaskInput } from "workglow";
import { TypeSecCik } from "../../sec/submissions/EnititySubmissionSchema";
import { safePrimaryDocName } from "../../util/accessionDocPath";
import { SecCachedFetchTask } from "./SecCachedFetchTask";

// NOTE: accession documents are immutable, so we don't need to pass in a date for invalidation

export interface SecFetchAccessionDocTaskInput extends TaskInput {
  cik: number;
  accessionNumber: string;
  fileName: string;
}

export interface SecFetchAccessionDocTaskOutput extends TaskInput {
  accessionDoc: string;
}

export class SecFetchAccessionDocTask extends SecCachedFetchTask<SecFetchAccessionDocTaskInput> {
  static readonly type = "SecFetchAccessionDocTask";
  static readonly category = "Hidden";
  static readonly title = "Download filing document";
  static readonly immutable = true;

  public static inputSchema() {
    return Type.Object({
      cik: TypeSecCik(),
      accessionNumber: Type.String({
        title: "Accession Number",
        description: "The accession number of the document to fetch",
      }),
      fileName: Type.String({
        title: "File Name",
        description: "The name of the document to fetch",
      }),
    }) as DataPortSchemaObject;
  }

  inputToFileName(input: SecFetchAccessionDocTaskInput): string {
    return `accessiondocs/${input.cik
      .toString()
      .padStart(10, "0")}/${input.accessionNumber.replaceAll("-", "")}-${safeFileName(input)}`;
  }
  inputToUrl(input: SecFetchAccessionDocTaskInput): string {
    return `https://www.sec.gov/Archives/edgar/data/${input.cik
      .toString()
      .padStart(10, "0")}/${input.accessionNumber.replaceAll("-", "")}/${encodeURIComponent(
      safeFileName(input)
    )}`;
  }
}

/**
 * The document name, refused when it is not one file in the accession folder.
 *
 * `fileName` is usually a filing's `primary_doc`, which the filer wrote. Every
 * caller is meant to have checked it, and the check lives here as well because
 * this is where it becomes a URL: a `../`, `?` or `#` reaches a different
 * sec.gov path, and the request is spent against the rate budget before the
 * cache write's own path guard ever runs. A constructor left to guess the
 * response type builds the URL, so a refused name fails there; one given a
 * `response_type` fails at the cache lookup or `resolveFetchInput` instead —
 * either way before anything is queued.
 */
function safeFileName(input: SecFetchAccessionDocTaskInput): string {
  const name = safePrimaryDocName(input.fileName);
  if (name === undefined) {
    throw new TaskError(
      `Refusing unsafe document name for ${input.cik}/${input.accessionNumber}: ` +
        JSON.stringify(input.fileName)
    );
  }
  return name;
}
