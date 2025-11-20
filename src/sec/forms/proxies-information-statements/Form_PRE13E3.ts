/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PRE13E3 extends Form {
  static readonly name = "Initial Statement Preliminary";
  static readonly description = "Initial statement - preliminary form.";
  static readonly forms = ["PRE13E3", "PRE13E3/A"] as const;
}
