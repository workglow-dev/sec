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
 * SPAC relationship schema for tracking sponsors, underwriters, and other advisors
 */
export const SpacRelationshipSchema = Type.Object({
  relationship_id: Type.String({
    format: "uuid",
    description: "Unique identifier for this relationship",
  }),
  spac_id: Type.String({
    format: "uuid",
    description: "Reference to the SPAC",
  }),
  relationship_type: Type.String({
    description: "Type of relationship",
    enum: ["sponsor", "underwriter", "legal_counsel", "auditor", "other_advisor"],
  }),

  // Entity information
  entity_name: Type.String({
    maxLength: 255,
    description: "Name of the related entity",
  }),
  entity_type: Type.String({
    maxLength: 100,
    description: "Type of entity (PE Firm, Investment Bank, Law Firm, etc.)",
  }),

  // Relationship details
  role_description: Type.String({
    maxLength: 500,
    description: "Description of the role",
  }),
  status: Type.String({
    description: "Current status of the relationship",
    enum: ["active", "terminated", "completed"],
  }),
  start_date: Type.String({
    format: "date",
    description: "Date relationship began",
  }),
  end_date: TypeNullable(Type.String({ format: "date", description: "Date relationship ended" })),

  // Financial terms (if applicable) - stored as JSON
  financial_terms: TypeNullable(
    Type.Object({
      fee_amount: TypeNullable(Type.Number()),
      fee_percentage: TypeNullable(Type.Number()),
      success_fee: TypeNullable(Type.Number()),
      expense_reimbursement: TypeNullable(Type.Number()),
      deferred_fees: TypeNullable(Type.Boolean()),
    })
  ),

  // For underwriters - stored as JSON
  underwriter_details: TypeNullable(
    Type.Object({
      lead_underwriter: Type.Boolean(),
      allocation_percentage: TypeNullable(Type.Number()),
      overallotment: TypeNullable(Type.Boolean()),
    })
  ),

  // Contact information - stored as JSON
  contacts: TypeNullable(
    Type.Array(
      Type.Object({
        name: Type.String({ maxLength: 255 }),
        title: Type.String({ maxLength: 255 }),
        email: TypeNullable(Type.String({ maxLength: 255 })),
        phone: TypeNullable(Type.String({ maxLength: 50 })),
      })
    )
  ),

  // Source
  announcement_source: TypeNullable(
    Type.String({
      maxLength: 20,
      description: "Filing accession number that established relationship",
    })
  ),
  termination_source: TypeNullable(
    Type.String({ maxLength: 20, description: "Filing accession number that ended relationship" })
  ),

  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
});

export type SpacRelationship = Static<typeof SpacRelationshipSchema>;

export const SpacRelationshipPrimaryKeyNames = ["relationship_id"] as const;
export type SpacRelationshipRepositoryStorage = TabularRepository<
  typeof SpacRelationshipSchema,
  typeof SpacRelationshipPrimaryKeyNames
>;

export const SPAC_RELATIONSHIP_REPOSITORY_TOKEN =
  createServiceToken<SpacRelationshipRepositoryStorage>("sec.storage.spacRelationshipRepository");
