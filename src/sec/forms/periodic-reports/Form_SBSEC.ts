/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SBSEC extends Form {
  static readonly name = "Security-Based Swap Dealer/Participant Certification";
  static readonly description =
    "Certification by security-based swap dealers and major security-based swap participants filed pursuant to Rule 15Fb2-1(a).";
  static readonly forms = ["SBSE-C", "SBSE-C/A"] as const;
}
