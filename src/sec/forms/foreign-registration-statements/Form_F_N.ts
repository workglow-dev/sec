/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_N extends Form {
  static readonly name = "F-N";
  static readonly description = "Appointment of agent for service of process by foreign issuers";
  static readonly forms = ["F-N", "F-N/A"] as const;
}
