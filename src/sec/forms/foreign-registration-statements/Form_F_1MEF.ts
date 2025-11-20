/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_1MEF extends Form {
  static readonly name = "F-1MEF";
  static readonly description = "Registration of additional securities for foreign private issuers";
  static readonly forms = ["F-1MEF"] as const;
}
