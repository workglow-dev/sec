/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_14MEF extends Form {
  static readonly name = "Proxy Statement for Investment Company Mergers Additional Securities";
  static readonly description =
    "Proxy statement for investment company mergers and acquisitions with additional securities";
  static readonly forms = ["N-14MEF"] as const;
}
