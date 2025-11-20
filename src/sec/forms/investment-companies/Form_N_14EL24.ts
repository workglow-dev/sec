/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_14EL24 extends Form {
  static readonly name = "Proxy Statement for Investment Company Mergers Electronic Filing";
  static readonly description =
    "Proxy statement for investment company mergers and acquisitions filed electronically";
  static readonly forms = ["N14EL24", "N14EL24/A", "N-14EL24", "N-14EL24/A"] as const;
}
