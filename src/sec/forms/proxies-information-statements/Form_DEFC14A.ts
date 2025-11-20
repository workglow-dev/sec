/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFC14A extends Form {
  static readonly name = "Definitive Proxy Statement with Contested Solicitations";
  static readonly description =
    "Definitive proxy statement in connection with contested solicitations.";
  static readonly forms = ["DEFC14A"] as const;
}
