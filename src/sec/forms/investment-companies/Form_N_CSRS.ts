/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_CSRS extends Form {
  static readonly name = "Certified Semi-Annual Shareholder Report";
  static readonly description =
    "Certified semi-annual shareholder report of registered management investment companies filed on Form N-CSRS.";
  static readonly forms = ["N-CSRS", "N-CSRS/A"] as const;
}
