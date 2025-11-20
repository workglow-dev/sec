/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SE extends Form {
  static readonly name = "Submission of Paper-Format Exhibits by Electronic Filers";
  static readonly description = "Submission of paper-format exhibits by electronic filers.";
  static readonly forms = ["SE"] as const;
}
