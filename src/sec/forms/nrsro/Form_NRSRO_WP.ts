/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NRSRO_WP extends Form {
  static readonly name = "NRSRO Annual Report";
  static readonly description = "Annual report for NRSROs regarding their performance.";
  static readonly forms = ["NRSRO-WP", "NRSRO-WP/A"] as const;
}
