/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form } from "../Form";

export class Form_NRSRO_IQ extends Form {
  static readonly name = "NRSRO Annual Certification of Internal Controls";
  static readonly description = "Annual certification of internal controls for NRSROs.";
  static readonly forms = ["NRSRO-IQ", "NRSRO-IQ/A"] as const;
}
