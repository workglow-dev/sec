/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runTasks } from "@podley/cli";
import type { Command } from "commander";
import { UpdateAllSubmissionsTask } from "../task/submissions/UpdateAllSubmissionsTask";

export function UpdateAllSubmissions(program: Command) {
  program
    .command("update-all-submissions")
    .description("update all submissions for all companies")
    .action(async () => {
      const task = new UpdateAllSubmissionsTask();
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error fetching or storing submissions:", error);
      }
    });
}
