/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DRS extends Form {
  static readonly name = "Registration Statement (DRS)";
  static readonly description = "Registration statement for direct registration system securities.";
  static readonly forms = ["DRS", "DRS/A", "DRSLTR"] as const;
}
