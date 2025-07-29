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
 * SPAC person schema for tracking individuals involved in SPACs
 */
export const SpacPersonSchema = Type.Object({
  person_id: Type.String({
    format: "uuid",
    description: "Unique identifier for the person",
  }),

  // Personal details
  full_name: Type.String({
    maxLength: 255,
    description: "Full name of the person",
  }),
  date_of_birth: TypeNullable(Type.String({ format: "date", description: "Date of birth" })),

  // Identification
  cik: TypeNullable(Type.String({ maxLength: 10, description: "CIK if the person is a filer" })),

  // Contact information
  email: TypeNullable(
    Type.String({ maxLength: 255, format: "email", description: "Email address" })
  ),
  phone: TypeNullable(Type.String({ maxLength: 50, description: "Phone number" })),

  // Professional background
  current_employer: TypeNullable(Type.String({ maxLength: 255, description: "Current employer" })),
  current_title: TypeNullable(
    Type.String({ maxLength: 255, description: "Current professional title" })
  ),
  biography: TypeNullable(Type.String({ maxLength: 2000, description: "Professional biography" })),

  // Education
  education: TypeNullable(
    Type.Array(
      Type.Object({
        institution: Type.String({ maxLength: 255 }),
        degree: Type.String({ maxLength: 100 }),
        field_of_study: TypeNullable(Type.String({ maxLength: 100 })),
        graduation_year: TypeNullable(Type.Number()),
      })
    )
  ),

  // Professional certifications
  certifications: TypeNullable(Type.Array(Type.String({ maxLength: 100 }))),

  // Tracking
  first_seen_date: Type.String({
    format: "date",
    description: "Date when first seen in SPAC filings",
  }),
  last_updated_date: Type.String({
    format: "date",
    description: "Date of last update",
  }),

  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
});

export type SpacPerson = Static<typeof SpacPersonSchema>;

export const SpacPersonPrimaryKeyNames = ["person_id"] as const;
export type SpacPersonRepositoryStorage = TabularRepository<
  typeof SpacPersonSchema,
  typeof SpacPersonPrimaryKeyNames
>;

export const SPAC_PERSON_REPOSITORY_TOKEN = createServiceToken<SpacPersonRepositoryStorage>(
  "sec.storage.spacPersonRepository"
);
