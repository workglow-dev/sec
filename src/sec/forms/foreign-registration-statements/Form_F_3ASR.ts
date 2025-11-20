/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_3ASR extends Form {
  static readonly name = "F-3ASR";
  static readonly description =
    "Automatic shelf registration statement for foreign private issuers";
  static readonly forms = ["F-3ASR", "F-3ASR/A"] as const;
}
