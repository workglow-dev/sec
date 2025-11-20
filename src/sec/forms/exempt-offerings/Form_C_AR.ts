/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_C_AR extends Form {
  static readonly name = "Annual Report (Regulation Crowdfunding)";
  static readonly description = "Annual Report";
  static readonly forms = ["C-AR", "C-AR/A", "C-AR-W", "C-AR/A-W"] as const;
}
