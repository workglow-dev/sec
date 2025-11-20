/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NPORT_EX extends Form {
  static readonly name = "Portfolio Holdings Exhibit";
  static readonly description = "Portfolio Holdings Exhibit to Form N-PORT.";
  static readonly forms = ["NPORT-EX", "NPORT-EX/A", "NT NPORT-EX"] as const;
}
