/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFM14C extends Form {
  static readonly name = "Definitive Information Statement for Merger or Acquisition";
  static readonly description =
    "A definitive information statement relating to a merger or an acquisition.";
  static readonly forms = ["DEFM14C"] as const;
}
