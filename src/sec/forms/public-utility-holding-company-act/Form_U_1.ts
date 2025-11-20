/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U_1 extends Form {
  static readonly name = "Application of Declaration";
  static readonly description =
    "Application of declaration under the Public Utility Holding Company Act.";
  static readonly forms = ["U-1", "U-1/A"] as const;
}
