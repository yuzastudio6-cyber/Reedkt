import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
} from './living-frame-owner-scope-amendment'

export const LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_VERSION =
  'living-frame-active-private-internal-test-v1' as const

export const LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_CLASS =
  'owner_scoped_non_character_engineering_runtime_aggregate' as const

export const LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_RUN_IDS = [
  'baseline_route_binding',
  'five_mode_private_render',
  'confirmed_frame_private_render',
  'motion_v3_private_render',
  'non_character_content_lineage',
  'selected_scene_environmental_particle',
  'semantic_sound_timing_reconciliation',
  'representative_media_source_candidate_set',
  'representative_visual_fixture_plan',
  'non_character_professional_review_contract',
  'postrender_visual_inspection_contract',
  'active_evidence_admission_contract',
] as const

export type LivingFrameActivePrivateInternalRunId =
  typeof LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_RUN_IDS[number]

export const LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_OPEN_GATE_IDS = [
  'canonical_one_writer_adoption_pending',
  'canonical_map_route_data_tool_and_source_reread_pending',
  'canonical_archive_document_and_hybrid_reread_pending',
  'postrender_qwen_provider_and_complete_time_runtime_pending',
  'head_qa_recommendation_and_private_review_pending',
  'advanced_sam2_temporal_mask_runtime_pending',
  'representative_media_source_ingest_and_selection_pending',
  'representative_source_media_runtime_pending',
  'representative_visual_repair_and_reinspection_pending',
  'caption_cap11_canonical_reconciliation_pending',
  'soundsync_exact_cue_mix_canonical_response_pending',
] as const

export type LivingFrameActivePrivateInternalOpenGateId =
  typeof LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_OPEN_GATE_IDS[number]

export interface LivingFrameActivePrivateInternalRunResult {
  readonly runId: LivingFrameActivePrivateInternalRunId
  readonly order: number
  readonly relativePath: string
  readonly evidenceClass:
    | 'source_contract_regression'
    | 'private_engineering_media_runtime'
  readonly exitStatus: 0
  readonly structuredReceiptObserved: true
  readonly observedStatus: 'passed' | 'passed_source_only'
  readonly outputDigestSha256: string
  readonly receiptDigestSha256: string
  readonly reviewExportCount: number
  readonly reviewExportReceiptSetDigestSha256: string
  readonly canonicalRuntimeEvidenceClaimed: false
}

export interface LivingFrameActivePrivateInternalCaseResult {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly requiredRunIds:
    readonly LivingFrameActivePrivateInternalRunId[]
  readonly engineeringMediaRuntimeObserved: boolean
  readonly sourceContractEvidenceObserved: true
  readonly professionalAiVisualInspectionObserved: false
  readonly separateCanonicalAudioEvidenceObserved: false
  readonly canonicalHeadQaRecommendationObserved: false
  readonly canonicalPrivateReviewObserved: false
  readonly canonicalRuntimeEvidenceComplete: false
  readonly canCountTowardActiveCompletion: false
  readonly pausedEvidenceUsed: false
  readonly caseEvidenceDigestSha256: string
}

export interface LivingFrameActivePrivateInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_VERSION
  readonly reportClass:
    typeof LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_CLASS
  readonly status:
    'engineering_runtime_executed_professional_canonical_evidence_incomplete'
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly aggregateManifestVersion:
    'living-frame-active-non-illustration-aggregate-v1'
  readonly baselineRouteBindingVersion:
    'living-frame-active-baseline-route-binding-v1'
  readonly activeCaseCount: 12
  readonly pausedScopeCount: 7
  readonly runCount: 12
  readonly sourceContractRunCount: 8
  readonly privateEngineeringMediaRuntimeRunCount: 4
  readonly privateReviewExportRunCount: 4
  readonly privateReviewExportCount: 5
  readonly runs: readonly LivingFrameActivePrivateInternalRunResult[]
  readonly cases: readonly LivingFrameActivePrivateInternalCaseResult[]
  readonly openGateIds:
    readonly LivingFrameActivePrivateInternalOpenGateId[]
  readonly historicalCharacterOrRiggingAggregateImported: false
  readonly pausedCharacterOrMechanicalEvidenceAccepted: false
  readonly baselineFallbackMayProveAdvancedTemporalMasking: false
  readonly technicalMetricsMayApproveProfessionalQuality: false
  readonly callerAssertionsMayCountAsVisualInspection: false
  readonly qwenProviderCallMade: false
  readonly headQaRecommendationMade: false
  readonly canonicalPrivateReviewApproved: false
  readonly internalEngineeringRuntimeExecuted: true
  readonly processPrivateReviewCopiesPreserved: true
  readonly reviewCopiesCreateCanonicalArtifacts: false
  readonly reviewCopiesMayApproveProfessionalQuality: false
  readonly activePrivateInternalReady: false
  readonly createsCanonicalPlannerWorkAssetTimingRendererQaOrReviewOwner:
    false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameActivePrivateInternalTestReport
  extends LivingFrameActivePrivateInternalTestReportDraft {
  readonly runSetDigestSha256: string
  readonly caseSetDigestSha256: string
  readonly openGateSetDigestSha256: string
  readonly reportDigestSha256: string
}
