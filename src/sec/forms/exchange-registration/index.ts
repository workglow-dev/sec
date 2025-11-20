/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form_10_12B } from "./Form_10_12B";
import { Form_10_12G } from "./Form_10_12G";
import { Form_10SB12B } from "./Form_10SB12B";
import { Form_10SB12G } from "./Form_10SB12G";
import { Form_18_12B } from "./Form_18_12B";
import { Form_18_12G } from "./Form_18_12G";

export const EXCHANGE_REGISTRATION_FORMS_MAP = [
  ...Form_10_12B.forms.map((form) => [form, Form_10_12B] as const),
  ...Form_10_12G.forms.map((form) => [form, Form_10_12G] as const),
  ...Form_10SB12B.forms.map((form) => [form, Form_10SB12B] as const),
  ...Form_10SB12G.forms.map((form) => [form, Form_10SB12G] as const),
  ...Form_18_12B.forms.map((form) => [form, Form_18_12B] as const),
  ...Form_18_12G.forms.map((form) => [form, Form_18_12G] as const),
] as const;

export const EXCHANGE_REGISTRATION_FORMS = EXCHANGE_REGISTRATION_FORMS_MAP.map(
  ([form, Form]) => form
);
export type ExchangeRegistrationForm = (typeof EXCHANGE_REGISTRATION_FORMS)[number];
