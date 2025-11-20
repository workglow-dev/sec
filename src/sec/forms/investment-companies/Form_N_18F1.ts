/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_18F1 extends Form {
  static readonly name = "Initial Notification of Election (Rule 18f-1)";
  static readonly description =
    "Initial notification of election pursuant to Rule 18f-1 filed on Form N-18F-1.";
  static readonly forms = ["N-18F1", "N-18F1/A"] as const;
}
