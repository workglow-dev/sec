/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_C_TR extends Form {
  static readonly name = "Termination of Reporting (Regulation Crowdfunding)";
  static readonly description = "Termination of Reporting";
  static readonly forms = ["C-TR", "C-TR-W"] as const;
}
