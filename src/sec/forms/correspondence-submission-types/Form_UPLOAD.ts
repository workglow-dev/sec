/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_UPLOAD extends Form {
  static readonly name = "File Upload Submission";
  static readonly description = "File upload submission.";
  static readonly forms = ["UPLOAD"] as const;
}
