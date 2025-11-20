/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_1 extends Form {
  static readonly name = "Registration Statement for Open-End Management Investment Companies";
  static readonly description =
    "Registration statement for open-end management investment companies pursuant to the Securities Act of 1933";
  static readonly forms = ["N-1", "N-1/A"] as const;
}
