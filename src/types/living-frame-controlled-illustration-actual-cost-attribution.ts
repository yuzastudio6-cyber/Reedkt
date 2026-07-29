import type {
  CanonicalLivingFrameControlledIllustrationCapabilityId,
  CanonicalLivingFrameControlledIllustrationCostComponentId,
} from './living-frame-controlled-illustration-estimate-basis'

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION =
  'living-frame-controlled-illustration-actual-cost-attribution-v1' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS =
  'controlled_non_promotable_actual_cost_attribution_binding' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_READER_VERSION =
  'living-frame-controlled-illustration-actual-cost-reader-v1' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION =
  'living-frame-controlled-illustration-actual-cost-locator-v1' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES = [
  'canonical_comfyui_operation_registration_required',
  'canonical_auraface_operation_binding_required',
  'released_observed_usage_transport_required',
  'official_rate_authority_required',
  'distributed_attempt_cost_durability_required',
  'canonical_settlement_event_projection_required',
  'customer_billability_decision_required',
  'invoice_reconciliation_required',
] as const

export type LivingFrameControlledIllustrationActualCostOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_OPEN_GATES)[number]

export interface LivingFrameControlledIllustrationActualCostLocator {
  readonly schemaVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION
  readonly serverOwnedLocatorId: string
}

export interface LivingFrameControlledIllustrationActualCostScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly approvedPlanSnapshotId: string
  readonly approvedPlanSnapshotHashSha256: string
  readonly packageRecordId: string
  readonly packageHashSha256: string
}

export interface LivingFrameControlledIllustrationExactReuseEvidence {
  readonly reuseId: string
  readonly order: number
  readonly costComponentId:
    CanonicalLivingFrameControlledIllustrationCostComponentId
  readonly capabilityIds:
    readonly CanonicalLivingFrameControlledIllustrationCapabilityId[]
  readonly reusedAssetId: string
  readonly reusedAssetHashSha256: string
  readonly sourceAttemptEvidenceId: string
  readonly sourceAttemptEvidenceHashSha256: string
  readonly approvedReuseDecisionDigestSha256: string
  readonly newWorkerAttemptCreated: false
}

export interface LivingFrameControlledIllustrationAttemptCostAttribution {
  readonly order: number
  readonly costComponentId:
    CanonicalLivingFrameControlledIllustrationCostComponentId
  readonly capabilityIds:
    readonly CanonicalLivingFrameControlledIllustrationCapabilityId[]
  readonly evidenceId: string
  readonly evidenceHashSha256: string
  readonly executionAttemptId: string
  readonly approvedWorkItemId: string
  readonly attemptOrdinal: number
  readonly operation: {
    readonly canonicalToolId: string
    readonly operationId: string
    readonly operationProfileHashSha256: string
  }
  readonly observedUsage: {
    readonly wallTimeMilliseconds: number
    readonly allocatedVcpuMilliseconds: number
    readonly allocatedMemoryMibMilliseconds: number
    readonly allocatedGpuMilliseconds: number
    readonly observedGpuActiveMilliseconds: number
    readonly networkEgressBytes: number
  }
  readonly rateCard: {
    readonly rateCardVersion: string
    readonly rateCardDigestSha256: string
    readonly rateAuthorityClass:
      'mock_safe_placeholder_not_cloud_invoice'
    readonly officialCloudRateApproved: false
    readonly invoiceReconciled: false
  }
  readonly actualInternalCostMicros: number
  readonly outcome: 'completed' | 'failed' | 'unknown'
  readonly failureCategory:
    | 'none'
    | 'provider_error'
    | 'reeditpro_error'
    | 'validation_error'
    | 'timeout'
    | 'cancelled'
    | 'unknown'
  readonly failedOrUnknownAttemptCostRetained: true
  readonly serviceFeeIncluded: false
  readonly customerBillabilityDecisionPresent: false
  readonly customerCreditAllocationPresent: false
}

export interface LivingFrameControlledIllustrationReuseCostAttribution
  extends LivingFrameControlledIllustrationExactReuseEvidence {
  readonly incrementalInternalCostMicros: 0
  readonly originalAttemptCostErased: false
  readonly customerBillabilityDecisionPresent: false
  readonly customerCreditAllocationPresent: false
}

export interface LivingFrameControlledIllustrationActualCostAuthorityBoundary {
  readonly controlledInternalCostAttributionOnly: true
  readonly officialRateAuthority: false
  readonly invoiceAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly customerBillabilityAuthority: false
  readonly serviceFeeAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly reservationAuthority: false
  readonly walletAuthority: false
  readonly refundAuthority: false
  readonly settlementAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly dispatchAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledIllustrationActualCostAttributionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_ATTRIBUTION_CLASS
  readonly attributionId: string
  readonly canonicalScope:
    LivingFrameControlledIllustrationActualCostScope
  readonly sourceBindings: {
    readonly operationPreflightDigestSha256: string
    readonly approvedLineageBindingDigestSha256: string
    readonly selectedSceneAdmissionDigestSha256: string
    readonly estimateProjectionDigestSha256: string
    readonly workGraphProjectionDigestSha256: string
  }
  readonly attemptAttributions:
    readonly LivingFrameControlledIllustrationAttemptCostAttribution[]
  readonly exactReuseAttributions:
    readonly LivingFrameControlledIllustrationReuseCostAttribution[]
  readonly aggregate: {
    readonly completedAttemptCount: number
    readonly failedAttemptCount: number
    readonly unknownAttemptCount: number
    readonly exactReuseCount: number
    readonly sharedGpuHostAttemptCount: number
    readonly auraFaceCpuMeasurementAttemptCount: number
    readonly totalObservedAttemptInternalCostMicros: number
    readonly exactReuseIncrementalInternalCostMicros: 0
    readonly sharedGpuHostChargedOncePerObservedAttempt: true
    readonly capabilityIdsAreAttributionNotIndependentCharges: true
    readonly auraFaceCostSeparatedFromGpuHost: true
    readonly failedAndUnknownAttemptCostRetained: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledIllustrationActualCostOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledIllustrationActualCostAuthorityBoundary
  readonly existingCanonicalEstimateRemainsAuthority: true
  readonly existingCanonicalSettlementRemainsAuthority: true
  readonly callerSuppliedCostAccepted: false
  readonly customerChargeCalculated: false
  readonly settlementEventCreated: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationActualCostAttribution
  extends LivingFrameControlledIllustrationActualCostAttributionDraft {
  readonly attributionDigestSha256: string
}
