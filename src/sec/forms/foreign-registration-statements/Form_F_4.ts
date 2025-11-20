/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_4 extends Form {
  static readonly name = "F-4";
  static readonly description =
    "Registration statement for securities of foreign private issuers issued in business combination transactions";
  static readonly forms = ["F-4", "F-4/A", "F-4 POS", "F-4MEF"] as const;
}
