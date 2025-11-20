/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PREC14C extends Form {
  static readonly name = "Preliminary Information Statement with Contested Solicitations";
  static readonly description =
    "Preliminary information statement containing contested solicitations.";
  static readonly forms = ["PREC14C"] as const;
}
