/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_6 extends Form {
  static readonly name = "American Depositary Receipts Registration";
  static readonly description =
    "Registration statement for American Depositary Receipts (ADRs) for foreign issuers";
  static readonly forms = ["F-6", "F-6/A"] as const;
}
