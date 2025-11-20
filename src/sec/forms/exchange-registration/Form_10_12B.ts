/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_10_12B extends Form {
  static readonly name = "General Form for Registration of Securities";
  static readonly description =
    "General form for registration of securities pursuant to Section 12(b) of the Securities Exchange Act of 1934";
  static readonly forms = ["10-12B", "10-12B/A"] as const;
}
