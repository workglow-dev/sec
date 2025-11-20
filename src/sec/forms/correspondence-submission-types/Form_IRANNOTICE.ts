/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_IRANNOTICE extends Form {
  static readonly name = "Internal Review and Annotation Notice";
  static readonly description = "Internal review and annotation notice.";
  static readonly forms = ["IRANNOTICE"] as const;
}
