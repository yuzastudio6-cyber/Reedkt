import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  CaptionTrackAllSubjectEvidence,
} from './caption-track-all-support'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_MEASUREMENT_VERSION =
  'canonical-track-all-sam3_1-l4-mask-qa-measurement-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_PRIVATE_SCENE_REVIEW_VERSION =
  'canonical-track-all-sam3_1-private-scene-review-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_QA_AUTHORITY_VERSION =
  'canonical-track-all-sam3_1-caption-scene-qa-authority-v1' as const

/**
 * Create-only task evidence from the separately funded L4 mask-QA attempt.
 * Kornia CUDA owns the substantive pixel/temporal measurement; OpenCV is an
 * independent deterministic cross-check in the same bounded L4 attempt.
 */
export interface CanonicalTrackAllSam31L4MaskQaMeasurement {
  schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_MASK_QA_MEASUREMENT_VERSION
  measurementId: string
  measurementDigestSha256: string
  invocationId: string
  sam31TaskRef: CaptionDomainRef
  sam31RuntimeResultAdmissionRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  sourcePrivateArtifactRef: CaptionDomainRef
  sourceFrameMappingRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  requestedRange: CaptionDomainFrameRange
  subjectEvidence: CaptionTrackAllSubjectEvidence[]
  l4QaExecution: {
    routeId: 'l4_standard_primary'
    gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1'
    accelerator: 'nvidia_l4'
    approvedWorkItemRef: CaptionDomainRef
    workerLeaseRef: CaptionDomainRef
    executionAttemptRef: CaptionDomainRef
    currentAccountPriceAuthorityRef: CaptionDomainRef
    workerUsageEvidenceRef: CaptionDomainRef
    attemptCostReceiptRef: CaptionDomainRef
    korniaCudaExecutionEvidenceRef: CaptionDomainRef
    opencvCrosscheckExecutionEvidenceRef: CaptionDomainRef
    actualL4GpuExecutionObserved: true
    actualKorniaCudaKernelExecutionObserved: true
    actualOpenCvCrosscheckExecutionObserved: true
    cpuOnlySubstantiveMaskQaUsed: false
    userTriggeredAfterApprovedWork: true
    terminalWorkerStoppedAndScaleBackToZeroVerified: true
    exactAccountEffectiveAttemptCostPersisted: true
  }
  everyRequestedFrameAndSubjectMeasured: true
  sampledOrRepresentativeOnlyMeasurementAccepted: false
  exactMaskManifestAndEveryMaskPngReread: true
  browserOrCallerMeasurementAccepted: false
  pathsUrlsCredentialsOrMediaBytesIncluded: false
  customerCreditsMutated: false
  qaApprovalGranted: false
  assetManifestMutated: false
  renderAuthorized: false
  publicDeliveryAuthorized: false
  productionAuthorityGranted: false
  measuredAt: string
}

/** Independent complete-interval visual review of the measured private mask. */
export interface CanonicalTrackAllSam31PrivateSceneReview {
  schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRIVATE_SCENE_REVIEW_VERSION
  reviewId: string
  reviewDigestSha256: string
  measurementRef: CaptionDomainRef
  sam31TaskRef: CaptionDomainRef
  sam31RuntimeResultAdmissionRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  requestedRange: CaptionDomainFrameRange
  reviewedSubjectEvidenceIds: string[]
  fullResolutionCompleteIntervalPlaybackRef: CaptionDomainRef
  reviewerIdentityRef: CaptionDomainRef
  reviewerRole: 'independent_private_track_all_visual_reviewer'
  reviewedFrameCount: number
  expectedFrameCount: number
  findingCodes: string[]
  everyRequestedFrameAndSubjectReviewed: true
  completeIntervalReviewAccepted: true
  sampledOrRepresentativeOnlyReviewAccepted: false
  reviewerIndependentFromSamAndMaskQaWorkers: true
  browserOrCallerReviewAccepted: false
  providerOrModelCallMade: false
  pathsUrlsCredentialsOrMediaBytesIncluded: false
  customerCreditsMutated: false
  qaApprovalGranted: false
  assetManifestMutated: false
  renderAuthorized: false
  publicDeliveryAuthorized: false
  productionAuthorityGranted: false
  reviewedAt: string
}

/**
 * Backend owner receipt proving the Caption scene-evidence record came from
 * exact SAM 3.1, L4 QA, and independent private-review rereads.
 */
export interface CanonicalTrackAllSam31CaptionSceneQaAuthority {
  schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_CAPTION_SCENE_QA_AUTHORITY_VERSION
  authorityId: string
  authorityDigestSha256: string
  invocationId: string
  supportRequestRef: CaptionDomainRef
  sam31TaskRef: CaptionDomainRef
  sam31RuntimeResultAdmissionRef: CaptionDomainRef
  measurementRef: CaptionDomainRef
  privateSceneReviewRef: CaptionDomainRef
  captionSceneEvidenceRef: CaptionDomainRef
  authenticatedPrincipalVerified: true
  exactCaptionRequestSamTaskResultMeasurementAndReviewReread: true
  actualA100OrQualifiedL4Sam31ExecutionObserved: true
  actualL4KorniaCudaAndOpenCvQaObserved: true
  completeScenePrivateReviewObserved: true
  sceneEvidenceCreateOnlyPersistedAndReread: true
  browserLocalStateUsed: false
  directPeerDispatchPerformed: false
  runtimeExecutionPerformedByAuthorityOwner: false
  assetMutationAuthorityGranted: false
  customerCreditsMutated: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
  admittedAt: string
}
