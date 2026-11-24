import type { Command } from "commander";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import { createInterface } from "readline";
import { Writable } from "stream";
import { globalServiceRegistry } from "workglow";
import { SEC_DRY_RUN, SEC_JSON_OUTPUT } from "../../config/tokens";
import { InitApplyTask, type InitApplyTaskOutput } from "../../task/init/InitApplyTask";
import {
  buildEnvConfig,
  mergeEnvConfig,
  redactInitConfig,
  type InitConfig,
} from "../../task/init/envFile";
import { parseGlobalOptions } from "../GlobalOptions";
import { runCommand } from "../runCommand";
import { runWorkflowCli } from "../runWorkflow";
import { suggest } from "../nextSteps";

export { buildEnvConfig };
export type { InitConfig };

interface Prompter {
  readonly ask: (question: string) => Promise<string>;
  /** Asks without echoing what is typed, for a password or a URL carrying one. */
  readonly askSecret: (question: string) => Promise<string>;
  readonly close: () => void;
}

function createPrompter(): Prompter {
  // readline echoes each keystroke through its output stream, so a secret is
  // read with that stream muted; the question itself is written around it.
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, callback): void {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: process.stdin.isTTY });
  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
  return {
    ask,
    askSecret: async (question) => {
      process.stdout.write(question);
      muted = true;
      try {
        return await ask("");
      } finally {
        muted = false;
        process.stdout.write("\n");
      }
    },
    close: () => rl.close(),
  };
}

export function addInitCommand(parent: Command): void {
  parent
    .command("setup")
    .alias("init")
    .description("First-run setup: configuration, then the database tables")
    .action(async () => {
      const globalOpts = parseGlobalOptions(parent);
      const dryRun = globalOpts.dryRun;
      globalServiceRegistry.registerInstance(SEC_DRY_RUN, dryRun);
      globalServiceRegistry.registerInstance(SEC_JSON_OUTPUT, globalOpts.json);

      await runCommand(async () => {
        const envPath = resolve(process.cwd(), ".env.local");

        const envExists = existsSync(envPath);
        if (envExists) {
          console.log(
            "Found .env.local: the database settings in it will be replaced, every other line kept."
          );
        }

        const prompter = createPrompter();

        try {
          const defaultDbFolder = resolve(homedir(), ".sec/data");
          const defaultRawFolder = resolve(homedir(), ".sec/raw");

          const dbTypeAnswer = await prompter.ask("Database type (sqlite or postgres) [sqlite]: ");
          const dbType = dbTypeAnswer === "postgres" ? "postgres" : "sqlite";

          const dbFolder =
            (await prompter.ask(`Database folder [${defaultDbFolder}]: `)) || defaultDbFolder;

          const dbName = (await prompter.ask("Database name [edgar]: ")) || "edgar";

          const rawDataFolder =
            (await prompter.ask(`Raw data folder [${defaultRawFolder}]: `)) || defaultRawFolder;

          let pgFields: Partial<InitConfig> = {};

          if (dbType === "postgres") {
            const useUrl = await prompter.ask("Use a connection string? (y/n) [n]: ");

            if (useUrl.toLowerCase() === "y") {
              const pgUrl = await prompter.askSecret("PostgreSQL connection string: ");
              pgFields = { pgUrl };
            } else {
              const pgHost = (await prompter.ask("PostgreSQL host [localhost]: ")) || "localhost";
              const pgPort = (await prompter.ask("PostgreSQL port [5432]: ")) || "5432";
              const pgUser = await prompter.ask("PostgreSQL user: ");
              const pgPassword = await prompter.askSecret("PostgreSQL password: ");
              const pgDatabase = (await prompter.ask("PostgreSQL database [edgar]: ")) || "edgar";

              pgFields = { pgHost, pgPort, pgUser, pgPassword, pgDatabase };
            }
          }

          const config: InitConfig = {
            dbType,
            dbFolder,
            dbName,
            rawDataFolder,
            ...pgFields,
          };

          if (dryRun) {
            // Encoded first so a value with no spelling is refused here too;
            // printed redacted, since stdout is scrollback and often a log.
            const shown = redactInitConfig(config);
            if (envExists) {
              mergeEnvConfig(readFileSync(envPath, "utf-8"), config);
              console.log(`Would set in ${envPath} (other lines kept):`);
            } else {
              buildEnvConfig(config);
              console.log(`Would write ${envPath}:`);
            }
            console.log(buildEnvConfig(shown));
            console.log(`Would create directory: ${dbFolder}`);
            console.log(`Would create directory: ${rawDataFolder}`);
            console.log("Would create database tables.");
            return;
          }

          const applied = await runWorkflowCli<InitApplyTaskOutput>([
            new InitApplyTask({ defaults: { ...config, envPath } }),
          ]);
          console.log(`Wrote ${applied.envPath}`);
          console.log(`Created directory: ${applied.dbFolder}`);
          console.log(`Created directory: ${applied.rawDataFolder}`);
          console.log("Database tables created.");

          console.log("\n  Setup complete.");
          suggest(
            {
              command: "sec load download ciks",
              why: "the company list, so a name or ticker resolves (8 MB, ~30s)",
            },
            { command: "sec get AAPL", why: "one company end to end" },
            { command: "sec status", why: "what is loaded, any time" }
          );
        } finally {
          prompter.close();
        }
      });
    });
}
