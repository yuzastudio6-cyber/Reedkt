import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionMotionPrimitiveKind } from './caption-storytiming-motion'
import type { SkillContractRef, SkillSupportRequest } from './orchestra-skill-contracts'

export const CAPTION_SOUND_CUE_REQUEST_VERSION =
  'caption-sound-cue-request-v1' as const
export const CAPTION_SOUND_SUPPORT_RESULT_VERSION =
  'caption-sound-support-result-v1' as const
export const CAPTION_SOUND_ADMISSION_VERSION =
  'caption-sound-admission-v1' as const
export const CAPTION_SOUND_SUPPORT_RESULT_ARTIFACT_TYPE =
  'caption_sound_support_result' as const

export type CaptionSoundEligibility = 'sound_required' | 'sound_optional' | 'sound_forbidden'
export type CaptionSoundDecision = 'request_cue' | 'remain_silent'

export interface CaptionSoundCueIntent {
  cueIntentId: string
  nodeId: string
  trackId: string
  phraseId: string
  motionPrimitiveId: string
  motionPrimitive: CaptionMotionPrimitiveKind
  eligibility: CaptionSoundEligibility
  decision: CaptionSoundDecision
  targetLayer: 'caption_emphasis' | 'title_card' | 'graphic_handoff'
  semanticReasonCode: string
  storyTimingEventRef: CaptionDomainRef
  requestedCueRelationship:
    | 'hit_on_semantic_event'
    | 'lead_into_semantic_event'
    | 'tail_after_semantic_event'
  requestedTextureCode: string | null
  intensity: 'whisper' | 'subtle_polish' | 'premium_soft'
  narrationProtection: 'strict_voice_first'
  musicRelationship: 'duck_under_voice' | 'do_not_compete' | 'silence'
  lowerCostOrSilentFallback: 'silent'
  providerOrAssetSelectedByCaption: false
  finalFramesManufacturedByCaption: false
}

export interface CaptionSoundCueRequest {
  schemaVersion: typeof CAPTION_SOUND_CUE_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  idempotencyKey: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  motionPlanRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  approvedCaptionEnvelopeRef: CaptionDomainRef
  soundSupportBoundary: {
    targetSkillKey: 'soundsync'
    neutralSupportRequestVersion: 'skill-support-request-v1'
    expectedResultVersion: typeof CAPTION_SOUND_SUPPORT_RESULT_VERSION
    captionMayOnlyRequestSemanticCueIntent: true
    soundSyncOwnsCueSelectionGenerationAndMix: true
  }
  cueIntents: CaptionSoundCueIntent[]
  densityBudget: {
    windowRange: CaptionDomainFrameRange
    maximumRequestedCueCount: number
    requestedCueCount: number
    forbiddenPerWordCuePattern: true
    simultaneousCueCountLimit: 1
  }
  dialogueProtection: {
    dialogueTrackRef: CaptionDomainRef
    dialogueActivityRef: CaptionDomainRef
    finalMixDependencyRequired: true
    dialogueProtectedFinalMixQaRequired: true
    voiceClarityOutranksCueImpact: true
  }
  silentFallback: {
    alwaysAllowed: true
    selectedWhenSupportUnavailable: true
    preservesCaptionMeaning: true
    preservesMotionTiming: true
    createsNoSoundAsset: true
  }
  estimateInputs: {
    requestedCueCount: number
    premiumSoundExpected: false
    lowerCostSilentAlternativeAvailable: true
    priceOrBillingAuthorityClaimed: false
  }
  byteFreeRequest: true
  rawChatIncluded: false
  mediaBytesIncluded: false
  mediaLocatorIncluded: false
  providerPromptIncluded: false
  providerCredentialIncluded: false
  soundAssetSelectionPerformedByCaption: false
  soundGenerationRequestedDirectlyByCaption: false
  mixOrLoudnessAuthorityClaimed: false
  directPeerDispatchRequested: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  costAuthorityGranted: false
  billingAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionSoundSupportResult {
  schemaVersion: typeof CAPTION_SOUND_SUPPORT_RESULT_VERSION
  resultId: string
  resultDigestSha256: string
  supportRequestRef: SkillContractRef
  captionSoundRequestRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  producerSkillKey: 'soundsync'
  cueResults: Array<{
    cueIntentId: string
    disposition: 'admitted' | 'declined' | 'silent'
    reasonCode: string
    storyTimingEventRef: CaptionDomainRef
    soundSyncCueRef: CaptionDomainRef | null
    selectedSoundAssetRef: CaptionDomainRef | null
    trimAndAlignmentRef: CaptionDomainRef | null
    mixPlanRef: CaptionDomainRef | null
    dialogueProtectionRef: CaptionDomainRef | null
  }>
  dialogueProtectedFinalMix: {
    dependencyRef: CaptionDomainRef
    finalMixRef: CaptionDomainRef | null
    dialogueProtectionQaRef: CaptionDomainRef | null
    finalMixRereadVerified: boolean
    voiceClarityPassed: boolean
    noCueMasksDialogue: boolean
  }
  evidenceMode: 'approved_contract_fixture' | 'authenticated_private_runtime'
  exactCanonicalScopeReread: boolean
  exactMotionAndTimingLineageVerified: boolean
  actualSoundRuntimeObserved: boolean
  actualAudioAssetReread: boolean
  actualDialogueProtectedFinalMixQaCompleted: boolean
  browserLocalStateUsed: false
  rawAudioBytesIncluded: false
  pathsOrUrlsIncluded: false
  providerPayloadIncluded: false
  runtimeAuthorityGrantedToCaption: false
  assetAuthorityGrantedToCaption: false
  mixAuthorityGrantedToCaption: false
  costOrBillingAuthorityGrantedToCaption: false
  finalQaApprovalGrantedToCaption: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionSoundAdmission {
  schemaVersion: typeof CAPTION_SOUND_ADMISSION_VERSION
  admissionId: string
  admissionDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  captionSoundRequestRef: CaptionDomainRef
  supportRequestRef: SkillContractRef
  supportResultRef: CaptionDomainRef | null
  cueAdmissions: Array<{
    cueIntentId: string
    selectedDisposition: 'contract_fixture_only' | 'authenticated_private_ready' | 'silent_fallback'
    soundSyncCueRef: CaptionDomainRef | null
    selectedSoundAssetRef: CaptionDomainRef | null
    blockerCodes: string[]
  }>
  disposition:
    | 'contract_ready_silent_fallback'
    | 'authenticated_private_ready'
    | 'silent_fallback_selected'
    | 'blocked_dialogue_protection'
  dialogueProtectedFinalMixRequired: true
  dialogueProtectedFinalMixVerified: boolean
  everyForbiddenCueStayedSilent: true
  requestedCueCountWithinDensityBudget: true
  silentFallbackAvailable: true
  soundSyncRemainsAudioOwner: true
  storyTimingRemainsFrameOwner: true
  captionSelectedProvider: false
  captionCreatedSoundAsset: false
  captionMixedAudio: false
  captionGrantedFinalQa: false
  runtimeExecutionGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionSoundSupportBundle {
  payload: CaptionSoundCueRequest
  supportRequest: SkillSupportRequest
}
