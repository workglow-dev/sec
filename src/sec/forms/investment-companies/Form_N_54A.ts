/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_54A extends Form {
  static readonly name = "Business Development Company Registration";
  static readonly description = "Registration statement of business development companies";
  static readonly forms = ["N-54A", "N-54A/A"] as const;
}
