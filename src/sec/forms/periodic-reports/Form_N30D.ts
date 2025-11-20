/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N30D extends Form {
  static readonly name = "Annual/Semi-Annual Shareholder Report (RIC)";
  static readonly description =
    "An annual and semi-annual report mailed to shareholders. Filed by registered investment companies.";
  static readonly forms = ["N-30D", "N-30D/A"] as const;
}
