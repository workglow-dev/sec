/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SEC_STAFF_LETTER extends Form {
  static readonly name = "SEC Staff Letter";
  static readonly description = "SEC staff letter.";
  static readonly forms = ["SEC STAFF LETTER"] as const;
}
