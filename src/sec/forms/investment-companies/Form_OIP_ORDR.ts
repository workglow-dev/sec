/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_OIP_ORDR extends Form {
  static readonly name = "Order (Sec 3(b)(2) ICA 1940)";
  static readonly description =
    "Order under Section 3(b)(2) of the Investment Company Act of 1940.";
  static readonly forms = ["OIP ORDR"] as const;
}
