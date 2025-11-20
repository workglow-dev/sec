/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_8_B12B extends Form {
  static readonly name = "Registration of Securities on Form 8-B";
  static readonly description =
    "Registration of securities pursuant to Section 12(b) of the Securities Exchange Act of 1934";
  static readonly forms = ["8-B12B", "8-B12B/A"] as const;
}
