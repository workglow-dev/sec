/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13F_HR extends Form {
  static readonly name = "13F Holdings Report";
  static readonly description = "13F Holdings Report Initial Filing.";
  static readonly forms = ["13F-HR", "13F-HR/A"] as const;
}
