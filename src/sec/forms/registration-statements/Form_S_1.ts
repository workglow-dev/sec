/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_S_1 extends Form {
  static readonly name = "Registration Statement (S-1)";
  static readonly description = "Initial registration statement for new securities.";
  static readonly forms = ["S-1", "S-1/A", "S-1MEF"] as const;
}
