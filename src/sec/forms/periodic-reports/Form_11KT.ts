/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_11KT extends Form {
  static readonly name = "Annual Report of Employee Stock Plans (Transition)";
  static readonly description =
    "Annual report of employee stock purchase, savings and similar plans. Filed pursuant to rule 13a-10 or 15d-10 of the Securities Exchange Act.";
  static readonly forms = ["11-KT", "11-KT/A"] as const;
}
