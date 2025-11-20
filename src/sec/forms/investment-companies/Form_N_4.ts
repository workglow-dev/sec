/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_4 extends Form {
  static readonly name = "Variable Annuity Registration";
  static readonly description = "Registration statement of variable annuity contracts";
  static readonly forms = ["N-4", "N-4/A"] as const;
}
