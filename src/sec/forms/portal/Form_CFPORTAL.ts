/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_CFPORTAL extends Form {
  static readonly name = "Crowdfunding Portal Registration";
  static readonly description = "Initial registration for crowdfunding portals.";
  static readonly forms = ["CFPORTAL", "CFPORTAL/A"] as const;
}
