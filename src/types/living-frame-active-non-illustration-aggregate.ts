import type {
  LivingFrameActiveNonIllustrationScope,
  LivingFramePausedOwnerSpecificationScope,
} from './living-frame-owner-scope-amendment'

export const LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_VERSION =
  'living-frame-active-non-illustration-aggregate-v1' as const

export const LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_CLASS =
  'byte_free_non_executable_active_scope_evidence_manifest' as const

export const LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS = [
  'living_a_roll_compositing_case',
  'static_illustration_without_animation_case',
  'living_still_non_character_case',
  'living_archive_case',
  'living_diagram_case',
  'hybrid_expansion_non_character_case',
  'maps_routes_and_data_graphics_case',
  'attention_focus_and_semantic_scale_case',
  'camera_depth_occlusion_and_masks_case',
  'environmental_editorial_and_rigid_support_case',
  'sound_story_timing_and_caption_case',
  'remotion_qa_and_private_review_case',
] as const

export type LivingFrameActiveNonIllustrationCaseId =
  typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[number]

export type LivingFrameActiveNonIllustrationEvidenceState =
  | 'source_contract_bound_canonical_reread_pending'
  | 'recorded_fixture_requires_ai_reinspection'
  | 'runtime_fixture_and_canonical_evidence_pending'

export interface LivingFrameActiveNonIllustrationEvidencePacketRef {
  readonly packetId: string
  readonly packetVersion: string
  readonly packetDigestSha256: string
  readonly canonicalRereadRequired: true
  readonly runtimeEvidenceIncluded: false
  readonly pausedEvidenceIncluded: false
}

export interface LivingFrameActiveNonIllustrationAggregateCase {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly evidenceState:
    LivingFrameActiveNonIllustrationEvidenceState
  readonly evidencePacket:
    LivingFrameActiveNonIllustrationEvidencePacketRef
  readonly requiredDependencyIds: readonly string[]
  readonly requiredDependencySetDigestSha256: string
  readonly canonicalOwnersPreserved: true
  readonly historicalAggregateEvidenceAccepted: false
  readonly pausedEvidenceMaySatisfyCase: false
  readonly canonicalRereadRequired: true
  readonly runtimeExecutionClaimed: false
  readonly deterministicQaRequired: true
  readonly postrenderAiVisualInspectionRequired: true
  readonly completeTimeCoverageRequired: true
  readonly separateVerifiedAudioEvidenceRequired: true
  readonly headQaRecommendationRequired: true
  readonly nPlusOneRepairAndReinspectionRequiredOnFailure: true
  readonly canonicalPrivateReviewRequired: true
  readonly caseDigestSha256: string
}

export interface LivingFrameActiveNonIllustrationAggregateAuthorityBoundary {
  readonly sourceManifestOnly: true
  readonly approvedSnapshotAuthority: false
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly captionAuthority: false
  readonly mapOrDataVizAuthority: false
  readonly documentaryFactAuthority: false
  readonly layoutDepthOrMaskAuthority: false
  readonly workGraphAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly providerAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameActiveNonIllustrationAggregateDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_VERSION
  readonly aggregateClass:
    typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_AGGREGATE_CLASS
  readonly aggregateState:
    'active_scope_manifest_complete_runtime_and_canonical_evidence_pending'
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly readinessAuditVersion:
    'living-frame-non-illustration-readiness-audit-v7'
  readonly readinessAuditDigestSha256: string
  readonly cases:
    readonly LivingFrameActiveNonIllustrationAggregateCase[]
  readonly activeCaseCount: 12
  readonly activeScopeCount: 12
  readonly activeScopeSetDigestSha256: string
  readonly pausedScopesRejected:
    readonly LivingFramePausedOwnerSpecificationScope[]
  readonly pausedScopeCount: 7
  readonly pausedScopeSetDigestSha256: string
  readonly activeBlockingRequirementCount: number
  readonly activeBlockingRequirementSetDigestSha256: string
  readonly historicalAggregateImported: false
  readonly historicalAggregateCaseCountUsed: false
  readonly historicalCharacterOrRiggingEvidenceAccepted: false
  readonly ownerScopeAmendmentPreserved: true
  readonly activePrivateInternalReady: false
  readonly aggregateRuntimeReady: false
  readonly authorityBoundary:
    LivingFrameActiveNonIllustrationAggregateAuthorityBoundary
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameActiveNonIllustrationAggregate
  extends LivingFrameActiveNonIllustrationAggregateDraft {
  readonly aggregateDigestSha256: string
}
