/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { isUniqueConstraintError } from "./isUniqueConstraintError";

describe("isUniqueConstraintError", () => {
  describe("SQLite / InMemory", () => {
    it("matches the canonical SQLite/InMemory message", () => {
      expect(
        isUniqueConstraintError(
          new Error(
            "UNIQUE constraint failed: canonical_person.resolver_version, canonical_person.cik"
          )
        )
      ).toBe(true);
    });

    it("matches the SQLite native error code", () => {
      expect(isUniqueConstraintError({ code: "SQLITE_CONSTRAINT_UNIQUE" })).toBe(true);
    });

    it("matches node:sqlite's extended result code for a UNIQUE index", () => {
      // node:sqlite reports every failure as code "ERR_SQLITE_ERROR" and puts
      // the specific one in `errcode`. Verified against Node 24.20:
      //   UNIQUE index -> 2067, message "UNIQUE constraint failed: t.a"
      expect(isUniqueConstraintError({ code: "ERR_SQLITE_ERROR", errcode: 2067 })).toBe(true);
    });

    it("matches node:sqlite's extended result code for a PRIMARY KEY", () => {
      // 1555, and SQLite words it "UNIQUE constraint failed: pk.a" as well, so
      // the code path has to accept what the message path already accepts.
      expect(isUniqueConstraintError({ code: "ERR_SQLITE_ERROR", errcode: 1555 })).toBe(true);
    });

    it("matches on errcode alone, without the message", () => {
      // The point of carrying both signals: a wrapper that keeps the code and
      // drops the message must not turn a UNIQUE violation into a hard error.
      expect(isUniqueConstraintError({ errcode: 2067 })).toBe(true);
    });

    it("is case-insensitive on the SQLite/InMemory message", () => {
      expect(isUniqueConstraintError(new Error("unique constraint failed: foo"))).toBe(true);
      expect(isUniqueConstraintError(new Error("Unique Constraint Failed: foo"))).toBe(true);
    });
  });

  describe("Postgres", () => {
    it("matches a Postgres error by SQLSTATE code alone (no message)", () => {
      expect(isUniqueConstraintError({ code: "23505" })).toBe(true);
    });

    it("matches a Postgres error by message alone (no code)", () => {
      expect(
        isUniqueConstraintError(
          new Error(
            'duplicate key value violates unique constraint "canonical_company_uniq_resolver_version_cik"'
          )
        )
      ).toBe(true);
    });

    it("matches a Postgres error with both code and message", () => {
      const pgError = Object.assign(
        new Error(
          'duplicate key value violates unique constraint "canonical_company_uniq_resolver_version_crd_number"'
        ),
        { code: "23505" }
      );
      expect(isUniqueConstraintError(pgError)).toBe(true);
    });

    it("is case-insensitive on the Postgres message", () => {
      expect(
        isUniqueConstraintError(new Error('DUPLICATE KEY VALUE VIOLATES UNIQUE CONSTRAINT "foo"'))
      ).toBe(true);
    });

    it("matches the Postgres message when embedded mid-string", () => {
      expect(
        isUniqueConstraintError(
          new Error(
            'ERROR:  duplicate key value violates unique constraint "x"\nDETAIL:  Key (a)=(1) already exists.'
          )
        )
      ).toBe(true);
    });
  });

  describe("rejects unrelated errors", () => {
    it("rejects node:sqlite errcodes for other constraint kinds", () => {
      // Same Node 24.20 run: CHECK -> 275, NOT NULL -> 1299. Both arrive as
      // code "ERR_SQLITE_ERROR" too, so the discriminator has to be `errcode`.
      expect(isUniqueConstraintError({ code: "ERR_SQLITE_ERROR", errcode: 275 })).toBe(false);
      expect(isUniqueConstraintError({ code: "ERR_SQLITE_ERROR", errcode: 1299 })).toBe(false);
    });

    it("rejects a bare ERR_SQLITE_ERROR carrying no errcode", () => {
      expect(isUniqueConstraintError({ code: "ERR_SQLITE_ERROR" })).toBe(false);
    });

    it("rejects unrelated Postgres SQLSTATE codes", () => {
      expect(isUniqueConstraintError({ code: "23503" })).toBe(false); // FK violation
      expect(isUniqueConstraintError({ code: "23502" })).toBe(false); // NOT NULL violation
      expect(isUniqueConstraintError({ code: "23514" })).toBe(false); // CHECK violation
    });

    it("rejects unrelated error messages", () => {
      expect(isUniqueConstraintError(new Error("connection refused"))).toBe(false);
      expect(isUniqueConstraintError(new Error(""))).toBe(false);
      expect(isUniqueConstraintError(new Error("unique"))).toBe(false);
      expect(isUniqueConstraintError(new Error("duplicate key"))).toBe(false);
    });

    it("rejects an Error without a recognised code or message", () => {
      const e = new Error("something else broke");
      expect(isUniqueConstraintError(e)).toBe(false);
    });

    it("rejects non-Error inputs", () => {
      expect(isUniqueConstraintError(null)).toBe(false);
      expect(isUniqueConstraintError(undefined)).toBe(false);
      expect(isUniqueConstraintError("UNIQUE constraint failed")).toBe(false);
      expect(isUniqueConstraintError(23505)).toBe(false);
      expect(isUniqueConstraintError(true)).toBe(false);
      expect(isUniqueConstraintError({})).toBe(false);
      expect(isUniqueConstraintError({ message: 42 })).toBe(false);
      expect(isUniqueConstraintError({ code: 23505 })).toBe(false); // number, not string
    });
  });
});
