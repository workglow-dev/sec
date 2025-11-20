/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U5S extends Form {
  static readonly name = "Annual Report for Holding Companies";
  static readonly description =
    "Annual report for holding companies registered pursuant to section 5 of the Public Utility Holding Company Act.";
  static readonly forms = ["U5S", "U5S/A"] as const;
}
