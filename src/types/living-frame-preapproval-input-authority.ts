import type {
  ReEditProReasoningModelRouteId,
} from './reasoning-model-routing'

export const LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_VERSION =
  'living-frame-preapproval-input-authority-v1' as const
export const LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_SOURCE =
  'canonical_living_frame_preapproval_input_binding_service' as const
export const LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION =
  'living-frame-preapproval-reasoning-request-v1' as const
export const LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION =
  'living-frame-preapproval-reasoning-result-expectation-v1' as const
export const LIVING_FRAME_PREAPPROVAL_INTERNAL_COST_POLICY_VERSION =
  'living-frame-preapproval-internal-cost-ceiling-v1-2026-07-26' as const

export type LivingFramePreapprovalWorkflowContext =
  | {
      readonly kind: 'ordinary_edit_video'
      readonly motionProductionContext: null
    }
  | {
      readonly kind: 'motion_storytelling_optional_context'
      readonly motionProductionContext: {
        readonly productionId: string
        readonly authorityHashSha256: string
        readonly sourceProposalDigestSha256: string
        readonly sourceArtifactApprovalSnapshotId: string
      }
    }

export interface LivingFramePreapprovalInputIdentity {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly handoffId: string
}

export interface LivingFramePreapprovalInputLineage {
  readonly handoffHashSha256: string
  readonly canonicalPlanComponentsHashSha256: string
  readonly planningInputBindingHashSha256: string
  readonly livingFrameComponentDigestSha256: string
  readonly planningEvidenceBindingDigestSha256: string
  readonly compiledIntentDigestSha256: string
  readonly sourceSequenceDigestSha256: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingDigestSha256: string
  readonly ideaFirstAuthorityDigestSha256: string | null
}

export interface LivingFramePreapprovalEvidenceExpectation {
  readonly status:
    | 'available_for_preapproval_reasoning'
    | 'not_applicable_idea_first'
  readonly sourceMode:
    | 'uploaded_media'
    | 'idea_first_no_uploaded_media'
  readonly evidenceClass:
    | 'private_source_bound_visual_observation_projection'
    | 'not_applicable_canonical_idea_first'
  readonly sourceEvidenceCount: number
  readonly evidenceSetDigestSha256: string
  readonly evidenceReReadByServer: true
  readonly selectedSceneAuthority: false
}

export interface LivingFramePreapprovalReasoningExpectation {
  readonly requestContractVersion:
    typeof LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION
  readonly requestDigestSha256: string
  readonly resultSchemaVersion:
    typeof LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION
  readonly resultSchemaDigestSha256: string
  readonly routeContractVersion: string
  readonly orderedRouteIds: readonly [
    'kimi_k3_primary',
    'gpt_5_6_terra_fallback',
    'deepseek_v4_pro_fallback',
  ]
  readonly routeIdentityDigestSha256: string
  readonly strictStructuredOutputRequired: true
  readonly semanticDecisionsOnly: true
  readonly exactFrameOutputForbidden: true
  readonly exactSoundCueOutputForbidden: true
  readonly providerTransportAuthorityState: 'required_not_granted'
  readonly providerTransportAuthorized: false
  readonly providerCallMade: false
  readonly oldKimiToGptFallbackAllowed: false
  readonly qwen25VlReasoningRouteAllowed: false
  readonly mediaProviderOperationAllowed: false
}

export interface LivingFramePreapprovalInternalCostExpectation {
  readonly policyVersion:
    typeof LIVING_FRAME_PREAPPROVAL_INTERNAL_COST_POLICY_VERSION
  readonly budgetExpectationId: string
  readonly evidenceClass:
    'controlled_non_promotable_internal_cost_ceiling_expectation'
  readonly rateCardVersion: string
  readonly rateCardIdentityDigestSha256: string
  readonly denomination: 'normalized_usd_micros'
  readonly maximumAuthorizedInternalCostMicros: string
  readonly actualAttemptReceiptProvided: false
  readonly actualAttemptCostKnown: false
  readonly providerInvoiceReconciled: false
  readonly futureDurableAttemptEvidenceRequired: true
  readonly customerPriceCalculated: false
  readonly customerCreditsCalculated: false
  readonly customerChargeCreated: false
  readonly walletMutationMade: false
  readonly serviceFeeIncluded: false
}

export interface LivingFramePreapprovalInputAuthorityBoundary {
  readonly preapprovalInputOnly: true
  readonly liveEvidenceAuthority: false
  readonly reasoningRunAuthority: false
  readonly reasoningResultAuthority: false
  readonly providerTransportAuthority: false
  readonly providerCallAuthority: false
  readonly providerCredentialAuthority: false
  readonly providerAttemptReceiptAuthority: false
  readonly providerAttemptCostAuthority: false
  readonly selectedSceneAuthority: false
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

export interface LivingFramePreapprovalInputAuthority {
  readonly schemaVersion:
    typeof LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_VERSION
  readonly authorityClass: 'living_frame_preapproval_input'
  readonly sourceAuthority:
    typeof LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_SOURCE
  readonly evidenceClass:
    'controlled_source_bound_preapproval_input_unreleased'
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly workflowContext: LivingFramePreapprovalWorkflowContext
  readonly identity: LivingFramePreapprovalInputIdentity
  readonly lineage: LivingFramePreapprovalInputLineage
  readonly evidence: LivingFramePreapprovalEvidenceExpectation
  readonly reasoning: LivingFramePreapprovalReasoningExpectation
  readonly internalCost: LivingFramePreapprovalInternalCostExpectation
  readonly authorityBoundary: LivingFramePreapprovalInputAuthorityBoundary
  readonly authorityDigestSha256: string
}

export type LivingFramePreapprovalCanonicalRouteId = Extract<
  ReEditProReasoningModelRouteId,
  | 'kimi_k3_primary'
  | 'gpt_5_6_terra_fallback'
  | 'deepseek_v4_pro_fallback'
>
