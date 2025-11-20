/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NPORT_NP extends Form {
  static readonly name = "Monthly Portfolio Investments Report (Non-Public)";
  static readonly description = "Monthly Portfolio Investments Report on Form N-PORT (Non-Public).";
  static readonly forms = ["NPORT-NP", "NPORT-NP/A", "NT NPORT-NP"] as const;
}
