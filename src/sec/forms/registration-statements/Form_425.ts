/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_425 extends Form {
  static readonly name = "Prospectus (425)";
  static readonly description =
    "Filing of certain prospectuses and communications in connection with business combination transactions.";
  static readonly forms = ["425"] as const;
}
