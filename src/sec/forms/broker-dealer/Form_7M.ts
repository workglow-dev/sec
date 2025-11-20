/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_7M extends Form {
  static readonly name = "Irrevocable Appointment (Individual Non-Resident B/D)";
  static readonly description =
    "Irrevocable Appointment by individual non-resident broker or dealer.";
  static readonly forms = ["7-M"] as const;
}
