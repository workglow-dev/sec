/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_ADV_NR extends Form {
  static readonly name = "Appointment of Agent for Service of Process";
  static readonly description =
    "Appointment of agent for service of process by a non-resident general partner or managing agent of an investment adviser.";
  static readonly forms = ["ADV-NR"] as const;
}
