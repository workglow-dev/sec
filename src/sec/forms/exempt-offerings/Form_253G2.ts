/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_253G2 extends Form {
  static readonly name = "Notice of Sales of Unregistered Securities (253G2)";
  static readonly description = "Notice of sales of unregistered securities";
  static readonly forms = ["253G2"] as const;
}
