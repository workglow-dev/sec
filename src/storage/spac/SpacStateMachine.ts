//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SpacEntityStateType, SpacEntityState } from "./SpacEntitySchema";

/**
 * Form types that trigger state transitions
 */
export const StateTransitionForms = {
  S1: "S-1",
  S1A: "S-1/A",
  S1_WITHDRAWAL: "S-1 Withdrawal",
  EFFECT: "EFFECT",
  FORM_8A: "8-A",
  LISTING_NOTICE: "Listing Notice",
  FORM_424B4: "424B4",
  FORM_8K: "8-K",
  DEFM14A: "DEFM14A",
  DEFM14A_A: "DEFM14A/A",
  S4: "S-4",
  S4A: "S-4/A",
  FORM_14: "14",
  FORM_25: "25",
  FORM_10Q: "10-Q",
  FORM_10K: "10-K",
} as const;

export type StateTransitionFormType =
  (typeof StateTransitionForms)[keyof typeof StateTransitionForms];

/**
 * 8-K item codes that are relevant for state transitions
 */
export const RelevantEightKItems = {
  IPO_CLOSE: "8.01", // Other Events - used for IPO closing
  MERGER_CLOSE: "2.01", // Completion of Acquisition
  EXTENSION_VOTE: "5.07", // Submission of Matters to Vote
  LIQUIDATION_VOTE: "5.07", // Submission of Matters to Vote
  VOTE_RESULTS: "5.07", // Submission of Matters to Vote
} as const;

/**
 * State transition rules for the SPAC lifecycle
 */
interface StateTransition {
  readonly from: SpacEntityStateType;
  readonly to: SpacEntityStateType;
  readonly trigger: {
    readonly formType: StateTransitionFormType;
    readonly eightKItem?: string;
    readonly condition?: (data: any) => boolean;
  };
  readonly description: string;
}

/**
 * All valid state transitions in the SPAC lifecycle
 */
