/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runTasks } from "@workglow/cli";
import type { Command } from "commander";
import { ProcessAccessionDocFormTask } from "../task/forms/ProcessAccessionDocFormTask";

export function Doc(program: Command) {
  program
    .command("doc")
    .description("process the accession doc")
    .argument("<docid>", "accession number")
    .argument("[fileName]", "file name, if not the default")
    .action(async (docid: string, fileName?: string) => {
      const wf = new ProcessAccessionDocFormTask({
        accessionNumber: docid,
        fileName: fileName,
      });
      try {
        await runTasks(wf);
      } catch (error) {
        console.error("Error running accession doc workflow:", error);
      }
    });
}
