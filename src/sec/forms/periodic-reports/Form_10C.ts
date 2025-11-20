/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_10C extends Form {
  static readonly name = "Report for NASDAQ Quoted Issuers";
  static readonly description =
    "This filing is required of an issuer of securities quoted on the NASDAQ Interdealer Quotation System, and contains information regarding a change in the number of shares outstanding or a change in the name of the issuer.";
  static readonly forms = ["10-C", "10-C/A"] as const;
}
