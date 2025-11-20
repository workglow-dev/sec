/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13H_I extends Form {
  static readonly name = "Large Trader Inactive Status";
  static readonly description = "Large trader inactive status filing pursuant to Rule 13h-1.";
  static readonly forms = ["13H-I"] as const;
}
