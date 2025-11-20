/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_SC_14D9 extends Form {
  static readonly name = "Solicitation/Recommendation Statement";
  static readonly description =
    "This filing is made by a person making a solicitation or recommendation with respect to a tender offer.";
  static readonly forms = ["SC 14D9", "SC 14D9/A"] as const;
}
