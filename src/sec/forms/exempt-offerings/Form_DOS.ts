/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DOS extends Form {
  static readonly name = "Confidential Draft Offering Statement";
  static readonly description = "Confidential draft offering statement";
  static readonly forms = ["DOS", "DOS/A"] as const;
}
