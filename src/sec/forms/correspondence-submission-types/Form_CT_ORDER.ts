/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_CT_ORDER extends Form {
  static readonly name = "Court Order Affecting SEC Filings";
  static readonly description = "Court order affecting SEC filings.";
  static readonly forms = ["CT ORDER"] as const;
}
