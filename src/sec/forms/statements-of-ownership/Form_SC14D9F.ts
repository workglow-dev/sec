/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC14D9F extends Form {
  static readonly name = "Statement on Tender Offer (Foreign Issuer)";
  static readonly description =
    "Solicitation/recommendation statement pursuant to Section 14(d)(4) of the Securities Exchange Act of 1934 and Rules 14d-1(b) and 14e-2(c) by foreign issuers.";
  static readonly forms = ["SC14D9F", "SC14D9F/A"] as const;
}
