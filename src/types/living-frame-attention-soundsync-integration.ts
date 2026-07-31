import type {
  LivingFrameAttentionEventType,
  LivingFrameAttentionMethod,
  LivingFrameAttentionTarget,
  LivingFrameDuckingExpectation,
  LivingFrameFactualScaleGuard,
  LivingFrameNarrationProtection,
  LivingFrameSemanticScaleMeaning,
  LivingFrameSemanticScaleMode,
  LivingFrameSoundPriority,
  LivingFrameSoundPurpose,
  LivingFrameTimingPhase,
} from './living-frame'
import type {
  CanonicalLivingFrameRenderableMotionProperty,
  CanonicalLivingFrameMotionTarget,
} from './living-frame-canonical-motion'
import type {
  LivingFrameMotionTrackRole,
} from './living-frame-deterministic-motion'
import type {
  CanonicalLivingFrameFrameRange,
} from './living-frame-timing-binding'

export const LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_VERSION =
  'living-frame-attention-soundsync-integration-v1' as const

export const LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_CLASS =
  'server_derived_read_only_non_character_attention_scale_camera_and_soundsync_handoff_candidate' as const

export const LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_STATE =
  'exact_attention_scale_and_camera_handoff_ready_canonical_renderer_and_soundsync_resolution_pending' as const

export const LIVING_FRAME_ATTENTION_SOUNDSYNC_OPEN_GATES = [
  'canonical_renderer_local_contrast_primitive_resolution_required',
  'canonical_soundsync_semantic_request_consumption_required',
  'canonical_soundsync_exact_start_hit_end_envelope_required',
  'canonical_soundsync_asset_provenance_and_private_persistence_required',
  'canonical_soundsync_gain_pan_attack_release_and_voice_ducking_required',
  'canonical_storytiming_snapshot_work_asset_and_renderer_lineage_required',
  'canonical_audio_qa_and_head_intelligence_private_review_required',
] as const
export type LivingFrameAttentionSoundSyncOpenGate =
  (typeof LIVING_FRAME_ATTENTION_SOUNDSYNC_OPEN_GATES)[number]

export interface LivingFrameAttentionResolvedMotionTrack {
  readonly motionSpecDigestSha256: string
  readonly componentId: string
  readonly trackId: string
  readonly target: CanonicalLivingFrameMotionTarget
  readonly property: CanonicalLivingFrameRenderableMotionProperty
  readonly role: LivingFrameMotionTrackRole
}

export interface LivingFrameAttentionMethodResolution {
  readonly method: LivingFrameAttentionMethod
  readonly resolution:
    | 'canonical_motion_v3_tracks'
    | 'canonical_renderer_local_contrast_primitive_request'
    | 'semantic_soundsync_request'
  readonly motionTracks:
    readonly LivingFrameAttentionResolvedMotionTrack[]
  readonly soundRequestIds: readonly string[]
  readonly rendererPrimitiveRequestId: string | null
}

export interface LivingFrameLocalContrastPrimitiveRequest {
  readonly rendererPrimitiveRequestId: string
  readonly attentionEventId: string
  readonly target: LivingFrameAttentionTarget
  readonly frameRange: CanonicalLivingFrameFrameRange
  readonly styleProfileMustResolveExactStrength: true
  readonly localContrastCannotBeSilentlyReplacedWithBlur: true
  readonly exactRendererValuesProvided: false
}

export interface LivingFrameExactAttentionEventBinding {
  readonly order: number
  readonly attentionEventId: string
  readonly eventType: LivingFrameAttentionEventType
  readonly target: LivingFrameAttentionTarget
  readonly requiredSemanticPhase: LivingFrameTimingPhase
  readonly semanticPhaseTimingRequestId: string
  readonly frameRange: CanonicalLivingFrameFrameRange
  readonly methodResolutions:
    readonly LivingFrameAttentionMethodResolution[]
  readonly motionTracks:
    readonly LivingFrameAttentionResolvedMotionTrack[]
  readonly soundRequestIds: readonly string[]
  readonly restorationRequired: boolean
  readonly restorationCandidateVerified: boolean
  readonly exactRangeDerivedFromCanonicalMasterTiming: true
}

export interface LivingFrameExactSemanticScaleBinding {
  readonly semanticScaleRequestId: string
  readonly componentId: string
  readonly mode: LivingFrameSemanticScaleMode
  readonly meaning: LivingFrameSemanticScaleMeaning
  readonly factualGuard: LivingFrameFactualScaleGuard
  readonly evaluationPhase: 'demonstrate'
  readonly evaluationFrameRange: CanonicalLivingFrameFrameRange
  readonly scaleTrackIds: readonly string[]
  readonly treatment:
    | 'literal_relationship_preserved_at_unit_scale'
    | 'data_proportion_preserved_at_unit_scale'
    | 'perspective_scale_candidate'
    | 'disclosed_editorial_symbolic_scale_candidate'
  readonly factualRelationshipPreservedByCandidate: true
  readonly downstreamFactQaStillRequired: true
}

