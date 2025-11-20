/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_2DPOS extends Form {
  static readonly name = "F-2DPOS";
  static readonly description = "Post-effective amendment to F-2D registration statement";
  static readonly forms = ["F-2DPOS"] as const;
}
