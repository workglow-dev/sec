/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_X extends Form {
  static readonly name = "Appointment of Agent for Service of Process";
  static readonly description =
    "Appointment of agent for service of process by foreign issuers pursuant to Rule 489 under the Securities Act of 1933";
  static readonly forms = ["F-X", "F-X/A"] as const;
}
