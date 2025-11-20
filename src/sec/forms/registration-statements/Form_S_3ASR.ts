/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_S_3ASR extends Form {
  static readonly name = "Automatic Shelf Registration Statement";
  static readonly description =
    "Automatic shelf registration statement for well-known seasoned issuers pursuant to Rule 415 under the Securities Act of 1933";
  static readonly forms = ["S-3ASR", "S-3ASR/A"] as const;
}
