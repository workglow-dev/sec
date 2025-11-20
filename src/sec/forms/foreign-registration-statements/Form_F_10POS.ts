/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_10POS extends Form {
  static readonly name = "F-10POS";
  static readonly description = "Post-effective amendment to F-10 registration statement";
  static readonly forms = ["F-10POS"] as const;
}
