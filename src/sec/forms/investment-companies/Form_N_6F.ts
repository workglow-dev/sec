/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_6F extends Form {
  static readonly name = "Registration Statement (UIT for QIBs)";
  static readonly description =
    "Registration statement on Form N-6F for separate accounts organized as unit investment trusts offered exclusively to qualified institutional buyers under the Investment Company Act of 1940.";
  static readonly forms = ["N-6F", "N-6F/A"] as const;
}
