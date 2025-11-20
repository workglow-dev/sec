/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEF_14C extends Form {
  static readonly name = "Definitive Information Statement";
  static readonly description =
    "Definitive information statement containing all other information.";
  static readonly forms = ["DEF 14C"] as const;
}
