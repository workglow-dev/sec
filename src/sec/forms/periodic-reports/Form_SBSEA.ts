/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SBSEA extends Form {
  static readonly name = "Security-Based Swap Dealer/Participant Registration";
  static readonly description =
    "Application for Registration as either a Security-based Swap Dealer or Major Security-based Swap Participant .";
  static readonly forms = ["SBSE-A", "SBSE-A/A"] as const;
}
