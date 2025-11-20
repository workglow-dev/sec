/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_CR extends Form {
  static readonly name = "Form N-CR";
  static readonly description = "Current Report of Money Market Fund Material Events.";
  static readonly forms = ["N-CR", "N-CR/A"] as const;
}
