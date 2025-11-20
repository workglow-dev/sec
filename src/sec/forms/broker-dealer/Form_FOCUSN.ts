/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_FOCUSN extends Form {
  static readonly name = "Normalized FOCUS Report";
  static readonly description = "Normalized FOCUS report filed by broker-dealers.";
  static readonly forms = ["FOCUSN", "FOCUSN/A"] as const;
}
