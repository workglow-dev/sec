//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

// Entity Schema
export {
  SpacEntitySchema,
  SpacEntityState,
  type SpacEntity,
  type SpacEntityStateType,
  SpacEntityPrimaryKeyNames,
  type SpacEntityRepositoryStorage,
  SPAC_ENTITY_REPOSITORY_TOKEN,
} from "./SpacEntitySchema";

// Event Schema
export {
  SpacEventSchema,
  SpacEventType,
  type SpacEvent,
  type SpacEventTypeType,
  SpacEventPrimaryKeyNames,
  type SpacEventRepositoryStorage,
  SPAC_EVENT_REPOSITORY_TOKEN,
} from "./SpacEventSchema";

// Person Schema
export {
  SpacPersonSchema,
  type SpacPerson,
  SpacPersonPrimaryKeyNames,
  type SpacPersonRepositoryStorage,
  SPAC_PERSON_REPOSITORY_TOKEN,
} from "./SpacPersonSchema";

// Person History Schema
export {
  SpacPersonHistorySchema,
  type SpacPersonHistory,
  type SpacCurrentPeople,
  SpacPersonHistoryPrimaryKeyNames,
  type SpacPersonHistoryRepositoryStorage,
  SPAC_PERSON_HISTORY_REPOSITORY_TOKEN,
} from "./SpacPersonHistorySchema";

// Relationship Schema
export {
  SpacRelationshipSchema,
  type SpacRelationship,
  SpacRelationshipPrimaryKeyNames,
  type SpacRelationshipRepositoryStorage,
  SPAC_RELATIONSHIP_REPOSITORY_TOKEN,
} from "./SpacRelationshipSchema";

// Sponsor Schema
export {
  SpacSponsorSchema,
  type SpacSponsor,
  SpacSponsorPrimaryKeyNames,
  type SpacSponsorRepositoryStorage,
  SPAC_SPONSOR_REPOSITORY_TOKEN,
} from "./SpacSponsorSchema";

// Target History Schema
export {
  SpacTargetHistorySchema,
  type SpacTargetHistory,
  SpacTargetHistoryPrimaryKeyNames,
  type SpacTargetHistoryRepositoryStorage,
  SPAC_TARGET_HISTORY_REPOSITORY_TOKEN,
} from "./SpacTargetHistorySchema";

// Transaction Schema
export {
  SpacTransactionSchema,
  TransactionType,
  type SpacTransaction,
  type TransactionTypeType,
  SpacTransactionPrimaryKeyNames,
  type SpacTransactionRepositoryStorage,
  SPAC_TRANSACTION_REPOSITORY_TOKEN,
} from "./SpacTransactionSchema";

// State Machine
export {
  StateTransitionForms,
  type StateTransitionFormType,
  RelevantEightKItems,
  STATE_TRANSITIONS,
  getValidNextStates,
  isValidTransition,
  findTransition,
} from "./SpacStateMachine";

// Repository Implementation
export { SpacRepo } from "./SpacRepo";
