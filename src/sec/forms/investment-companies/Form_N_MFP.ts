/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_MFP extends Form {
  static readonly name = "Generic Monthly Report";
  static readonly description = "Generic monthly report of Money Market Funds on Form N-MFP.";
  static readonly forms = ["N-MFP", "N-MFP/A", "NT N-MFP"] as const;
}