export const STATE_TRANSITIONS: readonly StateTransition[] = [
  // Formation Phase
  {
    from: SpacEntityState.REGISTRATION_SUBMITTED,
    to: SpacEntityState.REGISTRATION_AMENDED,
    trigger: { formType: StateTransitionForms.S1A },
    description: "Registration statement amended",
  },
  {
    from: SpacEntityState.REGISTRATION_SUBMITTED,
    to: SpacEntityState.REGISTRATION_WITHDRAWN,
    trigger: { formType: StateTransitionForms.S1_WITHDRAWAL },
    description: "Registration withdrawn",
  },
  {
    from: SpacEntityState.REGISTRATION_SUBMITTED,
    to: SpacEntityState.REGISTRATION_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "Registration declared effective",
  },
  {
    from: SpacEntityState.REGISTRATION_AMENDED,
    to: SpacEntityState.REGISTRATION_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "Amended registration declared effective",
  },

  // Listing Phase
  {
    from: SpacEntityState.REGISTRATION_EFFECTIVE,
    to: SpacEntityState.LISTING_REGISTRATION_FILED,
    trigger: { formType: StateTransitionForms.FORM_8A },
    description: "Exchange listing registration filed",
  },
  {
    from: SpacEntityState.LISTING_REGISTRATION_FILED,
    to: SpacEntityState.LISTING_APPROVED,
    trigger: { formType: StateTransitionForms.LISTING_NOTICE },
    description: "Exchange approves listing",
  },

  // IPO Phase
  {
    from: SpacEntityState.LISTING_APPROVED,
    to: SpacEntityState.IPO_PRICING_FILED,
    trigger: { formType: StateTransitionForms.S1A },
    description: "Final IPO terms filed",
  },
  {
    from: SpacEntityState.IPO_PRICING_FILED,
    to: SpacEntityState.IPO_PRICING_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "IPO pricing declared effective",
  },
  {
    from: SpacEntityState.IPO_PRICING_EFFECTIVE,
    to: SpacEntityState.IPO_COMPLETED,
    trigger: { formType: StateTransitionForms.FORM_424B4 },
    description: "IPO prospectus filed",
  },
  {
    from: SpacEntityState.IPO_COMPLETED,
    to: SpacEntityState.SEARCH_PHASE,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      eightKItem: RelevantEightKItems.IPO_CLOSE,
    },
    description: "IPO closing reported",
  },

  // Extension Process
  {
    from: SpacEntityState.SEARCH_PHASE,
    to: SpacEntityState.EXTENSION_PROXY_FILED,
    trigger: { formType: StateTransitionForms.DEFM14A },
    description: "Extension proxy filed",
  },
  {
    from: SpacEntityState.EXTENSION_PROXY_FILED,
    to: SpacEntityState.EXTENSION_AMENDED,
    trigger: { formType: StateTransitionForms.DEFM14A_A },
    description: "Extension proxy amended",
  },
  {
    from: SpacEntityState.EXTENSION_PROXY_FILED,
    to: SpacEntityState.EXTENSION_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "Extension proxy effective",
  },
  {
    from: SpacEntityState.EXTENSION_AMENDED,
    to: SpacEntityState.EXTENSION_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "Amended extension proxy effective",
  },
  {
    from: SpacEntityState.EXTENSION_EFFECTIVE,
    to: SpacEntityState.SEARCH_PHASE,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      eightKItem: RelevantEightKItems.EXTENSION_VOTE,
    },
    description: "Extension vote completed",
  },

  // De-SPAC Process
  {
    from: SpacEntityState.SEARCH_PHASE,
    to: SpacEntityState.DESPAC_REGISTRATION,
    trigger: { formType: StateTransitionForms.S4 },
    description: "De-SPAC registration filed",
  },
  {
    from: SpacEntityState.DESPAC_REGISTRATION,
    to: SpacEntityState.DESPAC_AMENDED,
    trigger: { formType: StateTransitionForms.S4A },
    description: "De-SPAC registration amended",
  },
  {
    from: SpacEntityState.DESPAC_REGISTRATION,
    to: SpacEntityState.PROXY_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "De-SPAC proxy effective",
  },
  {
    from: SpacEntityState.DESPAC_AMENDED,
    to: SpacEntityState.PROXY_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "Amended de-SPAC proxy effective",
  },
  {
    from: SpacEntityState.PROXY_EFFECTIVE,
    to: SpacEntityState.VOTE_RESULTS_FILED,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      eightKItem: RelevantEightKItems.VOTE_RESULTS,
    },
    description: "Shareholder vote results filed",
  },
  {
    from: SpacEntityState.VOTE_RESULTS_FILED,
    to: SpacEntityState.PROXY_APPROVED,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      condition: (data) => data.voteResult === "approved",
    },
    description: "Shareholders approve merger",
  },
  {
    from: SpacEntityState.VOTE_RESULTS_FILED,
    to: SpacEntityState.DESPAC_REGISTRATION,
    trigger: {
      formType: StateTransitionForms.S4,
      condition: (data) => data.voteResult === "rejected",
    },
    description: "Revised de-SPAC registration after failed vote",
  },
  {
    from: SpacEntityState.PROXY_APPROVED,
    to: SpacEntityState.MERGER_CLOSING_FILED,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      eightKItem: RelevantEightKItems.MERGER_CLOSE,
    },
    description: "Merger closing filed",
  },
  {
    from: SpacEntityState.MERGER_CLOSING_FILED,
    to: SpacEntityState.OPERATING_COMPANY,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      condition: () => true, // Automatic transition
    },
    description: "Transition to operating company",
  },

  // Liquidation Process
  {
    from: SpacEntityState.SEARCH_PHASE,
    to: SpacEntityState.LIQUIDATION_PROXY_FILED,
    trigger: { formType: StateTransitionForms.FORM_14 },
    description: "Liquidation proxy filed",
  },
  {
    from: SpacEntityState.LIQUIDATION_PROXY_FILED,
    to: SpacEntityState.LIQUIDATION_EFFECTIVE,
    trigger: { formType: StateTransitionForms.EFFECT },
    description: "Liquidation proxy effective",
  },
  {
    from: SpacEntityState.LIQUIDATION_EFFECTIVE,
    to: SpacEntityState.LIQUIDATION_RESULTS_FILED,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      eightKItem: RelevantEightKItems.LIQUIDATION_VOTE,
    },
    description: "Liquidation vote results filed",
  },
  {
    from: SpacEntityState.LIQUIDATION_RESULTS_FILED,
    to: SpacEntityState.LIQUIDATION_DELISTING_FILED,
    trigger: { formType: StateTransitionForms.FORM_25 },
    description: "Delisting notice filed",
  },
  {
    from: SpacEntityState.LIQUIDATION_DELISTING_FILED,
    to: SpacEntityState.LIQUIDATION_COMPLETED,
    trigger: {
      formType: StateTransitionForms.FORM_8K,
      condition: () => true, // Automatic transition
    },
    description: "SPAC liquidation completed",
  },

  // Operating Company
  {
    from: SpacEntityState.OPERATING_COMPANY,
    to: SpacEntityState.OPERATING_COMPANY,
    trigger: { formType: StateTransitionForms.FORM_10Q },
    description: "Quarterly report filed",
  },
  {
    from: SpacEntityState.OPERATING_COMPANY,
    to: SpacEntityState.OPERATING_COMPANY,
    trigger: { formType: StateTransitionForms.FORM_10K },
    description: "Annual report filed",
  },
];

/**
 * Get valid next states from a given state
 */
export function getValidNextStates(currentState: SpacEntityStateType): SpacEntityStateType[] {
  return STATE_TRANSITIONS.filter((transition) => transition.from === currentState).map(
    (transition) => transition.to
  );
}

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  fromState: SpacEntityStateType,
  toState: SpacEntityStateType,
  formType: StateTransitionFormType,
  eightKItem?: string,
  data?: any
): boolean {
  const transition = STATE_TRANSITIONS.find(
    (t) =>
      t.from === fromState &&
      t.to === toState &&
      t.trigger.formType === formType &&
      (!t.trigger.eightKItem || t.trigger.eightKItem === eightKItem)
  );

  if (!transition) {
    return false;
  }

  if (transition.trigger.condition) {
    return transition.trigger.condition(data);
  }

  return true;
}

/**
 * Get the transition that matches the given criteria
 */
export function findTransition(
  fromState: SpacEntityStateType,
  formType: StateTransitionFormType,
  eightKItem?: string,
  data?: any
): StateTransition | undefined {
  return STATE_TRANSITIONS.find(
    (t) =>
      t.from === fromState &&
      t.trigger.formType === formType &&
      (!t.trigger.eightKItem || t.trigger.eightKItem === eightKItem) &&
      (!t.trigger.condition || t.trigger.condition(data))
  );
}
