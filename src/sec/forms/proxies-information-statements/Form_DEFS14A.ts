/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFS14A extends Form {
  static readonly name = "Definitive Proxy Statement for Special Meeting";
  static readonly description =
    "A definitive proxy statement giving notice regarding a special meeting.";
  static readonly forms = ["DEFS14A"] as const;
}
