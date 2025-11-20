/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_ANNLRPT extends Form {
  static readonly name = "Annual Development Bank Report";
  static readonly description = "Periodic Development Bank filing, submitted annually.";
  static readonly forms = ["ANNLRPT", "ANNLRPT/A"] as const;
}
