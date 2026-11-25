import { spawnSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyEnvConfig,
  encodeEnvValue,
  mergeEnvConfig,
  redactInitConfig,
  WIZARD_ENV_KEYS,
  writeEnvFile,
} from "../../task/init/envFile";
import type { InitConfig } from "./init";
import { buildEnvConfig } from "./init";

const SQLITE: InitConfig = {
  dbType: "sqlite",
  dbFolder: "/home/user/.sec/data",
  dbName: "edgar",
  rawDataFolder: "/home/user/.sec/raw",
};

/** What Bun's own `.env` loader — the one every later `sec` command reads through — makes of the file. */
function loadWithBun(envPath: string, cwd: string): Record<string, string | undefined> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("SEC_") && key !== "NODE_ENV") env[key] = value;
  }
  const keys = JSON.stringify([...WIZARD_ENV_KEYS, "ANTHROPIC_API_KEY"]);
  const result = spawnSync(
    "bun",
    [
      `--env-file=${envPath}`,
      "-e",
      `const o = {}; for (const k of ${keys}) o[k] = process.env[k]; console.log(JSON.stringify(o));`,
    ],
    { cwd, env, encoding: "utf-8" }
  );
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout.trim()) as Record<string, string | undefined>;
}

describe("applyEnvConfig", () => {
  const PG_URL: InitConfig = {
    ...SQLITE,
    dbType: "postgres",
    pgUrl: "postgres://user:pass@old-host:5432/edgar",
  };
  const PG_PARTS: InitConfig = {
    ...SQLITE,
    dbType: "postgres",
    pgHost: "new-host",
    pgPort: "5433",
    pgUser: "admin",
    pgDatabase: "sec_data",
  };

  // A second `sec setup` in one process: the URL the first run set would
  // outrank the host/port/user just chosen, and the tables would be built in
  // the old database.
  it("deletes an owned key the new answers leave unset", () => {
    const env: NodeJS.ProcessEnv = { ANTHROPIC_API_KEY: "kept" };
    applyEnvConfig(env, PG_URL);
    expect(env.SEC_PG_URL).toBe(PG_URL.pgUrl);
    applyEnvConfig(env, PG_PARTS);
    expect(env.SEC_PG_URL).toBeUndefined();
    expect(env).toMatchObject({
      SEC_DB_TYPE: "postgres",
      SEC_PG_HOST: "new-host",
      SEC_PG_PORT: "5433",
      SEC_PG_USER: "admin",
      SEC_PG_DATABASE: "sec_data",
      ANTHROPIC_API_KEY: "kept",
    });
    expect("SEC_PG_PASSWORD" in env).toBe(false);
  });

  it("leaves no Postgres key behind on a switch back to SQLite", () => {
    const env: NodeJS.ProcessEnv = {};
    applyEnvConfig(env, PG_PARTS);
    applyEnvConfig(env, SQLITE);
    expect(Object.keys(env).filter((k) => k.startsWith("SEC_PG_"))).toEqual([]);
    expect(env.SEC_DB_TYPE).toBe("sqlite");
  });

  it("matches what the written file holds", () => {
    const env: NodeJS.ProcessEnv = {};
    applyEnvConfig(env, PG_PARTS);
    const fromFile = Object.fromEntries(
      buildEnvConfig(PG_PARTS)
        .trim()
        .split("\n")
        .map((line) => {
          const at = line.indexOf("=");
          return [line.slice(0, at), line.slice(at + 2, -1)];
        })
    );
    expect(env).toEqual(fromFile);
  });
});

describe("buildEnvConfig", () => {
  it("generates SQLite config with required vars", () => {
    const result = buildEnvConfig(SQLITE);
    expect(result).toContain("SEC_DB_TYPE='sqlite'");
    expect(result).toContain("SEC_DB_FOLDER='/home/user/.sec/data'");
    expect(result).toContain("SEC_DB_NAME='edgar'");
    expect(result).toContain("SEC_RAW_DATA_FOLDER='/home/user/.sec/raw'");
    expect(result).not.toContain("SEC_PG_");
  });

  it("generates Postgres config with URL when pgUrl provided", () => {
    const result = buildEnvConfig({
      ...SQLITE,
      dbType: "postgres",
      pgUrl: "postgres://user:pass@localhost:5432/edgar",
    });
    expect(result).toContain("SEC_DB_TYPE='postgres'");
    expect(result).toContain("SEC_PG_URL='postgres://user:pass@localhost:5432/edgar'");
    expect(result).not.toMatch(/SEC_PG_(HOST|PORT|USER|PASSWORD|DATABASE)/);
  });

  it("generates Postgres config with individual params when no pgUrl", () => {
    const result = buildEnvConfig({
      ...SQLITE,
      dbType: "postgres",
      pgHost: "db.example.com",
      pgPort: "5433",
      pgUser: "admin",
      pgPassword: "secret",
      pgDatabase: "sec_data",
    });
    expect(result).toContain("SEC_PG_HOST='db.example.com'");
    expect(result).toContain("SEC_PG_PORT='5433'");
    expect(result).toContain("SEC_PG_USER='admin'");
    expect(result).toContain("SEC_PG_PASSWORD='secret'");
    expect(result).toContain("SEC_PG_DATABASE='sec_data'");
    expect(result).not.toContain("SEC_PG_URL");
  });

  it("refuses a value Bun's loader has no spelling for", () => {
    expect(() => encodeEnvValue("SEC_PG_PASSWORD", "pass\nword")).toThrow(/line break/);
    expect(() => encodeEnvValue("SEC_PG_PASSWORD", "pass\rword")).toThrow(/line break/);
    expect(() => encodeEnvValue("SEC_PG_PASSWORD", `it's "x"`)).toThrow(/both/);
    expect(() => encodeEnvValue("SEC_DB_FOLDER", "c:\\data\\")).toThrow(/backslash/);
  });
});

