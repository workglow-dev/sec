/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PRES14C extends Form {
  static readonly name = "Preliminary Information Statement for Special Meeting";
  static readonly description =
    "A preliminary information statement relating to a special meeting.";
  static readonly forms = ["PRES14C"] as const;
}