export interface LivingFrameExactCameraChoreographyBinding {
  readonly cameraBindingId: string
  readonly motionSpecDigestSha256: string
  readonly trackId: string
  readonly property:
    | 'position_x_normalized'
    | 'position_y_normalized'
    | 'scale_uniform'
  readonly sceneFrameRange: CanonicalLivingFrameFrameRange
  readonly linkedAttentionEventIds: readonly string[]
  readonly returnsToInitialValue: boolean
  readonly exactFramesDerivedFromCanonicalMasterTiming: true
}

export interface LivingFrameSoundSyncSemanticCueRequest {
  readonly order: number
  readonly soundRequestId: string
  readonly requestDigestSha256: string
  readonly linkedComponentId: string | null
  readonly purpose: LivingFrameSoundPurpose
  readonly priority: LivingFrameSoundPriority
  readonly narrationProtection: LivingFrameNarrationProtection
  readonly duckingExpectation: LivingFrameDuckingExpectation
  readonly semanticTrigger: {
    readonly attentionEventId: string
    readonly eventType: LivingFrameAttentionEventType
    readonly exactAllowedFrameRange: CanonicalLivingFrameFrameRange
    readonly choreographyMotionTrackIds: readonly string[]
    readonly canonicalMotionTracks:
      readonly LivingFrameAttentionResolvedMotionTrack[]
    readonly preferredHitFrameCandidate: number
    readonly preferredHitFrameDerivation:
      | 'last_motion_keyframe_inside_attention_range'
      | 'attention_range_entry'
      | 'attention_range_exit_minus_one'
    readonly finalHitFrameAuthorityProvidedByLivingFrame: false
  }
  readonly canonicalSoundSyncMustReturn: {
    readonly exactStartHitAndEndFrames: true
    readonly attackAndReleaseEnvelope: true
    readonly approvedAssetIdDigestAndProvenance: true
    readonly gainPanStereoRoomAndReverb: true
    readonly narrationDuckingAutomation: true
    readonly storyTimingEventLineage: true
    readonly approvedSnapshotWorkAssetAndRendererLineage: true
    readonly audioQaAndPrivateReviewEvidence: true
  }
  readonly currentResolutionState:
    'pending_canonical_soundsync_resolution'
  readonly exactCuePlacementProvidedByLivingFrame: false
  readonly exactMixProvidedByLivingFrame: false
}

export interface LivingFrameAttentionSoundSyncIntegrationAuthority {
  readonly readOnlyIntegrationCandidateAuthority: true
  readonly planningAuthority: false
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly soundAssetAuthority: false
  readonly soundMixAuthority: false
  readonly narrationDuckingAuthority: false
  readonly rendererAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameAttentionSoundSyncIntegrationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_CLASS
  readonly integrationState:
    typeof LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_STATE
  readonly integrationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly ownerScopeAmendmentDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly executionRequirementsDigestSha256: string
    readonly canonicalTimingBindingDigestSha256: string
    readonly choreographyBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly canonicalMotionSpecDigestsSha256: readonly string[]
  }
  readonly attentionJourney:
    readonly LivingFrameExactAttentionEventBinding[]
  readonly localContrastPrimitiveRequests:
    readonly LivingFrameLocalContrastPrimitiveRequest[]
  readonly semanticScaleBindings:
    readonly LivingFrameExactSemanticScaleBinding[]
  readonly cameraBindings:
    readonly LivingFrameExactCameraChoreographyBinding[]
  readonly soundSyncRequests:
    readonly LivingFrameSoundSyncSemanticCueRequest[]
  readonly metrics: {
    readonly attentionEventCount: number
    readonly motionBoundAttentionMethodCount: number
    readonly localContrastPrimitiveRequestCount: number
    readonly soundEmphasisMethodCount: number
    readonly semanticScaleBindingCount: number
    readonly cameraTrackCount: number
    readonly soundSyncRequestCount: number
  }
  readonly attentionOrderAndCanonicalPhaseAlignmentVerified: true
  readonly focusHandoffRestorePolicyVerified: true
  readonly literalAndDataScaleTruthPreserved: true
  readonly pausedLivingCharacterAndMechanicalRiggingExcluded: true
  readonly semanticSoundTriggersCarryExactAttentionAndMotionLineage: true
  readonly canonicalRendererResolutionPending: boolean
  readonly canonicalSoundSyncResolutionPending: boolean
  readonly activePrivateInternalReady: false
  readonly openGateCodes:
    readonly LivingFrameAttentionSoundSyncOpenGate[]
  readonly authorityBoundary:
    LivingFrameAttentionSoundSyncIntegrationAuthority
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

export interface LivingFrameAttentionSoundSyncIntegration
  extends LivingFrameAttentionSoundSyncIntegrationDraft {
  readonly integrationDigestSha256: string
}
