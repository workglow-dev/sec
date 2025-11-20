/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_1_SA extends Form {
  static readonly name = "Semiannual Report (Regulation A)";
  static readonly description = "Semiannual report pursuant to Regulation A.";
  static readonly forms = ["1-SA", "1-SA/A"] as const;
}
