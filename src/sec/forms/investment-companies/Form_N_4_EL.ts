/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_4_EL extends Form {
  static readonly name = "Registration Statement for Employee Benefit Plans";
  static readonly description =
    "Registration statement for employee benefit plans pursuant to the Securities Act of 1933";
  static readonly forms = ["N-4 EL", "N-4 EL/A"] as const;
}
