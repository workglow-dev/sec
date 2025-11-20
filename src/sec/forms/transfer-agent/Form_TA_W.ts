/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_TA_W extends Form {
  static readonly name = "Transfer Agent Withdrawal";
  static readonly description =
    "Notice of withdrawal from registration as a transfer agent pursuant to Section 17A(c) of the Exchange Act.";
  static readonly forms = ["TA-W", "TA-W/A"] as const;
}
