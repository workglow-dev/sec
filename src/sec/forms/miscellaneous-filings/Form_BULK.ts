/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_BULK extends Form {
  static readonly name = "Form BULK";
  static readonly description = "Bulk Submission.";
  static readonly forms = ["BULK", "BULK/A"] as const;
}
