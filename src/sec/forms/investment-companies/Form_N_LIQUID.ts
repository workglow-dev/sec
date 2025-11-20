/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_LIQUID extends Form {
  static readonly name = "Form N-LIQUID";
  static readonly description = "Current Report Open-End Management Investment Company Liquidity.";
  static readonly forms = ["N-LIQUID", "N-LIQUID/A"] as const;
}
