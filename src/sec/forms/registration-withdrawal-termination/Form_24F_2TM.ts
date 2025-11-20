/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_24F_2TM extends Form {
  static readonly name = "Rule 24f-2 Termination";
  static readonly description =
    "Registration of securities by certain investment companies pursuant to rule 24f-2. Termination of declaration of election.";
  static readonly forms = ["24F-2TM"] as const;
}
