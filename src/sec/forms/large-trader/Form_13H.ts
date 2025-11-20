/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13H extends Form {
  static readonly name = "Large Trader Registration";
  static readonly description = "Initial large trader registration filing pursuant to Rule 13h-1.";
  static readonly forms = ["13H"] as const;
}
