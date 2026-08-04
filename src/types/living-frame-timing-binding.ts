import type {
  LivingFrameDuckingExpectation,
  LivingFrameNarrationProtection,
  LivingFrameSemanticCueCode,
  LivingFrameSoundPriority,
  LivingFrameSoundPurpose,
  LivingFrameTimingPhase,
} from './living-frame'
import type {
  CanonicalLivingFrameSelectedSceneTreatment,
} from './living-frame-selected-scene-binding'

export const CANONICAL_LIVING_FRAME_TIMING_BINDING_VERSION =
  'canonical-living-frame-timing-binding-v1' as const

export const CANONICAL_LIVING_FRAME_TIMING_BINDING_SOURCE =
  'canonical_living_frame_master_timing_soundsync_binding_compiler' as const

export const CANONICAL_LIVING_FRAME_TIMING_BINDING_COMPONENT_KEY =
  'livingFrameTimingBinding' as const

export const CANONICAL_LIVING_FRAME_TIMING_POLICY_VERSION =
  'canonical-living-frame-segment-visual-timing-policy-v1' as const

export interface CanonicalLivingFrameFrameRange {
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly durationFrames: number
}

export interface CanonicalLivingFrameSemanticPhaseTimingBinding {
  readonly timingRequestId: string
  readonly order: number
  readonly phase: LivingFrameTimingPhase
  readonly cueCode: LivingFrameSemanticCueCode
  readonly frameRange: CanonicalLivingFrameFrameRange
  readonly derivedFromMasterTimingSegment: true
}

export interface CanonicalLivingFrameSoundCueTimingBinding {
  readonly soundRequestId: string
  readonly order: number
  readonly soundSyncCueId: string
  readonly linkedComponentId: string | null
  readonly purpose: LivingFrameSoundPurpose
  readonly priority: LivingFrameSoundPriority
  readonly narrationProtection: LivingFrameNarrationProtection
  readonly duckingExpectation: LivingFrameDuckingExpectation
  readonly frameRange: CanonicalLivingFrameFrameRange
  readonly exactCuePlacementProvided: true
  readonly exactMixProvided: false
  readonly speechPriorityPreserved: true
}

export interface CanonicalLivingFrameVisualTimingBinding {
  readonly visualTimingId: string
  readonly frameRange: CanonicalLivingFrameFrameRange
  readonly revealFrames: number
  readonly holdFrames: number
  readonly exitFrames: number
  readonly captionPlaneRemainsAboveLivingFrame: true
}

export interface CanonicalLivingFrameSceneTimingBinding {
  readonly sceneId: string
  readonly treatment: CanonicalLivingFrameSelectedSceneTreatment
  readonly canonicalSegmentId: string
  readonly canonicalSegmentDigestSha256: string
  readonly segmentFrameRange: CanonicalLivingFrameFrameRange
  readonly visualTiming: CanonicalLivingFrameVisualTimingBinding
  readonly semanticPhaseBindings:
    readonly CanonicalLivingFrameSemanticPhaseTimingBinding[]
  readonly soundCueBindings:
    readonly CanonicalLivingFrameSoundCueTimingBinding[]
}

export interface CanonicalLivingFrameTimingBindingAuthorityBoundary {
  readonly serverDerivedTimingBindingAuthority: true
  readonly masterTimingPlanMutationAuthority: false
  readonly soundSyncPlanMutationAuthority: false
  readonly exactVisualPhaseFrameAuthority: true
  readonly exactSoundCuePlacementAuthority: true
  readonly exactAudioMixAuthority: false
  readonly captionTimingAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly rendererAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameTimingBindingDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_TIMING_BINDING_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_TIMING_BINDING_SOURCE
  readonly timingPolicyVersion:
    typeof CANONICAL_LIVING_FRAME_TIMING_POLICY_VERSION
  readonly evidenceClass:
    'private_internal_server_derived_master_timing_soundsync_binding'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings: {
    readonly executionRequirementsDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly currentSoundSyncDigestSha256: string
    readonly canonicalSegmentsDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
  }
  readonly fps: number
  readonly totalFrames: number
  readonly deliberateNonUse: boolean
  readonly scenes: readonly CanonicalLivingFrameSceneTimingBinding[]
  readonly metrics: {
    readonly selectedSceneCount: number
    readonly semanticPhaseBindingCount: number
    readonly soundCueBindingCount: number
  }
  readonly authorityBoundary:
    CanonicalLivingFrameTimingBindingAuthorityBoundary
  readonly masterTimingRemainsSoleClockAuthority: true
  readonly soundSyncRemainsSoleAudioTimingSystem: true
  readonly captionSpeechAndMeaningPriorityPreserved: true
  readonly containsAudioMediaOrCaptionText: false
  readonly containsRawChatTranscriptOrOperationalMediaData: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameTimingBinding
  extends CanonicalLivingFrameTimingBindingDraft {
  readonly timingBindingDigestSha256: string
}
