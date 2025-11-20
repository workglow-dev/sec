/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_DEFA14C extends Form {
  static readonly name = "Definitive Additional Proxy Soliciting Materials";
  static readonly description =
    "Definitive additional proxy soliciting materials filed pursuant to Section 14(c) of the Securities Exchange Act of 1934";
  static readonly forms = ["DEFA14C"] as const;
}
