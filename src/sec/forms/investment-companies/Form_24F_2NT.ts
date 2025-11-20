/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_24F_2NT extends Form {
  static readonly name = "Annual Notice of Securities Sold";
  static readonly description =
    "Annual notice of securities sold by open-end management investment companies pursuant to Rule 24f-2 under the Investment Company Act of 1940";
  static readonly forms = ["24F-2NT", "24F-2NT/A"] as const;
}
