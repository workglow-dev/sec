/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_POSASR extends Form {
  static readonly name = "Post-Effective Amendment to Automatic Shelf Registration Statement";
  static readonly description =
    "Post-effective amendment to automatic shelf registration statement pursuant to Rule 415 under the Securities Act of 1933";
  static readonly forms = ["POSASR", "POSASR/A"] as const;
}
