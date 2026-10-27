/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EDGAR-backed {@link GoldenFixtureDeps} for {@link runGoldenFixtures}.
 *
 * Uncached on purpose: this command audits the bytes EDGAR serves *right now*,
 * so the cached `SecCachedFetchTask` path would defeat the point. It still goes
 * through the fetch queue ({@link fetchEdgarBytes}), which paces it and retries
 * a 429.
 */

import { fetchEdgarBytes } from "./edgarFixtureFetch";
import type { GoldenFixtureDeps } from "./goldenFixtures";

export function edgarGoldenFixtureDeps(
  log: (msg: string) => void = (m) => process.stderr.write(m + "\n")
): GoldenFixtureDeps {
  return { log, fetchDoc: fetchEdgarBytes };
}
