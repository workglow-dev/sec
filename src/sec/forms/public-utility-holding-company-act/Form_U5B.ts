/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U5B extends Form {
  static readonly name = "Registration Statement";
  static readonly description =
    "Registration statement filed under section 5 of the Public Utility Holding Company Act.";
  static readonly forms = ["U5B", "U5B/A"] as const;
}
