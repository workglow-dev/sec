/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_8A extends Form {
  static readonly name = "Registration of Investment Companies";
  static readonly description =
    "Registration statement for investment companies pursuant to Section 8(a) of the Investment Company Act of 1940";
  static readonly forms = ["N-8A", "N-8A/A"] as const;
}
