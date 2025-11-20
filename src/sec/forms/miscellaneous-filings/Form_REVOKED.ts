/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_REVOKED extends Form {
  static readonly name = "Form REVOKED";
  static readonly description = "Revoked filing.";
  static readonly forms = ["REVOKED"] as const;
}
