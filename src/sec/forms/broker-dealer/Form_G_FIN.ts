/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_G_FIN extends Form {
  static readonly name = "Government Securities";
  static readonly description =
    "Broker acting as government-securities brokers or dealers under the Government Securities Act of 1986.";
  static readonly forms = ["G-FIN", "G-FIN/A"] as const;
}
