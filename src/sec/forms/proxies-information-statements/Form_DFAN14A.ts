/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DFAN14A extends Form {
  static readonly name = "Definitive Proxy Statement - Annual Meeting";
  static readonly description =
    "Definitive proxy statement for annual meeting filed pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["DFAN14A"] as const;
}
