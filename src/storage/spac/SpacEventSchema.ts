//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, TypeNullable } from "@podley/util";
import { Static, Type } from "@sinclair/typebox";
import { TabularRepository } from "@podley/storage";

// Define event type enum as const object (per enums rule)
export const SpacEventType = {
  // Formation
  FORMATION: "formation",
  S1_FILED: "s1_filed",
  S1_AMENDED: "s1_amended",
  S1_EFFECTIVE: "s1_effective",

  // IPO
  IPO_PRICED: "ipo_priced",
  IPO_CLOSED: "ipo_closed",
  UNIT_SPLIT: "unit_split",

  // Search Phase
  LOI_SIGNED: "loi_signed",
  DA_ANNOUNCED: "da_announced",
  DA_TERMINATED: "da_terminated",

  // Extensions
  EXTENSION_PROPOSED: "extension_proposed",
  EXTENSION_APPROVED: "extension_approved",
  EXTENSION_PAYMENT: "extension_payment",

  // Merger
  MERGER_AGREEMENT_FILED: "merger_agreement_filed",
  PROXY_FILED: "proxy_filed",
  PROXY_AMENDED: "proxy_amended",
  SHAREHOLDER_VOTE: "shareholder_vote",
  REDEMPTIONS_ANNOUNCED: "redemptions_announced",
  MERGER_CLOSED: "merger_closed",

  // Liquidation
  LIQUIDATION_ANNOUNCED: "liquidation_announced",
  LIQUIDATION_COMPLETED: "liquidation_completed",

  // Management
  MANAGEMENT_CHANGE: "management_change",
  BOARD_CHANGE: "board_change",

  // Financial
  PIPE_ANNOUNCED: "pipe_announced",
  TRUST_UPDATE: "trust_update",

  // Other
  MATERIAL_AGREEMENT: "material_agreement",
  OTHER: "other",
} as const;

export type SpacEventTypeType = (typeof SpacEventType)[keyof typeof SpacEventType];

/**
 * SPAC event schema for tracking lifecycle events
 */
export const SpacEventSchema = Type.Object({
  event_id: Type.String({
    format: "uuid",
    description: "Unique identifier for the event",
  }),
  spac_id: Type.String({
    format: "uuid",
    description: "Reference to the SPAC",
  }),
  event_type: Type.String({
    description: "Type of event",
    pattern: Object.values(SpacEventType).join("|"),
  }),
  event_date: Type.String({
    format: "date-time",
    description: "Date when the event occurred",
  }),
  event_status: Type.String({
    description: "Status of the event",
    enum: ["active", "cancelled", "superseded", "completed"],
  }),

  // Event-specific data stored as JSON
  event_data: Type.Object(
    {
      // For DA events
      target_company: TypeNullable(
        Type.Object({
          name: Type.String({ maxLength: 255 }),
          cik: TypeNullable(Type.String({ maxLength: 10 })),
          industry: Type.String({ maxLength: 255 }),
          announcement_date: Type.String({ format: "date" }),
          termination_date: TypeNullable(Type.String({ format: "date" })),
          termination_reason: TypeNullable(Type.String({ maxLength: 500 })),
        })
      ),

      // For filing events
      filing: TypeNullable(
        Type.Object({
          form_type: Type.String({ maxLength: 20 }),
          accession_number: Type.String({ maxLength: 20 }),
          filing_date: Type.String({ format: "date" }),
        })
      ),

      // For vote events
      vote: TypeNullable(
        Type.Object({
          vote_type: Type.String({ maxLength: 50 }),
          results: Type.Object({
            for: Type.Number(),
            against: Type.Number(),
            abstain: Type.Number(),
          }),
          passed: Type.Boolean(),
        })
      ),

      // Generic fields
      description: TypeNullable(Type.String({ maxLength: 1000 })),
      amount: TypeNullable(Type.Number()),
    },
    { additionalProperties: true }
  ), // Allow additional properties for flexibility

  // Relationships
  related_events: TypeNullable(
    Type.Array(Type.String({ format: "uuid" }), {
      description: "Links to superseded or related events",
    })
  ),

  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
});

export type SpacEvent = Static<typeof SpacEventSchema>;

export const SpacEventPrimaryKeyNames = ["event_id"] as const;
export type SpacEventRepositoryStorage = TabularRepository<
  typeof SpacEventSchema,
  typeof SpacEventPrimaryKeyNames
>;

export const SPAC_EVENT_REPOSITORY_TOKEN = createServiceToken<SpacEventRepositoryStorage>(
  "sec.storage.spacEventRepository"
);
