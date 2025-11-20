/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_6B_ORDR extends Form {
  static readonly name = "Commission Order (Sec 6(b) ICA 1940)";
  static readonly description =
    "Commission order under Section 6(b) of the Investment Company Act granting or denying the requested exemption.";
  static readonly forms = ["6B ORDR", "6B ORDR/A"] as const;
}
