/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form_1_E } from "./Form_1_E";
import { Form_1_E_AD } from "./Form_1_E_AD";

export const REGULATION_E_FORM_NAMES_MAP = [
  ...Form_1_E.forms.map((form) => [form, Form_1_E] as const),
  ...Form_1_E_AD.forms.map((form) => [form, Form_1_E_AD] as const),
] as const;

export const REGULATION_E_FORM_NAMES = REGULATION_E_FORM_NAMES_MAP.map(([form, Form]) => form);
export type RegulationEForm = (typeof REGULATION_E_FORM_NAMES)[number];
