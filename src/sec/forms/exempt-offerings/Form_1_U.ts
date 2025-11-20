/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_1_U extends Form {
  static readonly name = "Current Report (Regulation A)";
  static readonly description = "Current report pursuant to Regulation A.";
  static readonly forms = ["1-U", "1-U/A"] as const;
}
