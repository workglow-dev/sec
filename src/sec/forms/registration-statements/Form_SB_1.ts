/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SB_1 extends Form {
  static readonly name = "Registration Statement (SB-1)";
  static readonly description =
    "An optional filing for small business issuers for the registration of securities to be sold to the public.";
  static readonly forms = ["SB-1", "SB-1/A", "SB-1MEF", "S-B", "S-B/A", "S-BMEF"] as const;
}
