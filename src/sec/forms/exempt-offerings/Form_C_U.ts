/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_C_U extends Form {
  static readonly name = "Progress Update (Regulation Crowdfunding)";
  static readonly description = "Progress Update";
  static readonly forms = ["C-U", "C-U-W"] as const;
}
