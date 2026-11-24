/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdirSync } from "fs";
import { Type } from "typebox";
import { Sqlite, Task } from "workglow";
import { DefaultDI } from "../../config/DefaultDI";
import { EnvToDI } from "../../config/EnvToDI";
import { setupAllDatabases } from "../../config/setupAllDatabases";
import type { TaskPorts } from "../taskPorts";
import { writeEnvFile, type InitConfig } from "./envFile";

export interface InitApplyTaskInput extends InitConfig {
  readonly envPath: string;
}

export type InitApplyTaskOutput = {
  readonly envPath: string;
  readonly dbFolder: string;
  readonly rawDataFolder: string;
};

/**
 * Apply phase of the first-run setup wizard: merges its answers into
 * `.env.local`, creates the data folders, wires DI from the fresh env, and
 * creates the database tables.
 */
export class InitApplyTask extends Task<TaskPorts<InitApplyTaskInput>, InitApplyTaskOutput> {
  static readonly type = "InitApplyTask";
  static readonly category = "SEC";
  static readonly title = "Apply first-run setup";
  static readonly cacheable = false;

  public static inputSchema() {
    return Type.Object({
      envPath: Type.String(),
      dbType: Type.Union([Type.Literal("sqlite"), Type.Literal("postgres")]),
      dbFolder: Type.String(),
      dbName: Type.String(),
      rawDataFolder: Type.String(),
      pgUrl: Type.Optional(Type.String()),
      pgHost: Type.Optional(Type.String()),
      pgPort: Type.Optional(Type.String()),
      pgUser: Type.Optional(Type.String()),
      pgPassword: Type.Optional(Type.String()),
      pgDatabase: Type.Optional(Type.String()),
    });
  }

  public static outputSchema() {
    return Type.Object({
      envPath: Type.String(),
      dbFolder: Type.String(),
      rawDataFolder: Type.String(),
    });
  }

  async execute(input: TaskPorts<InitApplyTaskInput>): Promise<InitApplyTaskOutput> {
    const { envPath, ...config } = input;

    // What this did is reported by `sec setup` from the output ports, once the
    // run's frame has closed, rather than printed underneath it.
    writeEnvFile(envPath, config);
    mkdirSync(config.dbFolder, { recursive: true });
    mkdirSync(config.rawDataFolder, { recursive: true });

    // Re-read env so DI picks up new values. Push every var the
    // wizard collected, including the Postgres set — assertSecCliEnvConfigured
    // now fails fast for a Postgres dbType with missing PG env, so
    // the wizard would crash immediately after writing .env.local
    // if we left these blank.
    process.env.SEC_DB_TYPE = config.dbType;
    process.env.SEC_DB_FOLDER = config.dbFolder;
    process.env.SEC_DB_NAME = config.dbName;
    process.env.SEC_RAW_DATA_FOLDER = config.rawDataFolder;
    if (config.pgUrl !== undefined) process.env.SEC_PG_URL = config.pgUrl;
    if (config.pgHost !== undefined) process.env.SEC_PG_HOST = config.pgHost;
    if (config.pgPort !== undefined) process.env.SEC_PG_PORT = config.pgPort;
    if (config.pgUser !== undefined) process.env.SEC_PG_USER = config.pgUser;
    if (config.pgPassword !== undefined) process.env.SEC_PG_PASSWORD = config.pgPassword;
    if (config.pgDatabase !== undefined) process.env.SEC_PG_DATABASE = config.pgDatabase;

    EnvToDI();
    if (config.dbType === "sqlite" && typeof Sqlite.init === "function") {
      await Sqlite.init();
    }
    DefaultDI();

    await setupAllDatabases();

    return { envPath, dbFolder: config.dbFolder, rawDataFolder: config.rawDataFolder };
  }
}
