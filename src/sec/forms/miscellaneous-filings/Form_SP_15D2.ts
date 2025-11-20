/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SP_15D2 extends Form {
  static readonly name = "Form SP 15D2";
  static readonly description =
    "Special financial report pursuant to Rule 15d-2 of the Securities Exchange Act.";
  static readonly forms = ["SP 15D2", "SP 15D2/A"] as const;
}
