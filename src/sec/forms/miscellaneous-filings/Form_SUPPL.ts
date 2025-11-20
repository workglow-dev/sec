/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SUPPL extends Form {
  static readonly name = "Supplemental Information";
  static readonly description =
    "Supplemental information filed pursuant to the Securities Act of 1933 or the Securities Exchange Act of 1934";
  static readonly forms = ["SUPPL"] as const;
}