describe(".env.local round trip through Bun's loader", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sec-init-env-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it.each([
    ["dollar signs", "pa$$w0rd$HOME"],
    ["braced expansion", "x${HOME}y$(id)"],
    ["double quote", 'Tr0ub4dor&"$ecret'],
    ["single quote", "it's$x"],
    ["backslashes", "c:\\x\\\\y\\$z"],
    ["comment and spaces", "  a #b = c  "],
    ["backtick", "`whoami`"],
  ])("reads back a password with %s exactly", (_label, password) => {
    const config: InitConfig = {
      ...SQLITE,
      dbType: "postgres",
      dbFolder: join(dir, "data $HOME"),
      pgHost: "localhost",
      pgPort: "5432",
      pgUser: "admin",
      pgPassword: password,
      pgDatabase: "edgar",
    };
    const envPath = join(dir, ".env.local");
    writeEnvFile(envPath, config);
    const loaded = loadWithBun(envPath, dir);
    expect(loaded.SEC_PG_PASSWORD).toBe(password);
    expect(loaded.SEC_DB_FOLDER).toBe(config.dbFolder);
    expect(loaded.SEC_PG_USER).toBe("admin");
  });

  it("merges into an existing file, keeping every line the wizard does not own", () => {
    const envPath = join(dir, ".env.local");
    writeFileSync(
      envPath,
      [
        "# my settings",
        "ANTHROPIC_API_KEY=sk-test",
        "SEC_DB_TYPE=postgres",
        "SEC_PG_URL=postgres://old@host/db",
        "SEC_USER_AGENT='Me me@example.com'",
        "SEC_DB_NAME=old",
        "SEC_DB_NAME=older",
      ].join("\n"),
      { mode: 0o644 }
    );
    writeEnvFile(envPath, { ...SQLITE, dbName: "fresh" });

    const text = readFileSync(envPath, "utf-8");
    expect(text).toContain("# my settings");
    expect(text).toContain("SEC_USER_AGENT='Me me@example.com'");
    expect(text).not.toContain("SEC_PG_URL");
    expect(text.match(/SEC_DB_NAME=/g)).toHaveLength(1);

    const loaded = loadWithBun(envPath, dir);
    expect(loaded.ANTHROPIC_API_KEY).toBe("sk-test");
    expect(loaded.SEC_DB_TYPE).toBe("sqlite");
    expect(loaded.SEC_DB_NAME).toBe("fresh");
    expect(loaded.SEC_RAW_DATA_FOLDER).toBe(SQLITE.rawDataFolder);
    expect(loaded.SEC_PG_URL).toBeUndefined();
  });

  it("writes the file owner-only, new or existing", () => {
    const fresh = join(dir, "fresh.env");
    writeEnvFile(fresh, SQLITE);
    expect(statSync(fresh).mode & 0o777).toBe(0o600);

    const existing = join(dir, "existing.env");
    writeFileSync(existing, "A=1\n", { mode: 0o644 });
    writeEnvFile(existing, SQLITE);
    expect(statSync(existing).mode & 0o777).toBe(0o600);
  });
});

describe("mergeEnvConfig", () => {
  it("rewrites an owned key in place and appends the missing ones", () => {
    const merged = mergeEnvConfig("A=1\nSEC_DB_NAME=old\nB=2\n", SQLITE);
    const lines = merged.trimEnd().split("\n");
    expect(lines.slice(0, 3)).toEqual(["A=1", "SEC_DB_NAME='edgar'", "B=2"]);
    expect(lines).toContain("SEC_DB_TYPE='sqlite'");
  });
});

describe("redactInitConfig", () => {
  it("masks the password and the credential in a connection string", () => {
    const shown = buildEnvConfig(
      redactInitConfig({ ...SQLITE, dbType: "postgres", pgUrl: "postgres://u:hunter2@h:5432/d" })
    );
    expect(shown).not.toContain("hunter2");
    expect(shown).toContain("postgres://u:********@h:5432/d");

    const fields = buildEnvConfig(
      redactInitConfig({
        ...SQLITE,
        dbType: "postgres",
        pgHost: "h",
        pgUser: "u",
        pgPassword: "hunter2",
      })
    );
    expect(fields).not.toContain("hunter2");
    expect(fields).toContain("SEC_PG_PASSWORD='********'");
  });
});
