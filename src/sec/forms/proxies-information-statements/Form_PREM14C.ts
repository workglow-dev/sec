/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PREM14C extends Form {
  static readonly name = "Preliminary Information Statement for Merger or Acquisition";
  static readonly description =
    "A preliminary information statement relating to a merger or acquisition.";
  static readonly forms = ["PREM14C"] as const;
}
