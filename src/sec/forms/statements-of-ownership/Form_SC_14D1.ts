/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC_14D1 extends Form {
  static readonly name = "Tender Offer Statement";
  static readonly description =
    "This filing is made by a person making a tender offer for securities of a public company.";
  static readonly forms = ["SC 14D1", "SC 14D1/A"] as const;
}
