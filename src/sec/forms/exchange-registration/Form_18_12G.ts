/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_18_12G extends Form {
  static readonly name = "Registration of Securities of Foreign Private Issuers";
  static readonly description =
    "Registration statement for securities of foreign private issuers pursuant to Section 12(g) of the Securities Exchange Act of 1934";
  static readonly forms = ["18-12G", "18-12G/A"] as const;
}
