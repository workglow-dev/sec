/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_T_3 extends Form {
  static readonly name = "Trust Indenture Qualification";
  static readonly description =
    "Application for qualification of trust indentures. Filed pursuant to the Trust Indenture Act.";
  static readonly forms = ["T-3", "T-3/A"] as const;
}
