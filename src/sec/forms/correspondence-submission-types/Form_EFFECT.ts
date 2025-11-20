/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_EFFECT extends Form {
  static readonly name = "Effectiveness Notice";
  static readonly description = "Effectiveness notice.";
  static readonly forms = ["EFFECT"] as const;
}
