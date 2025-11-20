/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NSARAT extends Form {
  static readonly name = "Transitional Semi-Annual Report for Management Companies";
  static readonly description =
    "Transitional semi-annual report for registered investment companies (Management).";
  static readonly forms = ["NSAR-AT", "NSAR-AT/A"] as const;
}
