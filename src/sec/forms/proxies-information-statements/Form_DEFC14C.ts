/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFC14C extends Form {
  static readonly name = "Definitive Information Statement with Contested Solicitations";
  static readonly description =
    "Definitive information statement indicating contested solicitations.";
  static readonly forms = ["DEFC14C"] as const;
}
