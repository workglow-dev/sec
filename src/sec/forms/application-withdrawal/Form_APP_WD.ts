/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_APP_WD extends Form {
  static readonly name = "Application Withdrawal";
  static readonly description =
    "Withdrawal of an application for exemptive or other relief from the federal securities laws.";
  static readonly forms = ["APP WD", "APP WD/A"] as const;
}
