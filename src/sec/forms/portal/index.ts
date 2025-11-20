/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Form_CFPORTAL } from "./Form_CFPORTAL";
import { Form_CFPORTAL_W } from "./Form_CFPORTAL_W";

export const PORTAL_FORM_NAMES_MAP = [
  ...Form_CFPORTAL.forms.map((form) => [form, Form_CFPORTAL] as const),
  ...Form_CFPORTAL_W.forms.map((form) => [form, Form_CFPORTAL_W] as const),
] as const;

export const PORTAL_FORM_NAMES = PORTAL_FORM_NAMES_MAP.map(([form, Form]) => form);
export type PortalForm = (typeof PORTAL_FORM_NAMES)[number];
