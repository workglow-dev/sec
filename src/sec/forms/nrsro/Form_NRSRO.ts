/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NRSRO extends Form {
  static readonly name = "Application for NRSRO";
  static readonly description =
    "Initial application for registration as a Nationally Recognized Statistical Rating Organization.";
  static readonly forms = ["NRSRO", "NRSRO/A"] as const;
}
