import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { SkillContractRef, SkillSupportRequest } from './orchestra-skill-contracts'

export const CAPTION_STORYTIMING_REGISTRATION_VERSION =
  'caption-storytiming-registration-v1' as const
export const CAPTION_STORYTIMING_RESOLUTION_VERSION =
  'caption-storytiming-resolution-v1' as const
export const CAPTION_MOTION_PLAN_VERSION = 'caption-motion-plan-v1' as const
export const CAPTION_EFFECTIVE_READ_REPORT_VERSION =
  'caption-effective-read-report-v1' as const
export const CAPTION_CROSS_SYSTEM_HANDOFF_VERSION =
  'caption-cross-system-handoff-v1' as const
export const CAPTION_CAMERA_REQUEST_VERSION = 'caption-camera-request-v1' as const
export const CAPTION_MOTION_LOCK_VERSION = 'caption-motion-lock-v2' as const

export type CaptionMotionPrimitiveKind =
  | 'reveal'
  | 'fade'
  | 'scale'
  | 'slide'
  | 'wipe'
  | 'tracked_move'
  | 'depth_transition'
  | 'emphasis_pulse'
  | 'brush_reveal'
  | 'list_append'
  | 'hero_expansion'
  | 'handoff_morph'
  | 'stable_hold'
  | 'cut'

export type CaptionMotionEasing =
  | 'linear'
  | 'ease_in'
  | 'ease_out'
  | 'ease_in_out'
  | 'spring_restrained'

export interface CaptionStoryTimingRegistrationRequest {
  schemaVersion: typeof CAPTION_STORYTIMING_REGISTRATION_VERSION
  registrationId: string
  registrationDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  pictureLockRef: CaptionDomainRef
  registrations: Array<{
    registrationItemId: string
    nodeId: string
    trackId: string
    phraseId: string
    timingRequirementRef: CaptionDomainRef
    semanticEventIntents: Array<
      | 'caption_on'
      | 'caption_off'
      | 'emphasis_hit'
      | 'hero_hit'
      | 'motion_entry_end'
      | 'motion_exit_start'
      | 'handoff'
      | 'restore'
    >
    minimumStableReadFrames: number
    preferredEntryFrames: number
    preferredExitFrames: number
    interruptionPolicy: 'preserve_accessible_text' | 'stable_cut' | 'defer_handoff'
  }>
  phaseRegistrations: Array<{
    phaseId: string
    storyTimingRequirementRef: CaptionDomainRef
    activeNodeIds: string[]
  }>
  semanticIntentOnly: true
  executableFramesIncluded: false
  storyTimingRemainsSoleFrameAuthority: true
  timelineMutationGranted: false
  runtimeExecutionGranted: false
  finalQaApprovalGranted: false
  productionAuthorityGranted: false
}

export interface CaptionStoryTimingResolutionBinding {
  schemaVersion: typeof CAPTION_STORYTIMING_RESOLUTION_VERSION
  resolutionId: string
  resolutionDigestSha256: string
  registrationRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  storyTimingRef: CaptionDomainRef
  fpsNumerator: number
  fpsDenominator: number
  nodeResolutions: Array<{
    registrationItemId: string
    nodeId: string
    trackId: string
    phraseId: string
    timingRequirementRef: CaptionDomainRef
    cueRange: CaptionDomainFrameRange
    semanticEventRefs: Array<{
      eventIntent: CaptionStoryTimingRegistrationRequest['registrations'][number]['semanticEventIntents'][number]
      eventRef: CaptionDomainRef
      frame: number
    }>
    stableReadRange: CaptionDomainFrameRange
  }>
  phaseResolutions: Array<{
    phaseId: string
    storyTimingRequirementRef: CaptionDomainRef
    resolvedEventRef: CaptionDomainRef
    frameRange: CaptionDomainFrameRange
  }>
  evidenceMode: 'contract_fixture' | 'authenticated_private_runtime'
  exactCanonicalRereadVerified: boolean
  exactMasterTimingDigestVerified: boolean
  storyTimingProducedBinding: true
  captionProducedFinalFrames: false
  parallelClockCreated: false
  timelineMutationGrantedToCaption: false
  runtimeExecutionGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  productionAuthorityGranted: false
}

export interface CaptionMotionPrimitive {
  primitiveId: string
  nodeId: string
  primitive: CaptionMotionPrimitiveKind
  frameRange: CaptionDomainFrameRange
  stableReadImpactFrames: number
  easing: CaptionMotionEasing
  travelBasisPoints: { x: number; y: number }
  startScaleBasisPoints: number
  endScaleBasisPoints: number
  startOpacityBasisPoints: number
  endOpacityBasisPoints: number
  overshootBasisPoints: number
  staggerFrames: number
  interruptionPolicy: 'preserve_accessible_text' | 'stable_cut' | 'defer_handoff'
  semanticReasonCode: string
  reducedMotionReplacement: {
    primitive: 'fade' | 'stable_hold' | 'cut'
    frameRange: CaptionDomainFrameRange
    preservesMeaning: true
    preservesOrder: true
    preservesStableReadRequirement: true
  }
}

