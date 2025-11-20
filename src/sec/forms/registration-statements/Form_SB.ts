/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SB extends Form {
  static readonly name = "Registration Statement (SB)";
  static readonly description =
    "Registration statement for securities of foreign governments and subdivisions thereof under the Securities Act of 1933 (Schedule B).";
  static readonly forms = ["SB"] as const;
}
