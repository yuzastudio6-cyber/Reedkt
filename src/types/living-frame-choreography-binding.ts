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
} from './living-frame'
import type {
  LivingFrameMotionProperty,
  LivingFrameMotionRestorationExpectation,
  LivingFrameMotionTrackRole,
} from './living-frame-deterministic-motion'

export const LIVING_FRAME_CHOREOGRAPHY_BINDING_VERSION =
  'living-frame-choreography-binding-v1' as const

export const LIVING_FRAME_CHOREOGRAPHY_BINDING_CLASS =
  'controlled_non_executable_semantic_choreography_binding_candidate' as const

export const LIVING_FRAME_CHOREOGRAPHY_BINDING_STATES = [
  'candidate_pending_canonical_timing_soundsync_and_snapshot',
  'blocked_by_unsupported_attention_or_scale_treatment',
] as const
export type LivingFrameChoreographyBindingState =
  (typeof LIVING_FRAME_CHOREOGRAPHY_BINDING_STATES)[number]

export const LIVING_FRAME_CHOREOGRAPHY_OPEN_GATES = [
  'current_living_frame_component_reread_required',
  'current_motion_bundle_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_attention_event_timing_required',
  'canonical_soundsync_projection_required',
  'canonical_sound_mix_and_ducking_required',
  'canonical_renderer_plan_projection_required',
  'canonical_snapshot_projection_required',
  'canonical_asset_manifest_linkage_required',
  'canonical_work_graph_projection_required',
  'canonical_qa_projection_required',
  'canonical_private_remotion_review_required',
  'local_contrast_renderer_primitive_required',
  'unsupported_attention_method_binding',
  'unsupported_semantic_scale_binding',
] as const
export type LivingFrameChoreographyOpenGate =
  (typeof LIVING_FRAME_CHOREOGRAPHY_OPEN_GATES)[number]

export interface LivingFrameAttentionTrackBindingDraft {
  readonly attentionEventId: string
  readonly motionTrackIds: readonly string[]
  readonly soundRequestIds: readonly string[]
}

export interface LivingFrameSemanticScaleTrackBindingDraft {
  readonly semanticScaleRequestId: string
  readonly motionTrackIds: readonly string[]
}

export interface LivingFrameAttentionMethodCoverage {
  readonly method: LivingFrameAttentionMethod
  readonly motionTrackIds: readonly string[]
  readonly soundRequestIds: readonly string[]
  readonly coverage:
    | 'deterministic_motion_candidate'
    | 'semantic_sound_request_preserved'
    | 'renderer_primitive_still_required'
}

export interface LivingFrameAttentionChoreographyBinding {
  readonly order: number
  readonly attentionEventId: string
  readonly eventType: LivingFrameAttentionEventType
  readonly target: LivingFrameAttentionTarget
  readonly methodCoverage: readonly LivingFrameAttentionMethodCoverage[]
  readonly motionTrackIds: readonly string[]
  readonly soundRequestIds: readonly string[]
  readonly restorationCandidatePresent: boolean
  readonly exactFramesStillOwnedByMasterTiming: true
}

export interface LivingFrameSemanticScaleChoreographyBinding {
  readonly semanticScaleRequestId: string
  readonly componentId: string
  readonly mode: LivingFrameSemanticScaleMode
  readonly meaning: LivingFrameSemanticScaleMeaning
  readonly factualGuard: LivingFrameFactualScaleGuard
  readonly treatment:
    | 'literal_relationship_preserved_without_component_scale'
    | 'data_proportion_preserved_without_component_scale'
    | 'perspective_scale_track_candidate'
    | 'editorial_symbolic_scale_track_candidate'
  readonly motionTrackIds: readonly string[]
  readonly factualRelationshipMustBeRevalidated: true
}

export interface LivingFrameSoundChoreographyProjection {
  readonly order: number
  readonly soundRequestId: string
  readonly linkedComponentId: string | null
  readonly purpose: LivingFrameSoundPurpose
  readonly priority: LivingFrameSoundPriority
  readonly narrationProtection: LivingFrameNarrationProtection
  readonly duckingExpectation: LivingFrameDuckingExpectation
  readonly exactCuePlacementProvided: false
  readonly exactMixProvided: false
  readonly downstreamSoundSyncRequired: boolean
}

export interface LivingFrameChoreographyMotionBudget {
  readonly primaryMotionGroupCount: number
  readonly maximumConcurrentTrackCount: number
  readonly cameraTrackCount: number
  readonly restorationTrackCount: number
  readonly sceneComponentCount: number
  readonly animatedSceneComponentCount: number
  readonly stillSceneComponentCount: number
  readonly onePrimaryMotionGroupAtATimeVerified: true
  readonly stillnessPreservedAsDesignState: true
}

export interface LivingFrameChoreographyMetrics {
  readonly attentionEventCount: number
  readonly coveredAttentionMethodCount: number
  readonly rendererPrimitiveAttentionMethodCount: number
  readonly semanticScaleRequestCount: number
  readonly soundRequestCount: number
  readonly boundMotionTrackCount: number
  readonly unboundMotionTrackCount: number
}

export interface LivingFrameChoreographyAuthorityBoundary {
  readonly semanticConformanceCandidateOnly: true
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly exactSoundCueAuthority: false
  readonly soundMixAuthority: false
  readonly rendererPlanAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameChoreographyBindingDraft {
  readonly contractVersion: typeof LIVING_FRAME_CHOREOGRAPHY_BINDING_VERSION
  readonly bindingClass: typeof LIVING_FRAME_CHOREOGRAPHY_BINDING_CLASS
  readonly sceneId: string
  readonly sourceBindings: {
    readonly livingFrameComponentDigestSha256: string
    readonly deterministicMotionBundleDigestSha256: string
    readonly masterTimingPlanId: string
    readonly masterTimingPlanDigestSha256: string
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
  }
  readonly attentionBindings:
    readonly LivingFrameAttentionChoreographyBinding[]
  readonly semanticScaleBindings:
    readonly LivingFrameSemanticScaleChoreographyBinding[]
  readonly soundRequestProjections:
    readonly LivingFrameSoundChoreographyProjection[]
  readonly motionBudget: LivingFrameChoreographyMotionBudget
  readonly boundMotionTracks: readonly {
    readonly trackId: string
    readonly componentId: string
    readonly property: LivingFrameMotionProperty
    readonly role: LivingFrameMotionTrackRole
    readonly restorationExpectation:
      LivingFrameMotionRestorationExpectation
  }[]
  readonly bindingState: LivingFrameChoreographyBindingState
  readonly openGateCodes: readonly LivingFrameChoreographyOpenGate[]
  readonly metrics: LivingFrameChoreographyMetrics
  readonly authorityBoundary: LivingFrameChoreographyAuthorityBoundary
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolWorkQueueCostOrApprovalRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly semanticRequestsRemainNonExecutable: true
  readonly canonicalMasterTimingAndSoundSyncRemainAuthority: true
  readonly subjectSpecificRouting: false
}

export interface LivingFrameChoreographyBinding
  extends LivingFrameChoreographyBindingDraft {
  readonly bindingDigestSha256: string
}
