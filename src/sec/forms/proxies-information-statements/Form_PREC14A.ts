/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PREC14A extends Form {
  static readonly name = "Preliminary Proxy Statement with Contested Solicitations";
  static readonly description = "Preliminary proxy statement containing contested solicitations.";
  static readonly forms = ["PREC14A"] as const;
}
