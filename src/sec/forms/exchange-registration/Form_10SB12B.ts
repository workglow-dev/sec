/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_10SB12B extends Form {
  static readonly name = "Registration of Securities of Small Business Issuers";
  static readonly description =
    "Registration statement for securities of small business issuers pursuant to Section 12(b) of the Securities Exchange Act of 1934";
  static readonly forms = ["10SB12B", "10SB12B/A"] as const;
}
