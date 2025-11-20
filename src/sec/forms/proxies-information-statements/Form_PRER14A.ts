/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PRER14A extends Form {
  static readonly name = "Preliminary Revised Proxy Statement";
  static readonly description =
    "Preliminary revised proxy statement filed pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["PRER14A"] as const;
}
