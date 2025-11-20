/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_CORRESP extends Form {
  static readonly name = "Correspondence Submission";
  static readonly description =
    "Correspondence - submission to SEC staff; not immediately public, may be released later.";
  static readonly forms = ["CORRESP"] as const;
}
