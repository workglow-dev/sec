/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Value } from "typebox/value";
import { Form } from "../Form";
import { FormD, FormDSchema, FormDSubmission, FormDSubmissionSchema } from "./Form_D.schema";

export class Form_D extends Form {
  static readonly name = "Notice of Sales of Unregistered Securities";
  static readonly description = "Notice of sales of unregistered securities";
  static readonly forms = ["D", "D/A"] as const;

  static async parse(xml: string): Promise<FormD> {
    const parser = Form_D.getParser(FormDSubmissionSchema);
    const json = parser.parse(xml) as FormDSubmission;
    const rawFormD = json.edgarSubmission;
    const formD = Value.Convert(FormDSchema, rawFormD);
    return formD as FormD;
  }
}

export type { FormD };
