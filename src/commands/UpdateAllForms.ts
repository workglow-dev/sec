//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runTasks } from "@podley/cli";
import type { Command } from "commander";
import { UpdateAllFormsTask } from "../task/forms/UpdateAllFormsTask";

export function UpdateAllForms(program: Command) {
  program
    .command("update-all-forms")
    .description("update all forms for all companies")
    .argument("<form>", "the form to update, comma separated list")
    .action(async (form) => {
      const task = new UpdateAllFormsTask({ form: form.split(",") });
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error fetching or storing submissions:", error);
      }
    });
}
