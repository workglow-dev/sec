/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_13F_NT extends Form {
  static readonly name = "13F Notice Report";
  static readonly description = "13F Notice Report Initial Filing.";
  static readonly forms = ["13F-NT", "13F-NT/A"] as const;
}
