/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NSARBT extends Form {
  static readonly name = "Transitional Annual Report for Management Companies";
  static readonly description = "Transitional annual report for management companies.";
  static readonly forms = ["NSAR-BT", "NSAR-BT/A"] as const;
}
