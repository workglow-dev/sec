/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NO_ACT extends Form {
  static readonly name = "No-Action Letter Request";
  static readonly description = "No-action letter request.";
  static readonly forms = ["NO ACT"] as const;
}
