//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, TypeNullable } from "@podley/util";
import { Static, Type } from "@sinclair/typebox";
import { TabularRepository } from "@podley/storage";

/**
 * SPAC person history schema for tracking management and board changes over time
 */
export const SpacPersonHistorySchema = Type.Object({
  history_id: Type.String({
    format: "uuid",
    description: "Unique identifier for this history record",
  }),
  person_id: Type.String({
    format: "uuid",
    description: "Reference to the person",
  }),
  spac_id: Type.String({
    format: "uuid",
    description: "Reference to the SPAC",
  }),

  // Person details (immutable)
  name: Type.String({
    maxLength: 255,
    description: "Full name of the person",
  }),
  date_of_birth: TypeNullable(Type.String({ format: "date", description: "Date of birth" })),

  // Role information (versioned)
  role: Type.String({
    maxLength: 100,
    description: "Role category (e.g., management, board, advisor)",
  }),
  title: Type.String({
    maxLength: 255,
    description: "Official title",
  }),
  department: TypeNullable(Type.String({ maxLength: 100, description: "Department name" })),

  // Status tracking
  status: Type.String({
    description: "Current status",
    enum: ["active", "departed", "terminated"],
  }),
  effective_date: Type.String({
    format: "date",
    description: "Date this role became effective",
  }),
  end_date: TypeNullable(Type.String({ format: "date", description: "Date this role ended" })),

  // Additional context
  appointment_source: TypeNullable(
    Type.String({ maxLength: 20, description: "Filing accession number that announced this" })
  ),
  departure_reason: TypeNullable(
    Type.String({ maxLength: 500, description: "Reason for departure" })
  ),
  departure_source: TypeNullable(
    Type.String({ maxLength: 20, description: "Filing accession number that announced departure" })
  ),

  // Compensation (if disclosed) - stored as JSON
  compensation: TypeNullable(
    Type.Object({
      base_salary: TypeNullable(Type.Number()),
      bonus: TypeNullable(Type.Number()),
      equity_grants: TypeNullable(Type.Number()),
      other: TypeNullable(Type.String({ maxLength: 500 })),
    })
  ),

  // Background - stored as JSON
  biography: TypeNullable(Type.String({ maxLength: 2000 })),
  prior_experience: TypeNullable(Type.Array(Type.String({ maxLength: 500 }))),
  education: TypeNullable(Type.Array(Type.String({ maxLength: 500 }))),
  other_board_seats: TypeNullable(Type.Array(Type.String({ maxLength: 255 }))),
  prior_spac_involvement: TypeNullable(
    Type.Array(
      Type.Object({
        spac_name: Type.String({ maxLength: 255 }),
        spac_cik: Type.String({ maxLength: 10 }),
        role: Type.String({ maxLength: 100 }),
        outcome: Type.String({ enum: ["merged", "liquidated", "active"] }),
      })
    )
  ),

  // Ownership - stored as JSON
  ownership: TypeNullable(
    Type.Object({
      common_shares: TypeNullable(Type.Number()),
      founder_shares: TypeNullable(Type.Number()),
      warrants: TypeNullable(Type.Number()),
      percentage: TypeNullable(Type.Number()),
      as_of_date: TypeNullable(Type.String({ format: "date" })),
    })
  ),

  created_at: Type.String({ format: "date-time" }),
});

export type SpacPersonHistory = Static<typeof SpacPersonHistorySchema>;

export const SpacPersonHistoryPrimaryKeyNames = ["history_id"] as const;
export type SpacPersonHistoryRepositoryStorage = TabularRepository<
  typeof SpacPersonHistorySchema,
  typeof SpacPersonHistoryPrimaryKeyNames
>;

export const SPAC_PERSON_HISTORY_REPOSITORY_TOKEN =
  createServiceToken<SpacPersonHistoryRepositoryStorage>("sec.storage.spacPersonHistoryRepository");

// Helper type for current state view (not a database schema)
export type SpacCurrentPeople = {
  readonly spac_id: string;
  readonly active_people: SpacPersonHistory[];
  readonly departed_people: SpacPersonHistory[];

  // Grouped by role
  readonly management: SpacPersonHistory[];
  readonly board_members: SpacPersonHistory[];
  readonly advisors: SpacPersonHistory[];
};
