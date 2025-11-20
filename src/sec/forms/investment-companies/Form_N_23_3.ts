/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_23_3 extends Form {
  static readonly name = "Notification of Repurchase Offer (Rule 23c-3)";
  static readonly description =
    "Notification of repurchase offer pursuant to Rule 23c-3 (17 CFR 270.23c-3).";
  static readonly forms = ["N-23-3"] as const;
}
