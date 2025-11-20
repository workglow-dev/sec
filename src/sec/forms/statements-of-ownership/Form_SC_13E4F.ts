/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC_13E4F extends Form {
  static readonly name = "Going Private Transaction";
  static readonly description = "This filing is made by an issuer that is going private.";
  static readonly forms = ["SC 13E4F", "SC 13E4F/A", "SC 13E-4F", "SC 13E-4F/A"] as const;
}
