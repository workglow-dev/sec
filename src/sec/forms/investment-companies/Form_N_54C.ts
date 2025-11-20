/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_54C extends Form {
  static readonly name = "Business Development Company Registration Amendment";
  static readonly description =
    "Amendment to registration statement of business development companies";
  static readonly forms = ["N-54C", "N-54C/A"] as const;
}
