import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type { LivingFrameFallbackStep } from './living-frame'

export const LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_VERSION =
  'living-frame-active-baseline-route-binding-v1' as const

export const LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_CLASS =
  'byte_free_non_executable_active_scope_baseline_route_candidate' as const

export type LivingFrameActiveBaselinePrimaryFailureCode =
  | 'temporal_mask_runtime_not_released'
  | 'temporal_mask_qa_not_available'
  | 'mask_risk_requires_safer_layout'
  | 'qualified_contact_object_mask_unavailable'

export type LivingFrameActiveBaselineFallbackEvaluationState =
  | 'ineligible_before_selection'
  | 'selected'
  | 'not_evaluated_after_selection'

export type LivingFrameActiveBaselineFallbackReasonCode =
  | 'primary_route_requires_unreleased_temporal_mask_runtime'
  | 'source_not_qualified_for_simplified_depth'
  | 'selected_as_first_safe_approved_fallback'
  | 'not_evaluated_primary_route_selected'
  | 'not_reached_after_safe_selection'

export interface LivingFrameActiveBaselineDigestRef {
  readonly refId: string
  readonly refVersion: string
  readonly digestSha256: string
  readonly canonicalRereadRequired: true
}

export interface LivingFrameActiveBaselineFallbackEvaluation {
  readonly order: number
  readonly step: LivingFrameFallbackStep
  readonly state:
    LivingFrameActiveBaselineFallbackEvaluationState
  readonly reasonCode:
    LivingFrameActiveBaselineFallbackReasonCode
}

export interface LivingFrameActiveBaselineCaseRouteInput {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly manifestCaseDigestSha256: string
  readonly selectedScene: LivingFrameActiveBaselineDigestRef
  readonly primaryRoute: LivingFrameActiveBaselineDigestRef
  readonly routeDisposition:
    | 'primary_route_candidate'
    | 'approved_fallback_candidate'
  readonly primaryFailureCode:
    LivingFrameActiveBaselinePrimaryFailureCode | null
  readonly fallbackLadder: readonly LivingFrameFallbackStep[]
  readonly fallbackLadderDigestSha256: string
  readonly fallbackEvaluations:
    readonly LivingFrameActiveBaselineFallbackEvaluation[]
  readonly selectedFallbackStep: LivingFrameFallbackStep | null
  readonly approvedPlanState:
    'selected_route_is_present_in_approved_scene_canonical_reread_pending'
}

export interface LivingFrameActiveBaselineCaseRoute {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly manifestCaseDigestSha256: string
  readonly selectedScene: LivingFrameActiveBaselineDigestRef
  readonly primaryRoute: LivingFrameActiveBaselineDigestRef
  readonly routeDisposition:
    | 'primary_route_candidate'
    | 'approved_fallback_candidate'
  readonly primaryFailureCode:
    LivingFrameActiveBaselinePrimaryFailureCode | null
  readonly fallbackLadder: readonly LivingFrameFallbackStep[]
  readonly fallbackLadderDigestSha256: string
  readonly fallbackEvaluations:
    readonly LivingFrameActiveBaselineFallbackEvaluation[]
  readonly selectedFallbackStep: LivingFrameFallbackStep | null
  readonly approvedPlanState:
    'selected_route_is_present_in_approved_scene_canonical_reread_pending'
  readonly baselineInternalExecutionCandidate: true
  readonly advancedCapabilityProvenByFallback: false
  readonly fallbackMaySatisfyAdvancedRouteCompletion: false
  readonly canonicalWorkAdmissionGranted: false
  readonly routeDigestSha256: string
}

export interface LivingFrameActiveBaselineRouteBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_VERSION
  readonly bindingClass:
    typeof LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_CLASS
  readonly bindingState:
    'twelve_case_baseline_candidate_complete_advanced_temporal_mask_gate_preserved'
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly aggregateManifestVersion:
    'living-frame-active-non-illustration-aggregate-v1'
  readonly aggregateManifestDigestSha256: string
  readonly routes: readonly LivingFrameActiveBaselineCaseRoute[]
  readonly activeCaseCount: 12
  readonly primaryRouteCaseCount: 10
  readonly approvedFallbackCaseCount: 2
  readonly baselineInternalExecutionCandidate: true
  readonly advancedTemporalMaskRouteOpenCaseCount: 2
  readonly advancedTemporalMaskCompletionClaimed: false
  readonly approvedFallbackMayCountAsAdvancedTemporalMaskEvidence: false
  readonly safeSpaceFallbackPreserved: true
  readonly aiVideoMaySolveMaskFailure: false
  readonly fallbackMayChangeMeaningCostOrScopeWithoutReview: false
  readonly canonicalRereadPending: true
  readonly createsPlannerWorkAssetTimingRendererQaOrReviewOwner: false
  readonly containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactCreated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameActiveBaselineRouteBinding
  extends LivingFrameActiveBaselineRouteBindingDraft {
  readonly routeSetDigestSha256: string
  readonly bindingDigestSha256: string
}
