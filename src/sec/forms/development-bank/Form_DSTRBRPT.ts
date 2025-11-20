/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DSTRBRPT extends Form {
  static readonly name = "Distribution Report";
  static readonly description = "Distribution of primary obligations Development Bank report.";
  static readonly forms = ["DSTRBRPT", "DSTRBRPT/A"] as const;
}
