/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_MA_I extends Form {
  static readonly name = "Municipal Advisor Information";
  static readonly description =
    "Information regarding natural persons who engage in municipal advisory activities.";
  static readonly forms = ["MA-I", "MA-I/A"] as const;
}
