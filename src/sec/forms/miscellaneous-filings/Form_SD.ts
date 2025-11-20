/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SD extends Form {
  static readonly name = "Form SD";
  static readonly description =
    "Specialized disclosure report pursuant to Section 13(r) of the Exchange Act.";
  static readonly forms = ["SD", "SD/A"] as const;
}
