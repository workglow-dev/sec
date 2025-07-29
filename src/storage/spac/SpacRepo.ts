//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { globalServiceRegistry } from "@podley/util";
import {
  SpacEntity,
  SPAC_ENTITY_REPOSITORY_TOKEN,
  SpacEntityRepositoryStorage,
  SpacEntityStateType,
} from "./SpacEntitySchema";
import {
  SpacEvent,
  SPAC_EVENT_REPOSITORY_TOKEN,
  SpacEventRepositoryStorage,
} from "./SpacEventSchema";
import {
  SPAC_PERSON_REPOSITORY_TOKEN,
  SpacPerson,
  SpacPersonRepositoryStorage,
} from "./SpacPersonSchema";
import {
  SpacPersonHistory,
  SPAC_PERSON_HISTORY_REPOSITORY_TOKEN,
  SpacPersonHistoryRepositoryStorage,
} from "./SpacPersonHistorySchema";
import {
  SpacRelationship,
  SPAC_RELATIONSHIP_REPOSITORY_TOKEN,
  SpacRelationshipRepositoryStorage,
} from "./SpacRelationshipSchema";
import {
  SPAC_SPONSOR_REPOSITORY_TOKEN,
  SpacSponsor,
  SpacSponsorRepositoryStorage,
} from "./SpacSponsorSchema";
import {
  SpacTargetHistory,
  SPAC_TARGET_HISTORY_REPOSITORY_TOKEN,
  SpacTargetHistoryRepositoryStorage,
} from "./SpacTargetHistorySchema";
import {
  SPAC_TRANSACTION_REPOSITORY_TOKEN,
  SpacTransaction,
  SpacTransactionRepositoryStorage,
} from "./SpacTransactionSchema";

interface SpacRepoOptions {
  spacRepository?: SpacEntityRepositoryStorage;
  spacEventRepository?: SpacEventRepositoryStorage;
  spacPersonRepository?: SpacPersonRepositoryStorage;
  spacPersonHistoryRepository?: SpacPersonHistoryRepositoryStorage;
  spacRelationshipRepository?: SpacRelationshipRepositoryStorage;
  spacSponsorRepository?: SpacSponsorRepositoryStorage;
  spacTargetHistoryRepository?: SpacTargetHistoryRepositoryStorage;
  spacTransactionRepository?: SpacTransactionRepositoryStorage;
}

/**
 * SPAC repository - manages SPACs and all related entities
 */
export class SpacRepo implements SpacRepoOptions {
  readonly spacRepository: SpacEntityRepositoryStorage;
  readonly spacEventRepository: SpacEventRepositoryStorage;
  readonly spacPersonRepository: SpacPersonRepositoryStorage;
  readonly spacPersonHistoryRepository: SpacPersonHistoryRepositoryStorage;
  readonly spacRelationshipRepository: SpacRelationshipRepositoryStorage;
  readonly spacSponsorRepository: SpacSponsorRepositoryStorage;
  readonly spacTargetHistoryRepository: SpacTargetHistoryRepositoryStorage;
  readonly spacTransactionRepository: SpacTransactionRepositoryStorage;

  constructor(options: SpacRepoOptions = {}) {
    this.spacRepository =
      options.spacRepository ?? globalServiceRegistry.get(SPAC_ENTITY_REPOSITORY_TOKEN);
    this.spacEventRepository =
      options.spacEventRepository ?? globalServiceRegistry.get(SPAC_EVENT_REPOSITORY_TOKEN);
    this.spacPersonRepository =
      options.spacPersonRepository ?? globalServiceRegistry.get(SPAC_PERSON_REPOSITORY_TOKEN);
    this.spacPersonHistoryRepository =
      options.spacPersonHistoryRepository ??
      globalServiceRegistry.get(SPAC_PERSON_HISTORY_REPOSITORY_TOKEN);
    this.spacRelationshipRepository =
      options.spacRelationshipRepository ??
      globalServiceRegistry.get(SPAC_RELATIONSHIP_REPOSITORY_TOKEN);
    this.spacSponsorRepository =
      options.spacSponsorRepository ?? globalServiceRegistry.get(SPAC_SPONSOR_REPOSITORY_TOKEN);
    this.spacTargetHistoryRepository =
      options.spacTargetHistoryRepository ??
      globalServiceRegistry.get(SPAC_TARGET_HISTORY_REPOSITORY_TOKEN);
    this.spacTransactionRepository =
      options.spacTransactionRepository ??
      globalServiceRegistry.get(SPAC_TRANSACTION_REPOSITORY_TOKEN);
  }

  // ================================
  // SPAC Entity Methods
  // ================================

  async getSpac(cik: number): Promise<SpacEntity | undefined> {
    return await this.spacRepository.get({ cik });
  }

  async saveSpac(spac: SpacEntity): Promise<void> {
    await this.spacRepository.put(spac);
  }

  async updateSpacState(
    cik: number,
    newState: SpacEntityStateType
  ): Promise<SpacEntity | undefined> {
    const spac = await this.getSpac(cik);
    if (!spac) return undefined;

    spac.current_state = newState;
    await this.saveSpac(spac);
    return spac;
  }

