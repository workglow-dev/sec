/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_VP extends Form {
  static readonly name = "Variable Contracts Notice";
  static readonly description =
    "Notice of Variable Contracts filed pursuant to Rule 12b-25 of the Investment Company Act.";
  static readonly forms = ["N-VP", "N-VP/A"] as const;
}
