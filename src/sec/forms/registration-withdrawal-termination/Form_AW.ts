/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_AW extends Form {
  static readonly name = "Withdrawal of Amendment";
  static readonly description =
    "Withdraws an amendment to a registration statement that had been filed under the Securities Act.";
  static readonly forms = ["AW", "AW WD"] as const; // AW WD (Withdrawal of a Withdrawal-of-Amendment Request)
}
