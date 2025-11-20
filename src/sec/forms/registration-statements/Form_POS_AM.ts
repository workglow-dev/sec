/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_POS_AM extends Form {
  static readonly name = "Post-effective Amendment (POS AM)";
  static readonly description = "Post-effective amendment to a registration statement.";
  static readonly forms = ["POS AM"] as const;
}
