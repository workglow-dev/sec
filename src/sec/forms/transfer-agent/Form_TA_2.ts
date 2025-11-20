/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_TA_2 extends Form {
  static readonly name = "Transfer Agent Annual Report";
  static readonly description =
    "Annual report of transfer agent activities pursuant to Section 17A(d) of the Exchange Act.";
  static readonly forms = ["TA-2", "TA-2/A"] as const;
}
