/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_6B_NTC extends Form {
  static readonly name = "Notice of Application (Sec 6(b) ICA 1940)";
  static readonly description =
    "Notice of application under Section 6(b) of the Investment Company Act of 1940.";
  static readonly forms = ["6B NTC", "6B NTC/A"] as const;
}
