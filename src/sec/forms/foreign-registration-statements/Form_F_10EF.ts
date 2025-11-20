/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_10EF extends Form {
  static readonly name = "F-10EF";
  static readonly description =
    "Registration statement for foreign private issuers filed electronically";
  static readonly forms = ["F-10EF", "F-10EF/A"] as const;
}
