/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_10 extends Form {
  static readonly name = "F-10";
  static readonly description =
    "Registration statement for foreign private issuers with substantial U.S. market interest and reporting history under the Securities Exchange Act";
  static readonly forms = ["F-10", "F-10/A"] as const;
}
