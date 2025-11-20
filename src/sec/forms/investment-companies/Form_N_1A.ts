/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_1A extends Form {
  static readonly name = "Open End Management Investment Company Registration Amendment";
  static readonly description =
    "Amendment to registration statement of open-end management investment companies";
  static readonly forms = ["N-1A", "N-1A/A"] as const;
}
