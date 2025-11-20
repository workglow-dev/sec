/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_8_A12G extends Form {
  static readonly name = "Registration of Securities on Form 8-A";
  static readonly description =
    "Registration of securities pursuant to Section 12(g) of the Securities Exchange Act of 1934";
  static readonly forms = ["8-A12G", "8-A12G/A"] as const;
}
