/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC_14N extends Form {
  static readonly name = "Nominating Shareholder Information";
  static readonly description =
    "Information filed by certain nominating shareholders (pursuant to Section 240 14n-1).";
  static readonly forms = ["SC 14N", "SC 14N/A"] as const;
}
