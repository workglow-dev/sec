/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_27F_1 extends Form {
  static readonly name = "Notice of 45-Day Surrender Rights";
  static readonly description =
    "Notice to periodic payment plan certificate holders of 45-day surrender rights with respect to periodic payment plan certificates.";
  static readonly forms = ["N-27F-1"] as const;
}
