//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, TypeNullable } from "@podley/util";
import { Static, Type } from "@sinclair/typebox";
import { TypeSecCik } from "../../sec/submissions/EnititySubmissionSchema";
import { TabularRepository } from "@podley/storage";

// Define state enum as const object (per enums rule)
export const SpacEntityState = {
  REGISTRATION_SUBMITTED: "registration_submitted",
  REGISTRATION_AMENDED: "registration_amended",
  REGISTRATION_WITHDRAWN: "registration_withdrawn",
  REGISTRATION_EFFECTIVE: "registration_effective",
  LISTING_REGISTRATION_FILED: "listing_registration_filed",
  LISTING_APPROVED: "listing_approved",
  IPO_PRICING_FILED: "ipo_pricing_filed",
  IPO_PRICING_EFFECTIVE: "ipo_pricing_effective",
  IPO_COMPLETED: "ipo_completed",
  SEARCH_PHASE: "search_phase",
  EXTENSION_PROXY_FILED: "extension_proxy_filed",
  EXTENSION_AMENDED: "extension_amended",
  EXTENSION_EFFECTIVE: "extension_effective",
  DESPAC_REGISTRATION: "despac_registration",
  DESPAC_AMENDED: "despac_amended",
  PROXY_EFFECTIVE: "proxy_effective",
  VOTE_RESULTS_FILED: "vote_results_filed",
  PROXY_APPROVED: "proxy_approved",
  MERGER_CLOSING_FILED: "merger_closing_filed",
  OPERATING_COMPANY: "operating_company",
  LIQUIDATION_PROXY_FILED: "liquidation_proxy_filed",
  LIQUIDATION_EFFECTIVE: "liquidation_effective",
  LIQUIDATION_RESULTS_FILED: "liquidation_results_filed",
  LIQUIDATION_DELISTING_FILED: "liquidation_delisting_filed",
  LIQUIDATION_COMPLETED: "liquidation_completed",
} as const;

export type SpacEntityStateType = (typeof SpacEntityState)[keyof typeof SpacEntityState];

/**
 * SPAC entity schema for tracking lifecycle and current state
 */
export const SpacEntitySchema = Type.Object({
  cik: TypeSecCik({ description: "Central Index Key (CIK) of the SPAC" }),
  spac_name: Type.String({
    maxLength: 255,
    description: "Name of the SPAC when an aquisition company",
  }),
  target_name: Type.String({
    maxLength: 255,
    description: "Name of the SPAC target",
  }),
  current_name: Type.String({
    maxLength: 255,
    description: "Current Name of the Company",
  }),
  spac_ticker_symbols: Type.Object({
    units: TypeNullable(Type.String({ maxLength: 10, description: "Units ticker symbol" })),
    common: TypeNullable(Type.String({ maxLength: 10, description: "Common stock ticker symbol" })),
    warrants: TypeNullable(Type.String({ maxLength: 10, description: "Warrants ticker symbol" })),
    rights: TypeNullable(Type.String({ maxLength: 10, description: "Rights ticker symbol" })),
  }),
  target_ticker_symbols: Type.Object({
    units: TypeNullable(Type.String({ maxLength: 10, description: "Units ticker symbol" })),
    common: TypeNullable(Type.String({ maxLength: 10, description: "Common stock ticker symbol" })),
    warrants: TypeNullable(Type.String({ maxLength: 10, description: "Warrants ticker symbol" })),
    rights: TypeNullable(Type.String({ maxLength: 10, description: "Rights ticker symbol" })),
  }),
  current_ticker_symbols: Type.Object({
    units: TypeNullable(Type.String({ maxLength: 10, description: "Units ticker symbol" })),
    common: TypeNullable(Type.String({ maxLength: 10, description: "Common stock ticker symbol" })),
    warrants: TypeNullable(Type.String({ maxLength: 10, description: "Warrants ticker symbol" })),
    rights: TypeNullable(Type.String({ maxLength: 10, description: "Rights ticker symbol" })),
  }),

  // State Management
  current_state: Type.String({
    description: "Current state in the SPAC lifecycle",
    pattern: Object.values(SpacEntityState).join("|"),
  }),

  // Key Dates
  formation_date: TypeNullable(Type.String({ format: "date", description: "SPAC formation date" })),
  s1_filing_date: TypeNullable(Type.String({ format: "date", description: "S-1 filing date" })),
  s1_effective_date: TypeNullable(
    Type.String({ format: "date", description: "S-1 effective date" })
  ),
  ipo_pricing_date: TypeNullable(Type.String({ format: "date", description: "IPO pricing date" })),
  ipo_closing_date: TypeNullable(Type.String({ format: "date", description: "IPO closing date" })),
  unit_split_date: TypeNullable(Type.String({ format: "date", description: "Unit split date" })),
  liquidation_deadline: Type.String({
    format: "date",
    description: "Deadline for completing business combination",
  }),

  // Financial Data
  ipo_proceeds: TypeNullable(Type.Number({ description: "Total IPO proceeds raised" })),
  trust_value_current: TypeNullable(Type.Number({ description: "Current trust account value" })),
  trust_value_per_share: TypeNullable(Type.Number({ description: "Trust value per share" })),
});

export type SpacEntity = Static<typeof SpacEntitySchema>;

export const SpacEntityPrimaryKeyNames = ["cik"] as const;
export type SpacEntityRepositoryStorage = TabularRepository<
  typeof SpacEntitySchema,
  typeof SpacEntityPrimaryKeyNames
>;

export const SPAC_ENTITY_REPOSITORY_TOKEN = createServiceToken<SpacEntityRepositoryStorage>(
  "sec.storage.spacRepository"
);
