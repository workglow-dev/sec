/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_X17A5 extends Form {
  static readonly name = "Annual FOCUS Report (X-17A-5)";
  static readonly description = "Annual FOCUS report filed by broker-dealers under Rule 17a-5.";
  static readonly forms = ["X-17A-5", "X-17A-5/A"] as const;
}
