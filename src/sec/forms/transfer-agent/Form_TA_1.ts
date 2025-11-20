/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_TA_1 extends Form {
  static readonly name = "Transfer Agent Registration";
  static readonly description =
    "Application for registration as a transfer agent pursuant to Section 17A(c) of the Exchange Act.";
  static readonly forms = ["TA-1", "TA-1/A"] as const;
}
