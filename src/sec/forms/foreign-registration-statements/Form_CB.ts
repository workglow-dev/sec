/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_CB extends Form {
  static readonly name = "Report of Sales of Securities";
  static readonly description =
    "Report of sales of securities pursuant to Regulation S under the Securities Act of 1933";
  static readonly forms = ["CB", "CB/A"] as const;
}
