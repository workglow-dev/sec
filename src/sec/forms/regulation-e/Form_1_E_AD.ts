/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_1_E_AD extends Form {
  static readonly name = "Sales Material under Regulation E";
  static readonly description = "Sales material filed pursuant to Rule 607 under Regulation E.";
  static readonly forms = ["1-E AD", "1-E AD/A"] as const;
}
