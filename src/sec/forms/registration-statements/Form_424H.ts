/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_424H extends Form {
  static readonly name = "Prospectus Filed Pursuant to Rule 424(h)";
  static readonly description =
    "A prospectus filed pursuant to Rule 424(h) under the Securities Act of 1933";
  static readonly forms = ["424H", "424H/A"] as const;
}
