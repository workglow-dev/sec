/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_2 extends Form {
  static readonly name = "F-2";
  static readonly description =
    "Registration statement for foreign private issuers with substantial U.S. market interest";
  static readonly forms = ["F-2", "F-2/A"] as const;
}
