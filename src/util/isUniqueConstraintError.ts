/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SQLite's extended result codes for the two ways a UNIQUE index is violated.
 * SQLite words both as `"UNIQUE constraint failed: <table>.<column>"`, so the
 * code path has to accept whatever the message path accepts.
 */
const SQLITE_CONSTRAINT_UNIQUE = 2067;
const SQLITE_CONSTRAINT_PRIMARYKEY = 1555;

/**
 * Detects a UNIQUE-index violation thrown by `@workglow/storage` backends.
 *
 * Three backends in production today:
 *   - InMemory / SQLite — surface the violation as an `Error` whose message
 *     starts (case-insensitively) with `"UNIQUE constraint failed"`. The
 *     built-in `node:sqlite` driver reports every failure as
 *     `code: "ERR_SQLITE_ERROR"` and puts the specific one in a numeric
 *     `errcode`, so the code that discriminates is `errcode`, not `code`.
 *   - Postgres — propagates the raw `pg.DatabaseError` unmodified through
 *     `PostgresTabularStorage._putInternal`. It carries `code: "23505"`
 *     (SQLSTATE `unique_violation`) and a message of the form
 *     `"duplicate key value violates unique constraint \"<name>\""`.
 *
 * Every backend is matched on BOTH a code and a message signal, so the helper
 * still fires if a wrapper layer strips one but preserves the other. A driver
 * swap is what makes that worth stating: the string `"SQLITE_CONSTRAINT_UNIQUE"`
 * came from a native driver this package no longer installs, and matching only
 * that left SQLite with the message as its sole signal.
 *
 * We deliberately avoid `instanceof pg.DatabaseError` / `instanceof SqliteError`
 * — `pg` is not the only Postgres path and `node:sqlite` exports no error class
 * to test against — and string/code matching is robust to wrapped or re-thrown
 * errors.
 */
export function isUniqueConstraintError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  if (code === "23505" || code === "SQLITE_CONSTRAINT_UNIQUE") return true;
  const errcode = (err as { errcode?: unknown }).errcode;
  if (errcode === SQLITE_CONSTRAINT_UNIQUE || errcode === SQLITE_CONSTRAINT_PRIMARYKEY) return true;
  const msg = (err as { message?: unknown }).message;
  if (typeof msg !== "string") return false;
  const lower = msg.toLowerCase();
  return (
    lower.startsWith("unique constraint failed") ||
    lower.includes("duplicate key value violates unique constraint")
  );
}
