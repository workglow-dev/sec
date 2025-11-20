/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_7 extends Form {
  static readonly name = "Registration Statement for Securities of Certain Canadian Issuers";
  static readonly description =
    "Registration statement for securities of certain Canadian issuers offered for cash upon the exercise of rights granted to existing security holders under the Securities Act of 1933.";
  static readonly forms = ["F-7", "F-7/A", "F-7 POS"] as const;
}
