/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobQueueTaskConfig, TaskOutput } from "@podley/task-graph";
import { FetchTask, FetchTaskInput, FetchTaskOutput } from "@podley/tasks";
import { Job, JobConstructorParam } from "@podley/job-queue";
import { SecJobQueueName, SecUserAgent } from "../config/Constants";
import { SecFetchJob } from "./SecFetchJob";

/**
 * SEC-specific fetch task
 */
export class SecFetchTask<
  Input extends FetchTaskInput = FetchTaskInput,
  Output extends TaskOutput = FetchTaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig
> extends FetchTask<Input, Output, Config> {
  constructor(input: FetchTaskInput = {} as FetchTaskInput, config: Config = {} as Config) {
    config.queue = SecJobQueueName;
    input.queue = SecJobQueueName;

    if (input.headers) {
      input.headers["User-Agent"] = SecUserAgent;
    } else {
      input.headers = { "User-Agent": SecUserAgent };
    }

    super(input as Input, config);
    this.jobClass = SecFetchJob as new (config: JobConstructorParam<Input, Output>) => Job<
      Input,
      Output
    >;
  }
}
