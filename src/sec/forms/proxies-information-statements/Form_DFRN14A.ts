/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DFRN14A extends Form {
  static readonly name = "Definitive Proxy Statement - Non-Management";
  static readonly description =
    "Definitive proxy statement filed by non-management pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["DFRN14A"] as const;
}
