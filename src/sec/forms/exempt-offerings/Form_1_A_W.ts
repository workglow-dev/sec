/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_1_A_W extends Form {
  static readonly name = "Reg-A Offering Statement Withdrawal";
  static readonly description = "Offering Statement Withdrawal";
  static readonly forms = ["1-A-W", "1-A-W/A"] as const;
}
