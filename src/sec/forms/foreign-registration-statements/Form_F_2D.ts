/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_2D extends Form {
  static readonly name = "F-2D";
  static readonly description =
    "Registration statement for dividend or interest reinvestment plans of foreign private issuers";
  static readonly forms = ["F-2D", "F-2D/A"] as const;
}
