/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NT_10_Q extends Form {
  static readonly name = "Late Filing Notification";
  static readonly description = "Notification that form type 10-Q will be submitted late.";
  static readonly forms = ["NT 10-Q", "NT 10-Q/A"] as const;
}
