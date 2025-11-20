/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_F_3DPOS extends Form {
  static readonly name = "F-3DPOS";
  static readonly description = "Post-effective amendment to F-3D registration statement";
  static readonly forms = ["F-3DPOS"] as const;
}
