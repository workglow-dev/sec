/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_ABS_EE extends Form {
  static readonly name = "Electronic Exhibits for Asset-Backed Securities";
  static readonly description =
    "Form for Submission of Electronic Exhibits in asset-backed securities offerings.";
  static readonly forms = ["ABS-EE", "ABS-EE/A"] as const;
}
