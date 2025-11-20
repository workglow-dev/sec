/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U_13E_1 extends Form {
  static readonly name = "Service Company Report";
  static readonly description =
    "Report by affiliate service companies or independent service companies.";
  static readonly forms = ["U-13E-1", "U-13E-1/A"] as const;
}
