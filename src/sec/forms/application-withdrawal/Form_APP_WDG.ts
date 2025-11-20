/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_APP_WDG extends Form {
  static readonly name = "Application Withdrawal Record";
  static readonly description =
    "Record of automatic withdrawal of an application under the Investment Company Act of 1940.";
  static readonly forms = ["APP WDG"] as const;
}
