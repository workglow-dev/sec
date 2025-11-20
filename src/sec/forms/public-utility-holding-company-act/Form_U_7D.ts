/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_U_7D extends Form {
  static readonly name = "Utility Facility Lease Certificate";
  static readonly description =
    "Certificate concerning lease of a utility facility filed pursuant to Rule 7(d) of the Public Utility Holding Company Act.";
  static readonly forms = ["U-7D", "U-7D/A"] as const;
}
