/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runWorkflow } from "@workglow/cli";
import { Workflow } from "@workglow/task-graph";
import type { Command } from "commander";
import { createDb } from "../util/db";

export function SetupDB(program: Command) {
  program
    .command("setup-db")
    .description("setup the database")
    .action(async () => {
      const workflow = new Workflow();
      workflow.pipe(function setupDb() {
        createDb();
        return { success: true };
      });
      try {
        await runWorkflow(workflow);
      } catch (error) {
        console.error("Error setting up the database:", error);
      }
    });
}
