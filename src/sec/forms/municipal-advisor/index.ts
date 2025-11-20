/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form_MA } from "./Form_MA";
import { Form_MA_A } from "./Form_MA_A";
import { Form_MA_I } from "./Form_MA_I";

export const MUNICIPAL_ADVISOR_FORM_NAMES_MAP = [
  ...Form_MA.forms.map((form) => [form, Form_MA] as const),
  ...Form_MA_A.forms.map((form) => [form, Form_MA_A] as const),
  ...Form_MA_I.forms.map((form) => [form, Form_MA_I] as const),
] as const;

export const MUNICIPAL_ADVISOR_FORM_NAMES = MUNICIPAL_ADVISOR_FORM_NAMES_MAP.map(
  ([form, Form]) => form
);
export type MunicipalAdvisorForm = (typeof MUNICIPAL_ADVISOR_FORM_NAMES)[number];
