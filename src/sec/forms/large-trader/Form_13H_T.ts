/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13H_T extends Form {
  static readonly name = "Large Trader Termination";
  static readonly description = "Large trader termination filing pursuant to Rule 13h-1.";
  static readonly forms = ["13H-T"] as const;
}
