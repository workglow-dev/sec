/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NSARA extends Form {
  static readonly name = "Semi-Annual Report for Management Companies";
  static readonly description = "Semi-annual report for management companies.";
  static readonly forms = ["NSAR-A", "NSAR-A/A"] as const;
}
