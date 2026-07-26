import type {
  LivingFrameImportance,
  LivingFrameMode,
  LivingFrameNarrativePurposeCode,
  LivingFrameReasonCode,
  LivingFrameSourceTruthMode,
  LivingFrameVisualVerb,
} from './living-frame'
import {
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
  type LivingFramePreapprovalWorkflowContext,
} from './living-frame-preapproval-input-authority'

export const LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_VERSION =
  'living-frame-preapproval-reasoning-result-binding-v1' as const
export const LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_SOURCE =
  'canonical_living_frame_preapproval_reasoning_result_binding_service' as const
export const LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_LOCATOR_VERSION =
  'canonical-living-frame-preapproval-reasoning-result-locator-v1' as const

export type LivingFramePreapprovalSemanticDecisionKind =
  | 'semantic_candidate'
  | 'rejected_candidate'
  | 'deliberate_non_use'
  | 'blocked'

export type LivingFramePreapprovalSemanticOverallDecision =
  | 'candidates_proposed'
  | 'deliberate_non_use'
  | 'blocked'

export interface LivingFramePreapprovalReasoningResultLocator {
  readonly schemaVersion:
    typeof LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_LOCATOR_VERSION
  readonly serverOwnedLocatorId: string
}

export interface LivingFrameSourceObservationEvidenceReference {
  readonly kind: 'source_visual_observation'
  readonly sourceSequenceItemId: string
  readonly observationId: string
  readonly evidenceSetDigestSha256: string
}

export interface LivingFrameIdeaFirstEvidenceReference {
  readonly kind: 'canonical_idea_first_context'
  readonly ideaFirstAuthorityDigestSha256: string
  readonly evidenceSetDigestSha256: string
}

export type LivingFramePreapprovalSemanticEvidenceReference =
  | LivingFrameSourceObservationEvidenceReference
  | LivingFrameIdeaFirstEvidenceReference

interface LivingFramePreapprovalSemanticDecisionBase {
  readonly decisionId: string
  readonly order: number
  readonly reasonCode: LivingFrameReasonCode
  readonly derivedSummary: string
  readonly evidenceReferences:
    readonly LivingFramePreapprovalSemanticEvidenceReference[]
}

export interface LivingFramePreapprovalSemanticCandidate
  extends LivingFramePreapprovalSemanticDecisionBase {
  readonly decisionKind: 'semantic_candidate'
  readonly mode: LivingFrameMode
  readonly narrativePurpose: LivingFrameNarrativePurposeCode
  readonly visualVerb: LivingFrameVisualVerb
  readonly importance: LivingFrameImportance
  readonly sourceTruthMode: LivingFrameSourceTruthMode
}

export interface LivingFramePreapprovalRejectedCandidate
  extends LivingFramePreapprovalSemanticDecisionBase {
  readonly decisionKind: 'rejected_candidate'
  readonly mode: LivingFrameMode
  readonly narrativePurpose: LivingFrameNarrativePurposeCode
  readonly visualVerb: LivingFrameVisualVerb
  readonly importance: LivingFrameImportance
  readonly sourceTruthMode: LivingFrameSourceTruthMode
}

export interface LivingFramePreapprovalDeliberateNonUse
  extends LivingFramePreapprovalSemanticDecisionBase {
  readonly decisionKind: 'deliberate_non_use'
}

export interface LivingFramePreapprovalBlockedDecision
  extends LivingFramePreapprovalSemanticDecisionBase {
  readonly decisionKind: 'blocked'
}

export type LivingFramePreapprovalSemanticDecision =
  | LivingFramePreapprovalSemanticCandidate
  | LivingFramePreapprovalRejectedCandidate
  | LivingFramePreapprovalDeliberateNonUse
  | LivingFramePreapprovalBlockedDecision

export interface LivingFrameControlledSemanticReasoningResult {
  readonly schemaVersion:
    typeof LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION
  readonly resultClass:
    'controlled_living_frame_semantic_reasoning_result_fixture'
  readonly evidenceClass:
    'controlled_non_promotable_semantic_reasoning_result'
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
  }
  readonly livingFramePreapprovalInputAuthorityDigestSha256: string
  readonly planningEvidenceBindingDigestSha256: string
  readonly reasoningRequestDigestSha256: string
  readonly reasoningResultSchemaDigestSha256: string
  readonly overallDecision:
    LivingFramePreapprovalSemanticOverallDecision
  readonly decisions: readonly LivingFramePreapprovalSemanticDecision[]
  readonly selectedSceneAuthority: false
  readonly exactFrameAuthority: false
  readonly exactSoundCueAuthority: false
  readonly customerEstimateAuthority: false
  readonly providerOrToolSelectionAuthority: false
  readonly approvalOrRuntimeAuthority: false
  readonly resultDigestSha256: string
}

export interface LivingFramePreapprovalReasoningResultAuthorityBoundary {
  readonly controlledPlanningProjectionOnly: true
  readonly liveEvidenceAuthority: false
  readonly releasedReasoningRunAuthority: false
  readonly reasoningResultAuthority: false
  readonly providerTransportAuthority: false
  readonly providerCallAuthority: false
  readonly providerCredentialAuthority: false
  readonly providerAttemptReceiptAuthority: false
  readonly providerAttemptCostAuthority: false
  readonly selectedSceneAuthority: false
  readonly componentPlanAuthority: false
  readonly capabilityPlanAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly creditReservationAuthority: false
  readonly walletAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly toolRouteAuthority: false
  readonly mediaGenerationAuthority: false
  readonly renderAuthority: false
  readonly exportAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFramePreapprovalReasoningResultBinding {
  readonly contractVersion:
    typeof LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_VERSION
  readonly contractSource:
    typeof LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_SOURCE
  readonly evidenceClass:
    'controlled_non_promotable_reasoning_result_binding'
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly workflowContext: LivingFramePreapprovalWorkflowContext
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
  }
  readonly canonicalBindings: {
    readonly livingFramePreapprovalInputAuthorityDigestSha256: string
    readonly planningEvidenceBindingDigestSha256: string
    readonly reasoningRequestDigestSha256: string
    readonly reasoningResultSchemaDigestSha256: string
    readonly routeIdentityDigestSha256: string
    readonly rateCardIdentityDigestSha256: string
    readonly internalCostBudgetAdmissionDigestSha256: string
    readonly workloadAuthorityDigestSha256: string
    readonly canonicalReasoningRunReceiptDigestSha256: string
    readonly semanticResultDigestSha256: string
  }
  readonly overallDecision:
    LivingFramePreapprovalSemanticOverallDecision
  readonly decisions: readonly LivingFramePreapprovalSemanticDecision[]
  readonly reasoningResultReReadByServer: true
  readonly controlledRunSummary: {
    readonly evidenceClass:
      'controlled_non_promotable_reasoning_run_summary'
    readonly terminalState: 'completed'
    readonly attemptCount: number
    readonly failedAttemptCount: number
    readonly completedAttemptCount: 1
    readonly unknownAttemptCount: 0
    readonly failedAttemptCostRetained: true
    readonly normalizedUsdCostMicros: number
    readonly withinAuthorizedInternalCostCeiling: true
    readonly providerCallsMadeByBindingService: false
    readonly customerPriceCalculated: false
    readonly customerCreditsCalculated: false
    readonly serviceFeeIncluded: false
  }
  readonly authorityBoundary:
    LivingFramePreapprovalReasoningResultAuthorityBoundary
  readonly contractDigestSha256: string
}
