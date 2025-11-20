/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_6_K extends Form {
  static readonly name = "Form 6-K";
  static readonly description =
    "Report of foreign issuer pursuant to Rules 13a-16 and 15d-16 of the Securities Exchange Act.";
  static readonly forms = ["6-K", "6-K/A"] as const;
}
