/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runTasks } from "@workglow/cli";
import type { Command } from "commander";
import { UpdateAllCompanyFactsTask } from "../task/facts/UpdateAllCompanyFactsTask";

export function UpdateAllCompanyFacts(program: Command) {
  program
    .command("update-all-company-facts")
    .description("update all facts for all companies")
    .action(async () => {
      const task = new UpdateAllCompanyFactsTask();
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error fetching or storing company facts:", error);
      }
    });
}
