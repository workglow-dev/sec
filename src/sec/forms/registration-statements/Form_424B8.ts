/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_424B8 extends Form {
  static readonly name = "Prospectus Filed Pursuant to Rule 424(b)(8)";
  static readonly description =
    "A prospectus filed pursuant to Rule 424(b)(8) under the Securities Act of 1933";
  static readonly forms = ["424B8"] as const;
}
