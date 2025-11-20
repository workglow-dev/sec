/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_9M extends Form {
  static readonly name = "Irrevocable Appointment (Partnership Non-Resident B/D)";
  static readonly description =
    "Irrevocable Appointment by partnership non-resident broker or dealer.";
  static readonly forms = ["9-M"] as const;
}
