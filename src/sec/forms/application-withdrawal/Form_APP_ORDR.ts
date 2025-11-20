/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_APP_ORDR extends Form {
  static readonly name = "Application Order";
  static readonly description = "Application order under the Investment Company Act of 1940.";
  static readonly forms = ["APP ORDR"] as const;
}
