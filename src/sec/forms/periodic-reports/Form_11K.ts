/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_11K extends Form {
  static readonly name = "Annual Report of Employee Stock Plans";
  static readonly description =
    "An annual report of employee stock purchase, savings and similar plans.";
  static readonly forms = ["11-K", "11-K/A"] as const;
}
