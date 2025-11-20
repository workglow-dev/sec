/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEF13E3 extends Form {
  static readonly name = "Definitive Schedule 13E-3";
  static readonly description = "Schedule filed as definitive materials.";
  static readonly forms = ["DEF13E3", "DEF13E3/A"] as const;
}
