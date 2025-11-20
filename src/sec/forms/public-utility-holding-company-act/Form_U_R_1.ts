/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U_R_1 extends Form {
  static readonly name = "Solicitations Declaration";
  static readonly description =
    "Declaration as to solicitations filed pursuant to Rule 62 of the Public Utility Holding Company Act.";
  static readonly forms = ["U-R-1"] as const;
}
