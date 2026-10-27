/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * How the fixture commands reach EDGAR: through {@link SecFetchTask}, the same
 * queue the pipeline fetches through, so they are paced by both caps and the
 * cluster limiter, retried on a 429 with its `Retry-After`, and identified by
 * `SecUserAgent`. They used to call `fetch()` with a User-Agent default of
 * their own, which an empty `SEC_USER_AGENT` turned into no User-Agent at all.
 *
 * Nothing here is cached: `SecFetchTask` carries no output cache, and the golden
 * audit exists to see the bytes EDGAR serves now. A non-OK status the queue
 * does not retry, or one it gave up on, is thrown, never read as an empty body.
 */
import { SecFetchTask } from "../fetch/SecFetchTask";

export async function fetchEdgarText(url: string): Promise<string> {
  const { text } = await new SecFetchTask(
    { url, response_type: "text" },
    { title: `Fetch ${url}` }
  ).run();
  if (typeof text !== "string") throw new Error(`EDGAR returned no body for ${url}`);
  return text;
}

export async function fetchEdgarBytes(url: string): Promise<Uint8Array> {
  const { arraybuffer } = await new SecFetchTask(
    { url, response_type: "arraybuffer" },
    { title: `Fetch ${url}` }
  ).run();
  if (!(arraybuffer instanceof ArrayBuffer)) throw new Error(`EDGAR returned no body for ${url}`);
  return new Uint8Array(arraybuffer);
}
