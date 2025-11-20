/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_8F extends Form {
  static readonly name = "Deregistration Application (Form N-8F)";
  static readonly description = "Application for deregistration made on Form N-8F.";
  static readonly forms = ["N-8F", "N-8F/A", "N-8F NTC", "N-8F ORDR"] as const;
}
