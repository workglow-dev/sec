/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_17HACON extends Form {
  static readonly name = "Confidential Broker-Dealer Annual 17-H Report";
  static readonly description = "Confidential broker-dealer annual 17-H report.";
  static readonly forms = ["17HACON", "17HACON/A"] as const;
}
