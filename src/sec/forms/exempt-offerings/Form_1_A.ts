/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_1_A extends Form {
  static readonly name = "Reg-A Offering Statement";
  static readonly description = "Reg-A Offering Statement";
  static readonly forms = ["1-A", "1-A/A", "1", "1/A"] as const;
}