  async getSpacsByState(state: SpacEntityStateType): Promise<SpacEntity[]> {
    return (await this.spacRepository.search({ current_state: state })) || [];
  }

  // ================================
  // Event Methods
  // ================================

  async addEvent(event: SpacEvent): Promise<void> {
    await this.spacEventRepository.put(event);
  }

  async getSpacEvents(spacId: string): Promise<SpacEvent[]> {
    return (await this.spacEventRepository.search({ spac_id: spacId })) || [];
  }

  async getActiveEvents(spacId: string): Promise<SpacEvent[]> {
    return (
      (await this.spacEventRepository.search({
        spac_id: spacId,
        event_status: "active",
      })) || []
    );
  }

  // ================================
  // Person Methods
  // ================================

  async addPerson(person: SpacPerson): Promise<void> {
    await this.spacPersonRepository.put(person);
  }

  async getPerson(personId: string): Promise<SpacPerson | undefined> {
    return await this.spacPersonRepository.get({ person_id: personId });
  }

  async addPersonHistory(history: SpacPersonHistory): Promise<void> {
    await this.spacPersonHistoryRepository.put(history);
  }

  async getSpacPeopleHistory(spacId: string): Promise<SpacPersonHistory[]> {
    return (await this.spacPersonHistoryRepository.search({ spac_id: spacId })) || [];
  }

  async getActivePeople(spacId: string): Promise<SpacPersonHistory[]> {
    return (
      (await this.spacPersonHistoryRepository.search({
        spac_id: spacId,
        status: "active",
      })) || []
    );
  }

  // ================================
  // Relationship Methods
  // ================================

  async addRelationship(relationship: SpacRelationship): Promise<void> {
    await this.spacRelationshipRepository.put(relationship);
  }

  async getSpacRelationships(spacId: string): Promise<SpacRelationship[]> {
    return (await this.spacRelationshipRepository.search({ spac_id: spacId })) || [];
  }

  async getActiveRelationships(spacId: string): Promise<SpacRelationship[]> {
    return (
      (await this.spacRelationshipRepository.search({
        spac_id: spacId,
        status: "active",
      })) || []
    );
  }

  // ================================
  // Sponsor Methods
  // ================================

  async addSponsor(sponsor: SpacSponsor): Promise<void> {
    await this.spacSponsorRepository.put(sponsor);
  }

  async getSpacSponsors(spacId: string): Promise<SpacSponsor[]> {
    return (await this.spacSponsorRepository.search({ spac_id: spacId })) || [];
  }

  // ================================
  // Target History Methods
  // ================================

  async addTargetHistory(target: SpacTargetHistory): Promise<void> {
    await this.spacTargetHistoryRepository.put(target);
  }

  async getSpacTargetHistory(spacId: string): Promise<SpacTargetHistory[]> {
    return (await this.spacTargetHistoryRepository.search({ spac_id: spacId })) || [];
  }

  async getCurrentTarget(spacId: string): Promise<SpacTargetHistory | undefined> {
    const targets = await this.spacTargetHistoryRepository.search({
      spac_id: spacId,
      status: "da_signed",
    });
    return targets?.[0];
  }

  // ================================
  // Transaction Methods
  // ================================

  async recordTransaction(transaction: SpacTransaction): Promise<void> {
    await this.spacTransactionRepository.put(transaction);
  }

  async getSpacTransactions(spacId: string): Promise<SpacTransaction[]> {
    return (await this.spacTransactionRepository.search({ spac_id: spacId })) || [];
  }

  // ================================
  // Complex Queries
  // ================================

  async getSpacWithFullDetails(cik: number): Promise<{
    spac: SpacEntity | undefined;
    events: SpacEvent[];
    peopleHistory: SpacPersonHistory[];
    relationships: SpacRelationship[];
    sponsors: SpacSponsor[];
    targetHistory: SpacTargetHistory[];
    transactions: SpacTransaction[];
  }> {
    const spac = await this.getSpac(cik);
    if (!spac) {
      return {
        spac: undefined,
        events: [],
        peopleHistory: [],
        relationships: [],
        sponsors: [],
        targetHistory: [],
        transactions: [],
      };
    }

    // For now, we'll need to determine how to generate or fetch the spac_id
    // This would typically be a UUID that's generated when the SPAC is first created
    // For this implementation, we'll need to add a spac_id field to SpacEntity
    // or use a different identifier. For now, let's assume we can derive it from CIK
    const spacId = `spac_${spac.cik}`; // Temporary solution

    const [events, peopleHistory, relationships, sponsors, targetHistory, transactions] =
      await Promise.all([
        this.getSpacEvents(spacId),
        this.getSpacPeopleHistory(spacId),
        this.getSpacRelationships(spacId),
        this.getSpacSponsors(spacId),
        this.getSpacTargetHistory(spacId),
        this.getSpacTransactions(spacId),
      ]);

    return { spac, events, peopleHistory, relationships, sponsors, targetHistory, transactions };
  }
}
