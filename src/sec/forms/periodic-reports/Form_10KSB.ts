/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_10KSB extends Form {
  static readonly name = "Annual Report for Small Businesses";
  static readonly description =
    "An annual report which provides a comprehensive overview of the company for the past year. The 10KSB is filed by small businesses.";
  static readonly forms = ["10KSB", "10KSB/A"] as const;
}
