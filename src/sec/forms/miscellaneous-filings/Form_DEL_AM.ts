/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEL_AM extends Form {
  static readonly name = "Delayed Amendment";
  static readonly description =
    "Delayed amendment to a previously filed registration statement or report";
  static readonly forms = ["DEL AM"] as const;
}
