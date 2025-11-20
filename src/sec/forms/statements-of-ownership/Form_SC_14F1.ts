/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC_14F1 extends Form {
  static readonly name = "Information Statement";
  static readonly description =
    "This filing is made by an issuer that is changing its board of directors or management.";
  static readonly forms = ["SC 14F1", "SC 14F1/A"] as const;
}
