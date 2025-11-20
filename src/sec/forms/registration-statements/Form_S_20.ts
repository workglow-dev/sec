/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_S_20 extends Form {
  static readonly name = "Registration Statement (S-20)";
  static readonly description = "Initial registration statement for standardized options.";
  static readonly forms = ["S-20", "S-20/A"] as const;
}
