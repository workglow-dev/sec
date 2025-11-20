/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_40FR12B extends Form {
  static readonly name = "Securities Registration (Canadian Issuers, Sec 12(b))";
  static readonly description =
    "Registration of securities of Canadian issuers under Section 12(b).";
  static readonly forms = ["40FR12B", "40FR12B/A"] as const;
}
