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
 * SPAC sponsor schema for tracking sponsor entities and their details
 */
export const SpacSponsorSchema = Type.Object({
  sponsor_id: Type.String({
    format: "uuid",
    description: "Unique identifier for the sponsor",
  }),
  spac_id: Type.String({
    format: "uuid",
    description: "Reference to the SPAC",
  }),

  // Sponsor entity details
  sponsor_name: Type.String({
    maxLength: 255,
    description: "Name of the sponsor entity",
  }),
  sponsor_type: Type.String({
    maxLength: 100,
    description: "Type of sponsor (PE Firm, Family Office, etc.)",
  }),
  formation_date: TypeNullable(
    Type.String({ format: "date", description: "Sponsor formation date" })
  ),

  // Sponsor principals
  principals: TypeNullable(
    Type.Array(
      Type.Object({
        name: Type.String({ maxLength: 255 }),
        title: Type.String({ maxLength: 255 }),
        ownership_percentage: TypeNullable(Type.Number()),
      })
    )
  ),

  // Financial details
  initial_capital_contribution: Type.Number({
    description: "Initial capital contribution amount",
  }),
  founder_shares: Type.Number({
    description: "Number of founder shares",
  }),
  founder_share_percentage: Type.Number({
    description: "Percentage of total shares",
  }),
  private_placement_units: TypeNullable(
    Type.Number({
      description: "Number of private placement units",
    })
  ),
  private_placement_amount: TypeNullable(
    Type.Number({
      description: "Private placement investment amount",
    })
  ),

  // Lock-up provisions
  lockup_provisions: TypeNullable(
    Type.Object({
      lockup_period_months: Type.Number(),
      early_release_conditions: TypeNullable(Type.String({ maxLength: 1000 })),
      additional_restrictions: TypeNullable(Type.String({ maxLength: 1000 })),
    })
  ),

  // Track record
  prior_spacs: TypeNullable(
    Type.Array(
      Type.Object({
        spac_name: Type.String({ maxLength: 255 }),
        spac_cik: Type.String({ maxLength: 10 }),
        ipo_date: Type.String({ format: "date" }),
        outcome: Type.String({ enum: ["merged", "liquidated", "active"] }),
        target_name: TypeNullable(Type.String({ maxLength: 255 })),
        merger_date: TypeNullable(Type.String({ format: "date" })),
      })
    )
  ),

  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
});

export type SpacSponsor = Static<typeof SpacSponsorSchema>;

export const SpacSponsorPrimaryKeyNames = ["sponsor_id"] as const;
export type SpacSponsorRepositoryStorage = TabularRepository<
  typeof SpacSponsorSchema,
  typeof SpacSponsorPrimaryKeyNames
>;

export const SPAC_SPONSOR_REPOSITORY_TOKEN = createServiceToken<SpacSponsorRepositoryStorage>(
  "sec.storage.spacSponsorRepository"
);
