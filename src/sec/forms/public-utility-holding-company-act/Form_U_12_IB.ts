/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U_12_IB extends Form {
  static readonly name = "Annual Statement";
  static readonly description =
    "Annual statement pursuant to section 12(i) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-12-IB", "U-12-IB/A"] as const;
}
