/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PRES14A extends Form {
  static readonly name = "Preliminary Proxy Statement for Special Meeting";
  static readonly description =
    "A preliminary proxy statement giving notice regarding a special meeting.";
  static readonly forms = ["PRES14A"] as const;
}
