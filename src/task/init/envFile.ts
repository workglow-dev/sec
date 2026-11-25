/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { chmodSync, existsSync, readFileSync, writeFileSync } from "fs";

export interface InitConfig {
  readonly dbType: "sqlite" | "postgres";
  readonly dbFolder: string;
  readonly dbName: string;
  readonly rawDataFolder: string;
  readonly pgUrl?: string;
  readonly pgHost?: string;
  readonly pgPort?: string;
  readonly pgUser?: string;
  readonly pgPassword?: string;
  readonly pgDatabase?: string;
}

/**
 * Every key the setup wizard owns in `.env.local`. A merge rewrites these and
 * keeps every other line, and an owned key the new answers leave unset is
 * removed — a stale `SEC_PG_URL` would otherwise outrank the host/port/user the
 * wizard just wrote.
 */
export const WIZARD_ENV_KEYS = [
  "SEC_DB_TYPE",
  "SEC_DB_FOLDER",
  "SEC_DB_NAME",
  "SEC_RAW_DATA_FOLDER",
  "SEC_PG_URL",
  "SEC_PG_HOST",
  "SEC_PG_PORT",
  "SEC_PG_USER",
  "SEC_PG_PASSWORD",
  "SEC_PG_DATABASE",
] as const;

export type WizardEnvKey = (typeof WIZARD_ENV_KEYS)[number];

const MASK = "********";

/**
 * Quotes a value so Bun's `.env` loader reads back exactly `value`.
 *
 * Bun's loader expands `$NAME` and `${NAME}` inside single AND double quotes,
 * honours `\$` as the one escape, and keeps every other backslash literally
 * (`\"` reads back as two characters). So a value is quoted with whichever quote
 * character it does not contain and each `$` is written `\$`. What has no
 * spelling is refused rather than written wrong: a line break (the value would
 * end at it), both quote characters, and a trailing backslash (it escapes the
 * closing quote, swallowing the next line).
 */
export function encodeEnvValue(key: string, value: string): string {
  const refuse = (why: string): never => {
    throw new Error(`${key} cannot be written to .env.local: it ${why}. Choose a different value.`);
  };
  if (/[\r\n\0]/.test(value)) refuse("contains a line break");
  if (value.endsWith("\\")) refuse("ends with a backslash");
  const quote = !value.includes("'") ? "'" : !value.includes('"') ? '"' : undefined;
  if (quote === undefined) refuse("contains both a single and a double quote");
  return `${quote}${value.replace(/\$/g, "\\$")}${quote}`;
}

export function envEntriesFor(config: InitConfig): ReadonlyArray<readonly [WizardEnvKey, string]> {
  const entries: Array<readonly [WizardEnvKey, string]> = [
    ["SEC_DB_TYPE", config.dbType],
    ["SEC_DB_FOLDER", config.dbFolder],
    ["SEC_DB_NAME", config.dbName],
    ["SEC_RAW_DATA_FOLDER", config.rawDataFolder],
  ];
  if (config.dbType === "postgres") {
    if (config.pgUrl) {
      entries.push(["SEC_PG_URL", config.pgUrl]);
    } else {
      if (config.pgHost) entries.push(["SEC_PG_HOST", config.pgHost]);
      if (config.pgPort) entries.push(["SEC_PG_PORT", config.pgPort]);
      if (config.pgUser) entries.push(["SEC_PG_USER", config.pgUser]);
      if (config.pgPassword) entries.push(["SEC_PG_PASSWORD", config.pgPassword]);
      if (config.pgDatabase) entries.push(["SEC_PG_DATABASE", config.pgDatabase]);
    }
  }
  return entries;
}

/**
 * Brings `env` in line with what `.env.local` now says: every owned key is set
 * to the new answer or deleted, since a key left over from an earlier run (a
 * `SEC_PG_URL` beside the host/port/user just chosen) would outrank it.
 */
export function applyEnvConfig(env: NodeJS.ProcessEnv, config: InitConfig): void {
  const next = new Map<string, string>(envEntriesFor(config));
  for (const key of WIZARD_ENV_KEYS) {
    const value = next.get(key);
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
}

/** The wizard's lines alone, as a fresh `.env.local` would hold them. */
export function buildEnvConfig(config: InitConfig): string {
  return (
    envEntriesFor(config)
      .map(([key, value]) => `${key}=${encodeEnvValue(key, value)}`)
      .join("\n") + "\n"
  );
}

const ASSIGNMENT = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;
const OWNED: ReadonlySet<string> = new Set(WIZARD_ENV_KEYS);

/**
 * Folds the wizard's answers into an existing `.env.local`: an owned key is
 * rewritten where it first appears (later duplicates dropped), an owned key the
 * answers leave unset is removed, a new one is appended, and every other line —
 * API keys, the fetch limits, comments — is kept as it was.
 */
export function mergeEnvConfig(existing: string, config: InitConfig): string {
  const pending = new Map<string, string>(
    envEntriesFor(config).map(([key, value]) => [key, `${key}=${encodeEnvValue(key, value)}`])
  );
  const seen = new Set<string>();
  const out: string[] = [];
  const lines = existing.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  for (const line of lines) {
    const key = ASSIGNMENT.exec(line)?.[1];
    if (key === undefined || !OWNED.has(key)) {
      out.push(line);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    const replacement = pending.get(key);
    if (replacement !== undefined) {
      out.push(replacement);
      pending.delete(key);
    }
  }
  out.push(...pending.values());
  return out.join("\n") + "\n";
}

/**
 * Writes the wizard's answers into `envPath`, merging into the file when one
 * exists. The file holds a database password, so it is owner-only — `chmod`
 * too, since a mode passed to `writeFileSync` applies only to a new file.
 */
export function writeEnvFile(envPath: string, config: InitConfig): void {
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf-8") : undefined;
  const content =
    existing === undefined ? buildEnvConfig(config) : mergeEnvConfig(existing, config);
  writeFileSync(envPath, content, { encoding: "utf-8", mode: 0o600 });
  chmodSync(envPath, 0o600);
}

/** The same answers with every credential replaced, for anything printed. */
export function redactInitConfig(config: InitConfig): InitConfig {
  let pgUrl = config.pgUrl;
  if (pgUrl) {
    try {
      const url = new URL(pgUrl);
      if (url.password) {
        url.password = MASK;
        pgUrl = url.toString();
      }
    } catch {
      // Not parseable as a URL, so there is no telling where a password sits in it.
      pgUrl = MASK;
    }
  }
  return {
    ...config,
    ...(pgUrl !== undefined ? { pgUrl } : {}),
    ...(config.pgPassword ? { pgPassword: MASK } : {}),
  };
}
