/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC_13D extends Form {
  static readonly name = "Beneficial Ownership Statement";
  static readonly description =
    "This filing is made by person(s) reporting beneficially owned shares of common stock in a public company.";
  static readonly forms = ["SC 13D", "SC 13D/A", "SCHEDULE 13D", "SCHEDULE 13D/A"] as const;
}
