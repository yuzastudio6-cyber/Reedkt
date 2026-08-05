import type {
  CaptionSoundAdmission,
  CaptionSoundCueRequest,
  CaptionSoundSupportResult,
} from './caption-sound-support'
import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionDomainCanonicalScope } from './caption-domain-contracts'
import type { CaptionMultiTrackSceneGraph } from
  './caption-multi-track-scene-graph'
import type {
  CaptionMotionLock,
  CaptionMotionPlan,
  CaptionStoryTimingResolutionBinding,
} from './caption-storytiming-motion'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  CanonicalSpecialistSupportResumeRecord,
} from './canonical-specialist-support-resume'
import type { SkillContractRef, SkillSupportRequest } from
  './orchestra-skill-contracts'

export const CANONICAL_CAPTION_SOUNDSYNC_AUTHENTICATED_EVIDENCE_RECORD_VERSION =
  'canonical-caption-soundsync-authenticated-evidence-record-v1' as const
export const CANONICAL_CAPTION_SOUNDSYNC_CONTEXT_READ_PORT_VERSION =
  'canonical-caption-soundsync-context-read-port-v1' as const
export const CANONICAL_CAPTION_SOUNDSYNC_OWNER_READ_PORT_VERSION =
  'canonical-caption-soundsync-owner-read-port-v1' as const

export interface CanonicalCaptionSoundSyncContext {
  sceneGraph: CaptionMultiTrackSceneGraph
  motionPlan: CaptionMotionPlan
  motionLock: CaptionMotionLock
  storyTimingResolution: CaptionStoryTimingResolutionBinding
  approvedCaptionEnvelopeRef: CaptionDomainRef
}

export interface CanonicalCaptionSoundSyncContextReadRequest {
  supportRequestRef: SkillContractRef
  captionSoundRequestRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  motionPlanRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  approvedCaptionEnvelopeRef: CaptionDomainRef
}

export interface CanonicalCaptionSoundSyncContextReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SOUNDSYNC_CONTEXT_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_approved_snapshot_master_timing_story_timing_owner'
  readonly callerSuppliedContextAccepted: false
  readExact(input: CanonicalCaptionSoundSyncContextReadRequest): Promise<unknown>
}

export interface CanonicalCaptionSoundSyncOwnerReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SOUNDSYNC_OWNER_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_soundsync_owner'
  readonly callerSuppliedSoundResultAccepted: false
  readExact(input: {
    readonly supportRequest: SkillSupportRequest
    readonly captionSoundRequest: CaptionSoundCueRequest
  }): Promise<unknown>
}

export interface CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_SOUNDSYNC_AUTHENTICATED_EVIDENCE_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  priorCallRef: SkillContractRef
  supportRequestRef: SkillContractRef
  supportRequest: SkillSupportRequest
  captionSoundRequest: CaptionSoundCueRequest
  canonicalContext: CanonicalCaptionSoundSyncContext
  soundSyncResult: CaptionSoundSupportResult
  captionAdmission: CaptionSoundAdmission
  authenticatedOwnerProjection:
    CanonicalAuthenticatedSpecialistSupportArtifactProjection
  createdAt: string
  authenticatedOwnerUserVerified: true
  exactPriorCallAndSupportRequestReread: true
  exactApprovedSnapshotMasterTimingStoryTimingContextReread: true
  exactSoundSyncResultReread: true
  soundSyncResultPersistedCreateOnlyAndReread: true
  dialogueProtectedFinalMixRereadAndQaVerified: true
  storyTimingRemainsFrameOwner: true
  soundSyncRemainsCueAssetTrimMixOwner: true
  browserLocalStateUsed: false
  rawAudioBytesIncluded: false
  mediaPathsOrUrlsIncluded: false
  providerPayloadOrCredentialsIncluded: false
  cueAssetOrMixChosenByCaption: false
  directPeerDispatchPerformed: false
  runtimeExecutionPerformedByBridge: false
  assetMutationPerformedByBridge: false
  costOrBillingMutationPerformedByBridge: false
  finalQaApprovalGrantedByBridge: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionSoundSyncSupportOutcome {
  evidenceRecord: CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord
  resumeRecord: CanonicalSpecialistSupportResumeRecord
}
