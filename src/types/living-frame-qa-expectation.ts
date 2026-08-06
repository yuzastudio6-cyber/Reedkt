import type {
  LivingFrameQaCode,
} from './living-frame'
import type {
  QACategory,
  SegmentQAPlanItem,
} from './reeditpro'

export const LIVING_FRAME_QA_EXPECTATION_VERSION =
  'living-frame-qa-expectation-v1' as const

export const LIVING_FRAME_QA_EXPECTATION_CLASS =
  'controlled_non_promotable_existing_qa_plan_expectation_projection' as const

export const LIVING_FRAME_QA_EXPECTATION_STATES = [
  'candidate_expectations_compiled',
  'deliberate_non_use',
] as const
export type LivingFrameQaExpectationState =
  (typeof LIVING_FRAME_QA_EXPECTATION_STATES)[number]

export const LIVING_FRAME_INTEGRATION_QA_CODES = [
  'canonical_selected_scene_revalidation_required',
  'asset_intent_lineage_revalidation_required',
  'canonical_qa_plan_projection_required',
  'no_required_final_placeholder',
  'reconstructed_plate_artifact_qa_required',
] as const
export type LivingFrameIntegrationQaCode =
  (typeof LIVING_FRAME_INTEGRATION_QA_CODES)[number]

export type LivingFrameProjectedQaCode =
  | LivingFrameQaCode
  | LivingFrameIntegrationQaCode

export const LIVING_FRAME_QA_SCOPE_KINDS = [
  'plan',
  'scene',
  'component',
  'asset_intent',
] as const
export type LivingFrameQaScopeKind =
  (typeof LIVING_FRAME_QA_SCOPE_KINDS)[number]

export const LIVING_FRAME_QA_GATE_EXPECTATIONS = [
  'preflight_gate',
  'asset_quality_gate',
  'merge_gate',
  'render_preflight_gate',
  'final_qa_gate',
] as const
export type LivingFrameQaGateExpectation =
  (typeof LIVING_FRAME_QA_GATE_EXPECTATIONS)[number]

export const LIVING_FRAME_QA_EVIDENCE_REQUIREMENTS = [
  'canonical_plan_structure_revalidation',
  'current_source_truth_revalidation',
  'current_artifact_measurement',
  'current_destination_composite_review',
  'current_timing_or_sound_revalidation',
  'approved_work_asset_lineage_revalidation',
] as const
export type LivingFrameQaEvidenceRequirement =
  (typeof LIVING_FRAME_QA_EVIDENCE_REQUIREMENTS)[number]

export interface LivingFrameQaExpectation {
  readonly expectationId: string
  readonly order: number
  readonly qaCode: LivingFrameProjectedQaCode
  readonly scopeKind: LivingFrameQaScopeKind
  readonly sceneId: string | null
  readonly componentId: string | null
  readonly assetIntentId: string | null
  readonly canonicalCategory: QACategory
  readonly canonicalGateExpectation:
    LivingFrameQaGateExpectation
  readonly severityExpectation:
    SegmentQAPlanItem['severity']
  readonly evidenceRequirement:
    LivingFrameQaEvidenceRequirement
  readonly statusExpectation:
    'future_canonical_check_required'
  readonly required: true
}

export interface LivingFrameQaExpectationMetrics {
  readonly expectationCount: number
  readonly planExpectationCount: number
  readonly sceneExpectationCount: number
  readonly componentExpectationCount: number
  readonly assetIntentExpectationCount: number
  readonly blockingExpectationCount: number
  readonly artifactMeasurementExpectationCount: number
  readonly sourceTruthExpectationCount: number
  readonly timingOrSoundExpectationCount: number
}

export interface LivingFrameQaExpectationAuthorityBoundary {
  readonly expectationProjectionOnly: true
  readonly selectedSceneAuthority: false
  readonly qaPlanAuthority: false
  readonly qaCheckCreationAuthority: false
  readonly qaResultAuthority: false
  readonly artifactQaAuthority: false
  readonly sourceTruthAuthority: false
  readonly continuityQaAuthority: false
  readonly exactFrameAuthority: false
  readonly masterTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly renderAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameQaExpectationBundleDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_QA_EXPECTATION_VERSION
  readonly expectationClass:
    typeof LIVING_FRAME_QA_EXPECTATION_CLASS
  readonly expectationState: LivingFrameQaExpectationState
  readonly sourceBindings: {
    readonly semanticPlanProjectionDigestSha256: string
    readonly projectedComponentDigestSha256: string
    readonly componentAssetIntentBundleDigestSha256: string
  }
  readonly expectations: readonly LivingFrameQaExpectation[]
  readonly metrics: LivingFrameQaExpectationMetrics
  readonly authorityBoundary:
    LivingFrameQaExpectationAuthorityBoundary
  readonly existingEditQaPlanRemainsAuthority: true
  readonly existingAgentQaGateSequenceRemainsAuthority: true
  readonly createsQaChecks: false
  readonly marksQaChecksPassed: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
    false
  readonly containsProviderModelToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
}

export interface LivingFrameQaExpectationBundle
  extends LivingFrameQaExpectationBundleDraft {
  readonly bundleDigestSha256: string
}
