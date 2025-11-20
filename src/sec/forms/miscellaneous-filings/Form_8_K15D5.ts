/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_8_K15D5 extends Form {
  static readonly name = "Form 8-K15D5";
  static readonly description = "Notification of assumption of duty to report by successor issuer.";
  static readonly forms = ["8-K15D5", "8-K15D5/A"] as const;
}
