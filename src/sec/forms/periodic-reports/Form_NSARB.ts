/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NSARB extends Form {
  static readonly name = "Annual Report for Management Companies";
  static readonly description = "Annual report for management companies.";
  static readonly forms = ["NSAR-B", "NSAR-B/A"] as const;
}
