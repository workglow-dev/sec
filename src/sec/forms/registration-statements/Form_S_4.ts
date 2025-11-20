/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_S_4 extends Form {
  static readonly name = "Registration Statement (S-4)";
  static readonly description =
    "This filing is for the registration of securities issued in business combination transactions.";
  static readonly forms = ["S-4", "S-4/A", "S-4EF", "S-4EF/A", "S-4 POS", "S-4MEF"] as const;
}
