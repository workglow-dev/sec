/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_ABS_15G extends Form {
  static readonly name = "Asset-Backed Securities Report (Section 15G)";
  static readonly description = "Asset-backed securities report pursuant to Section 15G.";
  static readonly forms = ["ABS-15G", "ABS-15G/A"] as const;
}
