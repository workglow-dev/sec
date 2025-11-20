/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_3D extends Form {
  static readonly name = "F-3D";
  static readonly description =
    "Registration statement for dividend or interest reinvestment plans of foreign private issuers with substantial U.S. market interest";
  static readonly forms = ["F-3D", "F-3D/A"] as const;
}
