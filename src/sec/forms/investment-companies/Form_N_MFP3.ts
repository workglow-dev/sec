/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_MFP3 extends Form {
  static readonly name = "Monthly Distribution and Dividend Report";
  static readonly description =
    "Monthly distribution and dividend report of Money Market Funds on Form N-MFP3.";
  static readonly forms = ["N-MFP3", "N-MFP3/A"] as const;
}
