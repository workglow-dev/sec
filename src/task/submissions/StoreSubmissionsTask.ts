/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IExecuteContext,
  Task,
  TaskAbortedError,
  TaskError,
  Workflow,
  parallel,
} from "@workglow/task-graph";
import { TObject, Type } from "typebox";
import { todayYYYYdMMdDD } from "../../util/dataCleaningUtils";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { StoreSubmissionContactInfoTask } from "./StoreSubmissionContactInfoTask";
import { StoreSubmissionEntityTask } from "./StoreSubmissionEntityTask";
import { StoreSubmissionFilingsTask } from "./StoreSubmissionFilingsTask";
import { StoreSubmissionSicTask } from "./StoreSubmissionSicTask";
import { StoreSubmissionTickersTask } from "./StoreSubmissionTickersTask";
import { query_run } from "../../util/db";

export type StoreSubmissionsTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionsTaskOutput = {
  success: boolean;
};

export class StoreSubmissionsTask extends Task<
  StoreSubmissionsTaskInput,
  StoreSubmissionsTaskOutput
> {
  static readonly type = "StoreSubmissionsTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  static inputSchema() {
    return FetchSubmissionsTask.outputSchema();
  }

  static outputSchema() {
    return Type.Object({
      success: Type.Boolean({ title: "Successful" }),
    });
  }

  async execute(
    input: StoreSubmissionsTaskInput,
    context: IExecuteContext
  ): Promise<StoreSubmissionsTaskOutput> {
    if (context.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (!submission) throw new TaskError("No submission data");
    const cik = submission.cik;

    const workflow = context.own(new Workflow());
    workflow.pipe(
      parallel([
        new StoreSubmissionSicTask(input),
        new StoreSubmissionEntityTask(input),
        new StoreSubmissionContactInfoTask(input),
        new StoreSubmissionTickersTask(input),
        new StoreSubmissionFilingsTask(input),
      ]),
      function updateProcessing() {
        processUpdateProcessing(cik, true);
        return { success: true };
      }
    );
    await workflow.run();
    return { success: true };
  }
}

export function processUpdateProcessing(cik: number, success: boolean): void {
  query_run(
    `INSERT OR REPLACE INTO processed_submissions(cik,last_processed,success)
      VALUES($cik,$last_processed,$success)`,
    {
      $cik: cik,
      $last_processed: todayYYYYdMMdDD(),
      $success: success,
    }
  );
}
