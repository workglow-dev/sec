/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEF_14A extends Form {
  static readonly name = "Definitive Proxy Statement";
  static readonly description =
    'Provides official notification to designated classes of shareholders of matters to be brought to a vote at a shareholders meeting. This form is commonly referred to as a "Proxy".';
  static readonly forms = ["DEF 14A"] as const;
}
