/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC14D9C extends Form {
  static readonly name = "Statement on Tender Offer";
  static readonly description =
    "Written communication by the subject company relating to a third party tender offer.";
  static readonly forms = ["SC14D9C", "SC14D9C/A"] as const;
}
