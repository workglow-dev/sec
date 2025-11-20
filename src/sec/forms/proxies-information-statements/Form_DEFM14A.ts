/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFM14A extends Form {
  static readonly name = "Definitive Proxy Statement for Merger or Acquisition";
  static readonly description =
    "Provides official notification to designated classes of shareholders of matters relating to a merger or acquisition.";
  static readonly forms = ["DEFM14A"] as const;
}
