/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_AW_WD extends Form {
  static readonly name = "Withdrawal of Registration Statement";
  static readonly description =
    "Withdrawal of registration statement filed pursuant to the Securities Act of 1933";
  static readonly forms = ["AW WD"] as const;
}
