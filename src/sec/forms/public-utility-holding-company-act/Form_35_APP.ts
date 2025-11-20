/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_35_APP extends Form {
  static readonly name = "Proposed Transaction Statement";
  static readonly description =
    "Statement concerning proposed transaction for which no form of application is prescribed filed pursuant to Rule 20(e) of the Public Utility Holding Company Act.";
  static readonly forms = ["35-APP", "35-APP/A"] as const;
}
