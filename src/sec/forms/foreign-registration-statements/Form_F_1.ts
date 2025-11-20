/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_1 extends Form {
  static readonly name = "F-1";
  static readonly description = "Registration statement for foreign private issuers";
  static readonly forms = ["F-1", "F-1/A"] as const;
}
