/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_ARS extends Form {
  static readonly name = "Annual Report to Security Holders";
  static readonly description =
    "An annual report to security holders. This is a voluntary filing on EDGAR.";
  static readonly forms = ["ARS", "ARS/A"] as const;
}
