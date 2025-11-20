/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form_ATS_N } from "./Form_ATS_N";

export const ATS_FORM_NAMES_MAP = [
  ...Form_ATS_N.forms.map((form) => [form, Form_ATS_N] as const),
] as const;

export const ATS_FORM_NAMES = ATS_FORM_NAMES_MAP.map(([form, Form]) => form);

export type AtsForm = (typeof ATS_FORM_NAMES)[number];
