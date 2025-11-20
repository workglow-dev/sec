/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_2MEF extends Form {
  static readonly name = "F-2MEF";
  static readonly description =
    "Registration of additional securities for foreign private issuers with substantial U.S. market interest";
  static readonly forms = ["F-2MEF"] as const;
}
