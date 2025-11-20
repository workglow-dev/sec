/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_5 extends Form {
  static readonly name = "Small Business Investment Company Registration";
  static readonly description = "Registration statement of small business investment companies";
  static readonly forms = ["N-5", "N-5/A"] as const;
}
