/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_TH extends Form {
  static readonly name = "Temporary Hardship";
  static readonly description = "Notification of reliance on temporary hardship exemption.";
  static readonly forms = ["TH"] as const;
}
