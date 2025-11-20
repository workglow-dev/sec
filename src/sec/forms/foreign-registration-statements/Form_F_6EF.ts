/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_6EF extends Form {
  static readonly name = "F-6EF";
  static readonly description =
    "Registration statement for American Depositary Receipts (ADRs) filed electronically";
  static readonly forms = ["F-6EF", "F-6EF/A"] as const;
}
