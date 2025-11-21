/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IExecuteContext, Task } from "@podley/task-graph";
import { sleep } from "@podley/util";
import { TObject, Type } from "typebox";
import { query_all } from "../../util/db";
import { ProcessAccessionDocFormTask } from "./ProcessAccessionDocFormTask";

export type UpdateAllFormsTaskInput = {
  form: string[];
};

export type UpdateAllFormsTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company forms of a given type
 */
export class UpdateAllFormsTask extends Task<UpdateAllFormsTaskInput, UpdateAllFormsTaskOutput> {
  static readonly type = "UpdateAllFormsTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  public static outputSchema() {
    return Type.Object({
      success: Type.Boolean(),
    });
  }

  async execute(
    input: UpdateAllFormsTaskInput,
    context: IExecuteContext
  ): Promise<UpdateAllFormsTaskOutput> {
    const missingForms = query_all<{
      cik: string;
      form: string;
      accession_number: string;
    }>(`
      SELECT filings.cik, filings.form, filings.accession_number FROM filings left join processed_filings on filings.cik = processed_filings.cik and filings.form = processed_filings.form
        WHERE processed_filings.accession_number IS NULL
        AND filings.form IN (${input.form.map((f) => `'${f}'`).join(",")})`);

    const needsInitialProcessingCount = missingForms?.length ?? 0;

    if (needsInitialProcessingCount) {
      const BATCH_SIZE = 10;
      for (let i = 0; i < missingForms.length; i += BATCH_SIZE) {
        const batch = missingForms.slice(i, i + BATCH_SIZE);
        const promises: Promise<any>[] = [];
        for (let j = 0; j < batch.length; j++) {
          const task = context.own(
            new ProcessAccessionDocFormTask({
              accessionNumber: batch[j].accession_number,
              cik: parseInt(batch[j].cik),
              form: batch[j].form,
            })
          );
          promises.push(task.run());
        }
        await Promise.all(promises);
        await sleep(0);
        context.updateProgress(
          Math.ceil(((i + missingForms.length) / missingForms.length) * 100),
          `Processed ${i + missingForms.length} of ${missingForms.length} forms`
        );
      }
    }
    return { success: true };
  }
}
