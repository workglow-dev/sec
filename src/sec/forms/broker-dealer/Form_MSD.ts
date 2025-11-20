/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_MSD extends Form {
  static readonly name = "Municipal Securities Dealer Registration";
  static readonly description =
    "Application for registration as a municipal securities dealer pursuant to Exchange Act Rule 15B(a).";
  static readonly forms = ["MSD", "MSD/A", "MSD-W", "MSDW", "MSDCO"] as const;
}
