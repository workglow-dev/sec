/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_35_CERT extends Form {
  static readonly name = "Terms and Conditions Certificate";
  static readonly description =
    "Certificate concerning terms and conditions filed pursuant to Rule 24 of the Public Utility Holding Company Act.";
  static readonly forms = ["35-CERT", "35-CERT/A"] as const;
}
