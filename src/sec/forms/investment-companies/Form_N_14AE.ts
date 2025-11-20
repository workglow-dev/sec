/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_14AE extends Form {
  static readonly name = "Proxy Statement for Investment Company Mergers Asset Exchange";
  static readonly description =
    "Proxy statement for investment company mergers and acquisitions involving asset exchanges";
  static readonly forms = ["N-14AE", "N-14AE/A"] as const;
}
