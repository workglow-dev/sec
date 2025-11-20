/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_8 extends Form {
  static readonly name = "Registration Statement for Securities of Certain Foreign Private Issuers";
  static readonly description =
    "Registration statement under the Securities Act of 1933 for securities of certain foreign private issuers to be issued in exchange offers or business combinations requiring a shareholder vote.";
  static readonly forms = ["F-8", "F-8/A", "F-8 POS"] as const;
}
