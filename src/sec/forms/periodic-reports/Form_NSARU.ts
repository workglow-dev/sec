/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NSARU extends Form {
  static readonly name = "Annual Report for Unit Investment Trusts";
  static readonly description = "Annual report for unit investment trusts.";
  static readonly forms = ["NSAR-U", "NSAR-U/A"] as const;
}
