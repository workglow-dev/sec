/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFA14A extends Form {
  static readonly name = "Additional Proxy Soliciting Materials";
  static readonly description = "Additional proxy soliciting materials - definitive.";
  static readonly forms = ["DEFA14A"] as const;
}
