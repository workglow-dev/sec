/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U_3A3_1 extends Form {
  static readonly name = "Bank Exemption Statement";
  static readonly description =
    "Twelve-month statement by bank claiming exemption from provisions of the act pursuant to Rule 3 of the Public Utility Holding Company Act.";
  static readonly forms = ["U-3A3-1", "U-3A3-1/A"] as const;
}
