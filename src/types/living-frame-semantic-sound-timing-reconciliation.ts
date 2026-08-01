import type {
  LivingFrameAttentionEventType,
  LivingFrameDuckingExpectation,
  LivingFrameNarrationProtection,
  LivingFrameSoundPriority,
  LivingFrameSoundPurpose,
  LivingFrameTimingPhase,
} from './living-frame'
import type {
  CanonicalLivingFrameFrameRange,
} from './living-frame-timing-binding'

export const LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_VERSION =
  'living-frame-semantic-sound-timing-reconciliation-v1' as const

export const LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_CLASS =
  'server_derived_read_only_living_frame_choreography_to_canonical_timing_reconciliation_candidate' as const

export const LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_STATE =
  'phase_compatible_cues_observed_order_spacing_conflicts_fail_closed_canonical_integration_pending' as const

export const LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_STATUSES = [
  'phase_compatible_semantic_trigger_candidate',
  'blocked_semantic_trigger_phase_divergence',
] as const

export type LivingFrameSemanticSoundTimingReconciliationStatus =
  (typeof LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_STATUSES)[number]

export const LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_OPEN_GATES = [
  'canonical_attention_event_exact_frame_projection_required',
  'canonical_timing_must_consume_semantic_trigger_identity_event_type_and_motion_lineage',
  'canonical_soundsync_exact_hit_frame_and_envelope_required',
  'canonical_soundsync_asset_provenance_required',
  'canonical_soundsync_gain_pan_attack_release_and_voice_ducking_required',
  'canonical_timing_qa_and_private_review_required',
  'canonical_approved_snapshot_projection_required',
  'canonical_work_graph_and_asset_manifest_projection_required',
] as const

export type LivingFrameSemanticSoundTimingReconciliationOpenGate =
  (typeof LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_OPEN_GATES)[number]

export const LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_ISSUE_CODES = [
  'input_invalid',
  'choreography_binding_invalid',
  'canonical_requirements_invalid',
  'canonical_timing_binding_invalid',
  'source_lineage_mismatch',
  'scene_mismatch',
  'missing_sound_request_or_cue',
  'duplicate_sound_request_or_cue',
  'sound_request_cue_metadata_mismatch',
  'semantic_trigger_phase_unresolvable',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameSemanticSoundTimingReconciliationIssueCode =
  (typeof LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_ISSUE_CODES)[number]

export interface LivingFrameSemanticSoundTimingReconciliationAuthority {
  readonly readOnlySemanticSoundTimingReconciliationAuthority: true
  readonly livingFrameSelectionAuthority: false
  readonly choreographyAuthority: false
  readonly attentionTimingAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly exactSoundHitAuthority: false
  readonly soundAssetAuthority: false
  readonly soundMixAuthority: false
  readonly narrationDuckingAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly assetManifestAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSemanticSoundTimingReconciliationUnit {
  readonly order: number
  readonly reconciliationUnitId: string
  readonly sceneId: string
  readonly soundRequestId: string
  readonly soundSyncCueId: string
  readonly linkedComponentId: string | null
  readonly purpose: LivingFrameSoundPurpose
  readonly priority: LivingFrameSoundPriority
  readonly narrationProtection: LivingFrameNarrationProtection
  readonly duckingExpectation: LivingFrameDuckingExpectation
  readonly semanticTrigger: {
    readonly attentionEventId: string
    readonly eventType: LivingFrameAttentionEventType
    readonly motionTrackIds: readonly string[]
    readonly requiredSemanticPhase: LivingFrameTimingPhase
    readonly requiredSemanticPhaseTimingRequestId: string
    readonly requiredSemanticPhaseFrameRange:
      CanonicalLivingFrameFrameRange
    readonly exactAttentionEventFrameRangePresentInCanonicalTimingV1:
      false
    readonly exactMotionHitFramePresentInCanonicalTimingV1: false
  }
  readonly canonicalCueObservation: {
    readonly frameRange: CanonicalLivingFrameFrameRange
    readonly containingSemanticPhase:
      LivingFrameTimingPhase | null
    readonly containingSemanticPhaseTimingRequestId:
      string | null
    readonly exactCueRangeProvided: true
    readonly exactHitFrameProvided: false
    readonly semanticTriggerAttentionEventIdCarried: false
    readonly semanticTriggerMotionTrackIdsCarried: false
    readonly exactMixProvided: false
    readonly speechPriorityPreserved: true
  }
  readonly reconciliationStatus:
    LivingFrameSemanticSoundTimingReconciliationStatus
  readonly currentCanonicalCueFallsWithinRequiredSemanticPhase:
    boolean
  readonly currentCanonicalCueMayBeUsedAsProfessionalSemanticSoundProof:
    false
  readonly canonicalCueMutated: false
  readonly choreographyBindingMutated: false
  readonly downstreamProfessionalSoundAdmissionBlocked: true
  readonly reconciliationUnitDigestSha256: string
}

export interface LivingFrameSemanticSoundTimingReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_CLASS
  readonly reconciliationState:
    typeof LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_STATE
  readonly reconciliationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly choreographyBindingDigestSha256: string
    readonly deterministicMotionBundleDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly executionRequirementsDigestSha256: string
    readonly canonicalTimingBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
  }
  readonly units:
    readonly LivingFrameSemanticSoundTimingReconciliationUnit[]
  readonly metrics: {
    readonly soundRequestCount: number
    readonly canonicalCueCount: number
    readonly phaseCompatibleCandidateCount: number
    readonly semanticTriggerPhaseDivergenceCount: number
    readonly canonicalCueWithTriggerIdentityCount: 0
    readonly canonicalCueWithExactHitFrameCount: 0
    readonly canonicalCueWithExactMixCount: 0
  }
  readonly allCurrentCanonicalCuesPhaseCompatible: boolean
  readonly semanticTriggerDivergenceObserved: boolean
  readonly currentCanonicalTimingUsesSemanticTriggerEvidence:
    false
  readonly professionalSemanticSoundTimingReady: false
  readonly canonicalTimingOrSoundSyncCanProceedByThisReconciliation:
    false
  readonly canonicalTimingOrSoundSyncMutated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly soundAssetSelectedOrGenerated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly openGateCodes:
    readonly LivingFrameSemanticSoundTimingReconciliationOpenGate[]
  readonly authorityBoundary:
    LivingFrameSemanticSoundTimingReconciliationAuthority
  readonly containsRawChatTranscriptAudioMediaBytesPathsUrlsCredentialsPromptsCommandsOrEnvironment:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameSemanticSoundTimingReconciliation
  extends LivingFrameSemanticSoundTimingReconciliationDraft {
  readonly reconciliationDigestSha256: string
}

export interface LivingFrameSemanticSoundTimingReconciliationIssue {
  readonly code:
    LivingFrameSemanticSoundTimingReconciliationIssueCode
  readonly path: string
}
