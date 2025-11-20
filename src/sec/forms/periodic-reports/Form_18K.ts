/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_18K extends Form {
  static readonly name = "Annual Report for Foreign Governments";
  static readonly description = "Annual report for foreign governments and political subdivisions.";
  static readonly forms = ["18-K", "18-K/A"] as const;
}
