/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_CEN extends Form {
  static readonly name = "Annual Report";
  static readonly description = "Annual Report for Registered Investment Companies";
  static readonly forms = ["N-CEN", "N-CEN/A", "NT N-CEN", "NT N-CEN/A", "NTFNCEN"] as const;
}
