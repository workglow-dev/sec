/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NT_10K extends Form {
  static readonly name = "Late Submission Notification for 10-K";
  static readonly description = "Notification that form 10-K will be submitted late.";
  static readonly forms = ["NT 10-K", "NT 10-K/A"] as const;
}
