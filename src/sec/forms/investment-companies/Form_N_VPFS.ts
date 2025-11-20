/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_VPFS extends Form {
  static readonly name = "Financial Statements for Variable Contracts";
  static readonly description =
    "Financial statements for certain variable contracts filed pursuant to the Investment Company Act.";
  static readonly forms = ["N-VPFS", "N-VPFS/A"] as const;
}
