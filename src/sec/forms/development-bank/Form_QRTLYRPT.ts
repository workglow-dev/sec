/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_QRTLYRPT extends Form {
  static readonly name = "Quarterly Development Bank Report";
  static readonly description = "Quarterly report of Development Bank, submitted quarterly.";
  static readonly forms = ["QRTLYRPT", "QRTLYRPT/A"] as const;
}
