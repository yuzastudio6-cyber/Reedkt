export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_VERSION =
  'living-frame-controlled-illustration-settlement-contribution-v1' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_CLASS =
  'controlled_non_promotable_settlement_contribution' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES = [
  'current_actual_cost_attribution_server_reread_required',
  'canonical_billability_policy_revalidation_required',
  'durable_actual_cost_event_projection_required',
  'official_rate_and_invoice_authority_required',
  'canonical_service_fee_recalculation_required',
  'active_reservation_reconciliation_required',
  'canonical_overage_policy_decision_required',
  'transactional_wallet_settlement_required',
] as const

export type LivingFrameControlledIllustrationSettlementOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_OPEN_GATES)[number]

export type LivingFrameControlledIllustrationBillabilityReason =
  | 'completed_attempt_candidate'
  | 'reeditpro_failure_absorbed'
  | 'unknown_attempt_absorbed'

export interface LivingFrameControlledIllustrationSettlementContributionEvent {
  readonly order: number
  readonly sourceEvidenceId: string
  readonly sourceEvidenceHashSha256: string
  readonly executionAttemptId: string
  readonly approvedWorkItemId: string
  readonly costComponentId:
    | 'shared_controlled_illustration_gpu_host'
    | 'auraface_cpu_continuity_measurement'
  readonly actualInternalCostMicros: number
  readonly outcome: 'completed' | 'failed' | 'unknown'
  readonly includedInBillableToolCostCandidate: boolean
  readonly billabilityReason:
    LivingFrameControlledIllustrationBillabilityReason
  readonly allocatedBillableToolCostCredits: number
  readonly serviceFeeIncluded: false
  readonly customerChargeAuthority: false
}

export interface LivingFrameControlledIllustrationSettlementAuthorityBoundary {
  readonly controlledSettlementProjectionOnly: true
  readonly officialRateAuthority: false
  readonly invoiceAuthority: false
  readonly customerPriceAuthority: false
  readonly finalCustomerCreditAuthority: false
  readonly billabilityAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly reservationAuthority: false
  readonly overageDecisionAuthority: false
  readonly refundAuthority: false
  readonly walletAuthority: false
  readonly ledgerAuthority: false
  readonly settlementTransactionAuthority: false
  readonly exportUnlockAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledIllustrationSettlementContributionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SETTLEMENT_CONTRIBUTION_CLASS
  readonly contributionId: string
  readonly sourceBindings: {
    readonly actualCostAttributionDigestSha256: string
    readonly approvedCustomerEstimateDigestSha256: string
    readonly canonicalBillabilityPolicyDigestSha256: string
  }
  readonly approvedLivingFrameToolCostCreditCeiling: number
  readonly events:
    readonly LivingFrameControlledIllustrationSettlementContributionEvent[]
  readonly aggregate: {
    readonly totalObservedInternalCostMicros: number
    readonly billableCandidateInternalCostMicros: number
    readonly absorbedInternalCostMicros: number
    readonly billableCandidateToolCostCredits: number
    readonly approvedLivingFrameToolCostCreditCeiling: number
    readonly projectedUnapprovedOverageCredits: number
    readonly withinApprovedLivingFrameToolCostCeiling: boolean
    readonly completedCandidateCount: number
    readonly absorbedFailureCount: number
    readonly absorbedUnknownCount: number
    readonly exactReuseCount: number
    readonly aggregateMicrosBeforeCreditRounding: true
    readonly allocatedEventCreditsEqualAggregateCredits: true
    readonly sixCapabilitiesNeverBecomeSixCharges: true
    readonly exactReuseCreatesNoSettlementEvent: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledIllustrationSettlementOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledIllustrationSettlementAuthorityBoundary
  readonly serviceFeeLinePresent: false
  readonly finalCustomerChargePresent: false
  readonly walletMutationPerformed: false
  readonly settlementEventPersisted: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationSettlementContribution
  extends LivingFrameControlledIllustrationSettlementContributionDraft {
  readonly contributionDigestSha256: string
}
