import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_LIVING_FRAME_REQUEST_VERSION =
  'caption-direction-living-frame-request-v1' as const
export const LIVING_FRAME_CAPTION_RESPONSE_VERSION =
  'living-frame-caption-direction-response-v1' as const
export const CAPTION_LIVING_FRAME_ADAPTER_VERSION =
  'caption-direction-living-frame-adapter-v1' as const

export interface CaptionLivingFrameRequest {
  schemaVersion: typeof CAPTION_LIVING_FRAME_REQUEST_VERSION
  requestId: string
  requestDigestSha256: string
  idempotencyKey: string
  createdForPhase: 'planning_draft' | 'approved_projection'
  receiverSkillId: 'motion.living_frame_storytelling'
  canonicalScope: CaptionDomainCanonicalScope & { handoffId: string }
  captionPlanRef: CaptionDomainRef
  captionProjectionRef: CaptionDomainRef
  canonicalTranscript: {
    artifactRef: CaptionDomainRef
    language: string
    sourceSegmentIds: string[]
    phraseIds: string[]
    exactSourceWordIds: string[]
  }
  semanticRequest: {
    conceptId: string
    classification: 'cross_system_transform'
    purposeCode: string
    visualVerbCode: string
    sourcePhraseIds: string[]
    exactSourceWordIds: string[]
    sourceOwner: 'caption'
    intendedTargetOwner: 'living_frame'
    duplicateConceptAfterSuccessfulTransferAllowed: false
    restoreCaptionOnFailure: true
  }
  confirmedFrame: {
    outputId: string
    width: number
    height: number
    aspectRatioNumerator: number
    aspectRatioDenominator: number
    confirmedOutputFrameDigestSha256: string
  }
  reservation: {
    regions: Array<{
      regionId: string
      normalizedBasisPoints: { x: number; y: number; width: number; height: number }
      pixelBounds: { x: number; y: number; width: number; height: number }
    }>
    captionPlanePriority: number
    protectedRegionIds: string[]
    desiredRange: CaptionDomainFrameRange
    desiredPhraseBoundaryIds: string[]
    fallbackRegionIds: string[]
  }
  timing: {
    masterTimingRef: CaptionDomainRef
    storyTimingRef: CaptionDomainRef
    eventRefs: CaptionDomainRef[]
    cueRefs: CaptionDomainRef[]
    semanticStartIntent: string
    semanticHitIntent: string
    semanticHoldIntent: string
    semanticExitIntent: string
    finalLivingFrameFramesManufacturedByCaption: false
  }
  style: {
    captionStyleProfileRef: CaptionDomainRef
    approvedSemanticColorTokenRefs: CaptionDomainRef[]
    motionIntentCode: string
    reducedMotionIntentCode: string
  }
  dependencies: {
    layoutOccupancyManifestRef: CaptionDomainRef
    visualAssetExpectationRefs: CaptionDomainRef[]
    depthExpectationRefs: CaptionDomainRef[]
    maskExpectationRefs: CaptionDomainRef[]
    livingFrameComponentVersionExpected: string
    captionComponentVersion: string
  }
  estimateInputs: {
    requestedComplexityCeiling: 'restrained' | 'moderate' | 'expressive'
    premiumOperationPermissionExpected: boolean
    lowerCostFallbackPreferred: boolean
    billingAuthorityClaimed: false
  }
  fallbackLadder: string[]
  qaExpectationCodes: string[]
  accessibility: {
    completeCaptionCounterpartRetained: true
    reducedMotionRequired: boolean
  }
  documentaryFactSafetyRefs: CaptionDomainRef[]
  privateArtifactPolicy: {
    tenantScoped: true
    retentionClass: string
    accessClass: string
    byteFreeRequest: true
    replayPolicyCode: string
    stalenessRefs: CaptionDomainRef[]
    rawChatIncluded: false
    mediaBytesIncluded: false
    urlsOrPathsIncluded: false
    credentialsIncluded: false
    executablePromptTextIncluded: false
  }
  operationRegistered: false
  dispatchGranted: false
  runtimeAuthority: false
  assetCreated: false
  qaApprovalGranted: false
  publicDeliveryCreated: false
  productionReady: false
}

export type CaptionLivingFrameDisposition =
  | 'supported_selected'
  | 'supported_simpler_treatment'
  | 'declined_not_applicable'
  | 'declined_caption_or_speaker_priority'
  | 'blocked_stale_authority'
  | 'blocked_missing_canonical_authority'

export interface LivingFrameCaptionResponse {
  schemaVersion: typeof LIVING_FRAME_CAPTION_RESPONSE_VERSION
  responseId: string
  responseDigestSha256: string
  originalRequestRef: CaptionDomainRef
  originalRequestIdempotencyKey: string
  canonicalScope: CaptionLivingFrameRequest['canonicalScope']
  disposition: CaptionLivingFrameDisposition
  reasonCode: string
  safeUserSummary: string
  livingFrameComponentRef: CaptionDomainRef
  semanticProjectionRef: CaptionDomainRef
  selectedScene: {
    admissionRef: CaptionDomainRef | null
    bindingRef: CaptionDomainRef | null
    selectedSceneIds: string[]
    selectedModes: string[]
    selectedTreatments: string[]
    deliberateNonUse: boolean
    executionClaimed: false
  }
  informationOwnerHandoff: {
    state: 'retained_by_caption' | 'requested' | 'accepted' | 'restored_to_caption'
    attentionEventIds: string[]
    semanticTimingRequestIds: string[]
  }
  timing: {
    masterTimingRef: CaptionDomainRef
    storyTimingEventRefs: CaptionDomainRef[]
    storyTimingCueRefs: CaptionDomainRef[]
    livingFrameTimingBindingRef: CaptionDomainRef | null
    parallelClockCreated: false
  }
  layoutDependencies: {
    occupancyRegionRefs: CaptionDomainRef[]
    captionSafeExpectationRefs: CaptionDomainRef[]
    faceGestureProtectionRefs: CaptionDomainRef[]
    depthBandRefs: CaptionDomainRef[]
    occlusionExpectationRefs: CaptionDomainRef[]
    maskArtifactRefs: CaptionDomainRef[]
    unresolvedGateCodes: string[]
    captionPlaneAboveLivingFrame: true
  }
  estimateProjectionRef: CaptionDomainRef | null
  requiredCapabilityCategories: string[]
  requiredWorkCategories: string[]
  selectedFallbackCode: string
  captionRetainsOrRegainsInformationOwnership: boolean
  qaEvidenceRequirementCodes: string[]
  stalenessTuple: {
    transcriptRef: CaptionDomainRef
    captionPlanRef: CaptionDomainRef
    confirmedFrameRef: CaptionDomainRef
    layoutOccupancyRef: CaptionDomainRef
    masterTimingRef: CaptionDomainRef
    livingFrameComponentRef: CaptionDomainRef
    selectedSceneBindingRef: CaptionDomainRef | null
    approvedSnapshotRef: CaptionDomainRef | null
  }
  operationRegistered: false
  dispatchGranted: false
  providerAuthority: false
  runtimeAuthority: false
  assetCreated: false
  qaApprovalGranted: false
  publicDeliveryCreated: false
  productionReady: false
}
