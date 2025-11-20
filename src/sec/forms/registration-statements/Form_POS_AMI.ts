/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_POS_AMI extends Form {
  static readonly name = "Post-effective Amendments (POS AMI)";
  static readonly description = "Post-effective amendments.";
  static readonly forms = ["POS AMI"] as const;
}
