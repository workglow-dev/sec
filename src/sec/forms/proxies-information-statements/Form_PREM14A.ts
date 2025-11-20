/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_PREM14A extends Form {
  static readonly name = "Preliminary Proxy Statement for Merger or Acquisition";
  static readonly description =
    "A preliminary proxy statement relating to a merger or acquisition.";
  static readonly forms = ["PREM14A"] as const;
}