export interface CaptionEffectiveReadReport {
  schemaVersion: typeof CAPTION_EFFECTIVE_READ_REPORT_VERSION
  reportId: string
  reportDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  storyTimingRegistrationRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  entries: Array<{
    nodeId: string
    cueRange: CaptionDomainFrameRange
    totalCueFrames: number
    unstableEntryFrames: number
    unstableExitFrames: number
    additionalUnreadableRanges: CaptionDomainFrameRange[]
    additionalUnreadableFrames: number
    effectiveStableReadFrames: number
    minimumStableReadFrames: number
    passed: boolean
    blockerCodes: string[]
  }>
  allEntriesPassed: boolean
  effectiveTimeUsesUnionOfUnreadableFrames: true
  rawCueDurationAloneAccepted: false
  speechClarityOutranksDecorativeMotion: true
}

export interface CaptionCrossSystemHandoff {
  schemaVersion: typeof CAPTION_CROSS_SYSTEM_HANDOFF_VERSION
  handoffId: string
  handoffDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  receiver: 'visual_intelligence' | 'living_frame' | 'transitions'
  handoffKind:
    | 'caption_to_visual'
    | 'caption_to_living_frame'
    | 'transition_support'
  sourceOwner: 'captions'
  targetOwner: 'visual_intelligence' | 'living_frame' | 'transitions'
  sourcePhraseIds: string[]
  exactSourceWordIds: string[]
  semanticConceptId: string
  semanticPurposeCode: string
  continuityToken: string
  storyTimingResolutionRef: CaptionDomainRef
  requestedEventRefs: CaptionDomainRef[]
  accessibleCounterpartNodeIds: string[]
  sourceSupportPayloadRef: CaptionDomainRef
  supportRequestRef: SkillContractRef
  fallback: {
    preserveAccessibleCaption: true
    restoreCreativeCaption: boolean
    selectedFallbackCode: string
  }
  informationOwnershipTransferRequested: boolean
  duplicateConceptAfterSuccessfulTransferAllowed: false
  receiverExecutionClaimed: false
  directPeerDispatchGranted: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  productionAuthorityGranted: false
}

export interface CaptionCameraRequest {
  schemaVersion: typeof CAPTION_CAMERA_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  requestedFrameRange: CaptionDomainFrameRange
  semanticPurposeCode: string
  protectedRegionIds: string[]
  requestedBehavior:
    | 'hold_stable'
    | 'reduce_motion_during_read'
    | 'preserve_caption_region'
    | 'coordinate_semantic_reveal'
  maximumCameraMotionBasisPoints: number
  reducedMotionBehavior: 'hold_stable'
  cameraOwnerResponseRef: CaptionDomainRef | null
  captionControlsCamera: false
  timelineMutationGranted: false
  runtimeExecutionGranted: false
  finalQaApprovalGranted: false
  productionAuthorityGranted: false
}

export interface CaptionMotionPlan {
  schemaVersion: typeof CAPTION_MOTION_PLAN_VERSION
  planId: string
  planDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  storyTimingRegistrationRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  primitives: CaptionMotionPrimitive[]
  effectiveReadReportRef: CaptionDomainRef
  handoffs: CaptionCrossSystemHandoff[]
  cameraRequests: CaptionCameraRequest[]
  supportRequests: SkillSupportRequest[]
  reducedMotionComplete: boolean
  repetitionLimitApplied: true
  sharedAttentionBudgetApplied: true
  modelAuthoredCodeIncluded: false
  storyTimingSoleFrameAuthority: true
  remotionRemainsFinalCanvas: true
  runtimeExecutionGranted: false
  finalQaApprovalGranted: false
  productionAuthorityGranted: false
}

export interface CaptionMotionLock {
  schemaVersion: typeof CAPTION_MOTION_LOCK_VERSION
  lockId: string
  lockDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  motionPlanRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  effectiveReadReportRef: CaptionDomainRef
  rendererSpecRef: CaptionDomainRef | null
  linkedSoundPlanRefs: CaptionDomainRef[]
  state: 'contract_ready' | 'authenticated_private_ready' | 'blocked'
  blockerCodes: string[]
  exactStoryTimingRereadRequiredForExecution: true
  motionChangeInvalidatesLinkedSound: true
  storyTimingSoleFrameAuthority: true
  runtimeExecutionGranted: false
  finalQaApprovalGranted: false
  productionAuthorityGranted: false
}
