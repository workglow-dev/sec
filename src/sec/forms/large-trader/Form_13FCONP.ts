/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13FCONP extends Form {
  static readonly name = "Compiled Holdings Report";
  static readonly description =
    "Quarterly report filed by institutional investment managers (compiled holdings report).";
  static readonly forms = ["13FCONP", "13FCONP/A"] as const;
}
