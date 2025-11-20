/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFN14A extends Form {
  static readonly name = "Non-Management Definitive Proxy Statement";
  static readonly description =
    "Definitive proxy statement filed by non-management not in connection with contested solicitations.";
  static readonly forms = ["DEFN14A"] as const;
}
