/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_QUALIF extends Form {
  static readonly name = "Qualification of Offering Statement";
  static readonly description = "Qualification of an offering statement and ready to sell.";
  static readonly forms = ["QUALIF"] as const;
}
