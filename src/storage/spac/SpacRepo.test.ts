import { InMemoryTabularRepository } from "@podley/storage";
import { beforeEach, describe, expect, it } from "bun:test";
import { SpacRepo } from "./SpacRepo";
import {
  SpacEntitySchema,
  type SpacEntity,
  SpacEntityPrimaryKeyNames,
  type SpacEntityRepositoryStorage,
} from "./SpacEntitySchema";
import {
  SpacPersonSchema,
  type SpacPerson,
  SpacPersonPrimaryKeyNames,
  type SpacPersonRepositoryStorage,
} from "./SpacPersonSchema";
// Import other schemas...

describe("SpacRepo", () => {
  let spacRepo: SpacRepo;
  let spacStorage: SpacEntityRepositoryStorage;
  let spacPersonStorage: SpacPersonRepositoryStorage;
  // Other storages...

  beforeEach(() => {
    // Create in-memory repositories with appropriate indexes
    spacStorage = new InMemoryTabularRepository(SpacEntitySchema, SpacEntityPrimaryKeyNames, [
      ["cik"],
      ["current_state"],
      ["ipo_closing_date"],
    ]);

    spacPersonStorage = new InMemoryTabularRepository(SpacPersonSchema, SpacPersonPrimaryKeyNames, [
      ["spac_id"],
      ["spac_id", "status"],
      ["role"],
    ]);

    // Initialize other storages...

    spacRepo = new SpacRepo({
      spacRepository: spacStorage,
      spacPersonRepository: spacPersonStorage,
      // Other repositories...
    });
  });

  // Test cases...
});
