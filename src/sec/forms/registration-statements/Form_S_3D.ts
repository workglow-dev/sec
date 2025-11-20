/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_S_3D extends Form {
  static readonly name = "Registration Statement (S-3D)";
  static readonly description =
    "Registration statement of securities pursuant to dividend or interest reinvestment plans which become effective automatically upon filing.";
  static readonly forms = ["S-3D", "S-3D/A", "S-3DPOS"] as const;
}
