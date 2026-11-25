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
import { applyEnvConfig, writeEnvFile, type InitConfig } from "./envFile";

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

    // DI is wired from process.env, so it must hold exactly what the file now
    // says — the Postgres set included, or the configured-env check fails.
    applyEnvConfig(process.env, config);

    EnvToDI();
    if (config.dbType === "sqlite" && typeof Sqlite.init === "function") {
      await Sqlite.init();
    }
    DefaultDI();

    await setupAllDatabases();

    return { envPath, dbFolder: config.dbFolder, rawDataFolder: config.rawDataFolder };
  }
}
