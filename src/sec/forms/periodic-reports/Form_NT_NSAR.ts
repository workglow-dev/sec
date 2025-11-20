/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NT_NSAR extends Form {
  static readonly name = "Extension Request for NSAR Forms";
  static readonly description =
    "Request for an extension of time for filing form NSAR-A, NSAR-B or NSAR-U.";
  static readonly forms = ["NT-NSAR", "NT-NSAR/A"] as const;
}
