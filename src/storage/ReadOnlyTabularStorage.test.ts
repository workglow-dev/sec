/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import { InMemoryTabularStorage } from "workglow";
import { CikNamePrimaryKeyNames, CikNameSchema } from "./entity/CikNameSchema";
import { ReadOnlyTabularStorage } from "./ReadOnlyTabularStorage";

describe("ReadOnlyTabularStorage", () => {
  it("putByUniqueKey writes nothing and reports an overwrite", async () => {
    const inner = new InMemoryTabularStorage(CikNameSchema, CikNamePrimaryKeyNames, []);
    await inner.put({ cik: 1, name: "Before" });
    const readOnly = new ReadOnlyTabularStorage(inner);

    const result = await readOnly.putByUniqueKey({ cik: 1, name: "After" }, ["cik"]);

    expect(result).toEqual({ entity: { cik: 1, name: "After" }, inserted: false });
    expect(await inner.get({ cik: 1 })).toEqual({ cik: 1, name: "Before" });
    expect(await readOnly.size()).toBe(1);
  });
});
