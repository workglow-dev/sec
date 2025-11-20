/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_OIP_NTC extends Form {
  static readonly name = "Notice (Sec 8(a) ICA 1940)";
  static readonly description = "Notice under Section 8(a) of the Investment Company Act of 1940.";
  static readonly forms = ["OIP NTC"] as const;
}
