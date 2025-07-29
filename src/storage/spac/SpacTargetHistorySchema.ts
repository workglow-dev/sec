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
 * SPAC target history schema for tracking acquisition attempts
 */
export const SpacTargetHistorySchema = Type.Object({
  target_history_id: Type.String({
    format: "uuid",
    description: "Unique identifier for this target history record",
  }),
  spac_id: Type.String({
    format: "uuid",
    description: "Reference to the SPAC",
  }),

  // Target details
  company_name: Type.String({
    maxLength: 255,
    description: "Name of the target company",
  }),
  company_cik: TypeNullable(Type.String({ maxLength: 10, description: "CIK of target company" })),
  industry: Type.String({
    maxLength: 255,
    description: "Industry classification of target",
  }),
  description: Type.String({
    maxLength: 2000,
    description: "Description of the target company",
  }),

  // Deal timeline
  initial_contact_date: TypeNullable(
    Type.String({ format: "date", description: "Date of initial contact" })
  ),
  loi_date: TypeNullable(Type.String({ format: "date", description: "Letter of Intent date" })),
  da_announcement_date: Type.String({
    format: "date",
    description: "Definitive Agreement announcement date",
  }),
  termination_date: TypeNullable(
    Type.String({ format: "date", description: "Deal termination date" })
  ),

  // Deal status
  status: Type.String({
    description: "Current status of the deal",
    enum: ["loi", "da_signed", "pending_vote", "completed", "terminated"],
  }),
  termination_reason: TypeNullable(
    Type.String({ maxLength: 500, description: "Reason for termination" })
  ),

  // Valuation details
  enterprise_value: TypeNullable(Type.Number({ description: "Enterprise value in dollars" })),
  equity_value: TypeNullable(Type.Number({ description: "Equity value in dollars" })),
  implied_share_price: TypeNullable(Type.Number({ description: "Implied share price" })),
  valuation_methodology: TypeNullable(
    Type.String({ maxLength: 500, description: "Valuation methodology used" })
  ),

  // Deal structure
  cash_consideration: TypeNullable(Type.Number({ description: "Cash portion of consideration" })),
  stock_consideration: TypeNullable(Type.Number({ description: "Stock portion of consideration" })),
  earnout_terms: TypeNullable(
    Type.String({ maxLength: 1000, description: "Earnout structure details" })
  ),

  // PIPE details (if applicable) - stored as JSON
  pipe_amount: TypeNullable(Type.Number({ description: "Total PIPE amount" })),
  pipe_investors: TypeNullable(
    Type.Array(
      Type.Object({
        investor_name: Type.String({ maxLength: 255 }),
        amount: Type.Number(),
        type: Type.String({ maxLength: 50 }), // Strategic, Financial, etc.
      })
    )
  ),

  created_at: Type.String({ format: "date-time" }),
});

export type SpacTargetHistory = Static<typeof SpacTargetHistorySchema>;

export const SpacTargetHistoryPrimaryKeyNames = ["target_history_id"] as const;
export type SpacTargetHistoryRepositoryStorage = TabularRepository<
  typeof SpacTargetHistorySchema,
  typeof SpacTargetHistoryPrimaryKeyNames
>;

export const SPAC_TARGET_HISTORY_REPOSITORY_TOKEN =
  createServiceToken<SpacTargetHistoryRepositoryStorage>("sec.storage.spacTargetHistoryRepository");
