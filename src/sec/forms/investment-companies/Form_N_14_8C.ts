/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_N_14_8C extends Form {
  static readonly name = "Proxy Statement for Mergers and Acquisitions";
  static readonly description =
    "Proxy statement for mergers and acquisitions involving investment companies pursuant to Section 14(a) of the Securities Exchange Act of 1934";
  static readonly forms = ["N-14 8C", "N-14 8C/A"] as const;
}
