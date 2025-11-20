/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_8B_2 extends Form {
  static readonly name = "Registration of Unit Investment Trusts";
  static readonly description =
    "Registration statement for unit investment trusts pursuant to Section 8(b) of the Investment Company Act of 1940";
  static readonly forms = ["N-8B-2", "N-8B-2/A"] as const;
}
