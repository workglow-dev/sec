/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13F_E extends Form {
  static readonly name = "Institutional Managers Quarterly Report";
  static readonly description = "Quarterly reports filed by institutional managers.";
  static readonly forms = ["13F-E", "13F-E/A"] as const;
}
