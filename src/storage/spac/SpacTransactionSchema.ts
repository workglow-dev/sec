//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TabularRepository } from "@podley/storage";
import { createServiceToken, TypeNullable } from "@podley/util";
import { Static, Type } from "@sinclair/typebox";

export const TransactionType = {
  IPO: "ipo",
  EXTENSION_PAYMENT: "extension_payment",
  PIPE: "pipe",
  REDEMPTION: "redemption",
  TRUST_INCOME: "trust_income",
  EXPENSE: "expense",
  OTHER: "other",
} as const;

export type TransactionTypeType = (typeof TransactionType)[keyof typeof TransactionType];

/**
 * SPAC transaction schema for tracking financial events
 */
export const SpacTransactionSchema = Type.Object({
  transaction_id: Type.String({
    format: "uuid",
    description: "Unique identifier for the transaction",
  }),
  spac_id: Type.String({
    format: "uuid",
    description: "Reference to the SPAC",
  }),

  transaction_type: Type.String({
    description: "Type of transaction",
    pattern: Object.values(TransactionType).join("|"),
  }),
  transaction_date: Type.String({
    format: "date",
    description: "Date of the transaction",
  }),

  amount: Type.Number({
    description: "Transaction amount",
  }),

  // Additional details stored as JSON
  details: TypeNullable(
    Type.Any({
      description: "Additional transaction details as JSON",
    })
  ),

  // Source
  source_filing: TypeNullable(
    Type.String({
      maxLength: 20,
      description: "Filing accession number that reported this transaction",
    })
  ),

  created_at: Type.String({ format: "date-time" }),
});

export type SpacTransaction = Static<typeof SpacTransactionSchema>;

export const SpacTransactionPrimaryKeyNames = ["transaction_id"] as const;
export type SpacTransactionRepositoryStorage = TabularRepository<
  typeof SpacTransactionSchema,
  typeof SpacTransactionPrimaryKeyNames
>;

export const SPAC_TRANSACTION_REPOSITORY_TOKEN =
  createServiceToken<SpacTransactionRepositoryStorage>("sec.storage.spacTransactionRepository");
