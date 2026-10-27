/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from "vitest";
import { normalizeFactValue } from "./parseXbrlCore";

function numeric(rawText: string, scale: number | null, sign: "-" | null = null): number | null {
  return normalizeFactValue({
    rawText,
    format: null,
    scale,
    sign,
    isNumeric: true,
    isNil: false,
  }).numericValue;
}

/**
 * `value_numeric` is compared exactly — equality joins, de-duplication against
 * `company_facts` — so a scaled fact must be the decimal it states, not that
 * decimal times a power of ten rounded twice.
 */
describe("normalizeFactValue scales without float error", () => {
  it.each([
    ["0.07", 2, 7],
    ["0.07", -2, 0.0007],
    ["0.14", 2, 14],
    ["0.29", 2, 29],
    ["0.13", -2, 0.0013],
    ["0.57", -2, 0.0057],
    ["0.28", 2, 28],
  ])("%s at scale %d is exactly %d", (text, scale, expected) => {
    expect(numeric(text, scale)).toBe(expected);
  });

  it("equals the decimal literal with the scale as its exponent, across two-decimal values", () => {
    // 0.00 through 714.29 at the scales filings use. Multiplying by 10 ** scale
    // missed on about one in ten of these.
    const misses: string[] = [];
    for (let cents = 0; cents < 71_430; cents += 1) {
      const text = (cents / 100).toFixed(2);
      for (const scale of [-2, 2, 3, 6, 9]) {
        const got = numeric(text, scale);
        const exact = Number(`${text}e${scale}`);
        if (got !== exact && misses.length < 10) misses.push(`${text} e${scale}: ${got}`);
      }
    }
    expect(misses).toEqual([]);
  });

  it("applies the sign after scaling", () => {
    expect(numeric("1234", 3, "-")).toBe(-1_234_000);
    expect(numeric("0.07", 2, "-")).toBe(-7);
  });

  it("adds the scale to an exponent the text already carries", () => {
    expect(numeric("1.5e3", 3)).toBe(1_500_000);
    expect(numeric("7E-2", 2)).toBe(7);
  });
});

describe("normalizeFactValue refuses numeric text that is not a number", () => {
  // `Number()` reads every one of these as a finite number: "" and whitespace
  // as 0, "0x10" as 16. A numeric fact with no content is null, never zero.
  it.each(["", "   ", " ", "0x10", "Infinity", "1,234", "12 34"])("%j is null", (text) => {
    expect(numeric(text, null)).toBeNull();
    expect(numeric(text, 3)).toBeNull();
  });

  it("keeps a nil fact null and a non-numeric fact's text", () => {
    expect(
      normalizeFactValue({
        rawText: "",
        format: null,
        scale: null,
        sign: null,
        isNumeric: true,
        isNil: true,
      })
    ).toEqual({ value: "", numericValue: null });
    expect(
      normalizeFactValue({
        rawText: " Acme  Corp ",
        format: null,
        scale: null,
        sign: null,
        isNumeric: false,
        isNil: false,
      })
    ).toEqual({ value: "Acme Corp", numericValue: null });
  });
});
