/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_14 extends Form {
  static readonly name = "Proxy Statement for Investment Company Mergers";
  static readonly description = "Proxy statement for investment company mergers and acquisitions";
  static readonly forms = ["N-14", "N-14/A"] as const;
}
