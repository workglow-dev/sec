/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_CFPORTAL_W extends Form {
  static readonly name = "Crowdfunding Portal Withdrawal";
  static readonly description = "Withdrawal of crowdfunding portal registration.";
  static readonly forms = ["CFPORTAL-W"] as const;
}
