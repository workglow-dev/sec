import { beforeEach, describe, expect, it } from "vitest";
import { globalServiceRegistry } from "workglow";
import { resetDependencyInjectionsForTesting } from "../../config/TestingDI";
import {
  ADV_ADVISER_REPOSITORY_TOKEN,
  type AdvAdviser,
  type AdvAdviserRepositoryStorage,
} from "../../storage/adv/AdvAdviserSchema";
import { getPipelineStatus, type PipelineStage } from "./PipelineStatus";

function adviser(snapshot: string, crd: string): AdvAdviser {
  return {
    snapshot,
    crd_number: crd,
    sec_file_number: null,
    legal_name: `Adviser ${crd}`,
    primary_business_name: null,
    is_era: false,
    main_office_city: null,
    main_office_state: null,
    main_office_country: null,
    regulatory_aum: null,
    filing_id: null,
    date_submitted: null,
  };
}

async function seedAdvisers(rows: readonly AdvAdviser[]): Promise<void> {
  const repo = globalServiceRegistry.get(ADV_ADVISER_REPOSITORY_TOKEN);
  for (const row of rows) await repo.put(row);
}

/** The advisers row, found by id rather than by position. */
function adviserStage(stages: readonly PipelineStage[]): PipelineStage {
  const stage = stages.find((s) => s.id === "advisers");
  if (stage === undefined) throw new Error("no advisers stage");
  return stage;
}

/**
 * Rebinds the adviser repository behind a partial override: the returned `get`
 * answers for the members it cares about, everything else falls through to the
 * real storage.
 *
 * Call this BEFORE seeding. Replacing a registered instance disposes the one it
 * replaces, so an override installed afterwards delegates to a storage the
 * container has just emptied.
 */
function rebindAdvisers(
  override: (inner: AdvAdviserRepositoryStorage, prop: string | symbol) => unknown
): void {
  const inner = globalServiceRegistry.get(ADV_ADVISER_REPOSITORY_TOKEN);
  const proxy = new Proxy(inner, {
    get(target, prop) {
      const overridden = override(target, prop);
      if (overridden !== undefined) return overridden;
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  globalServiceRegistry.registerInstance(ADV_ADVISER_REPOSITORY_TOKEN, proxy);
}

interface AdviserReads {
  readonly getAll: unknown[];
  streamed: boolean;
}

/**
 * Records how the advisers row read its repository: the `getAll` options it
 * asked for, and whether anything reached for the row-at-a-time iterators.
 */
function watchAdviserReads(): AdviserReads {
  const seen: AdviserReads = { getAll: [], streamed: false };
  rebindAdvisers((inner, prop) => {
    if (prop === "records" || prop === "pages") {
      seen.streamed = true;
      return undefined;
    }
    if (prop !== "getAll") return undefined;
    return async (options?: unknown) => {
      seen.getAll.push(options);
      return await inner.getAll(options as Parameters<typeof inner.getAll>[0]);
    };
  });
  return seen;
}

describe("getPipelineStatus advisers row", () => {
  beforeEach(() => {
    resetDependencyInjectionsForTesting();
  });

  it("says none when no adviser has been loaded", async () => {
    const { stages } = await getPipelineStatus();
    const stage = adviserStage(stages);
    expect(stage.summary).toBe("none");
    expect(stage.empty).toBe(true);
  });

  it("names the newest snapshot held, not the last one written", async () => {
    await seedAdvisers([
      adviser("2026-06", "1001"),
      adviser("2025-12", "1001"),
      adviser("2026-03", "1002"),
    ]);

    const { stages } = await getPipelineStatus();
    expect(adviserStage(stages).summary).toBe("3 (2026-06)");
  });

  it("reads one ordered row instead of streaming the table", async () => {
    const reads = watchAdviserReads();
    await seedAdvisers([adviser("2026-06", "1001"), adviser("2025-12", "1002")]);

    const { stages } = await getPipelineStatus();

    expect(adviserStage(stages).summary).toBe("2 (2026-06)");
    expect(reads.streamed).toBe(false);
    expect(reads.getAll).toEqual([
      { orderBy: [{ column: "snapshot", direction: "DESC" }], limit: 1 },
    ]);
  });

  it("keeps the count when the snapshot read finds no relation", async () => {
    rebindAdvisers((_inner, prop) => {
      if (prop !== "getAll") return undefined;
      return async (): Promise<never> => {
        throw new Error("SQLITE_ERROR: no such table: adv_adviser");
      };
    });
    await seedAdvisers([adviser("2026-06", "1001")]);

    const { stages } = await getPipelineStatus();
    expect(adviserStage(stages).summary).toBe("1");
  });
});
