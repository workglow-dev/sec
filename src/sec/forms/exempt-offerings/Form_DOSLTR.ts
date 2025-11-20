/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DOSLTR extends Form {
  static readonly name = "Confidential Draft Offering Statement Letter";
  static readonly description = "Confidential draft offering statement letter";
  static readonly forms = ["DOSLTR"] as const;
}
