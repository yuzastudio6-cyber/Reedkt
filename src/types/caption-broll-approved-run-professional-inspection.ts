import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_BROLL_APPROVED_RUN_PROFESSIONAL_INSPECTION_VERSION =
  'caption-broll-approved-run-professional-direct-inspection-v1' as const

export type CaptionBrollApprovedRunInspectionVariant =
  | 'full_motion'
  | 'reduced_motion'

export interface CaptionBrollApprovedRunProfessionalInspectionOutput {
  variant: CaptionBrollApprovedRunInspectionVariant
  reviewSpecRef: CaptionDomainRef
  renderArtifactRef: CaptionDomainRef
  byteLength: number
  width: 640
  height: 360
  fps: 30
  frameCount: 127
  everyFrameContactSheet: {
    rasterRef: CaptionDomainRef
    representedFrameCount: 127
    rasterWidth: 2560
    rasterHeight: 720
    tileColumns: 16
    tileRows: 8
    thumbnailWidth: 160
    thumbnailHeight: 90
    actualRasterOpenedAndInspected: true
  }
  originalResolutionSpotChecks: Array<{
    frameNumber: number
    rasterRef: CaptionDomainRef
    rasterWidth: 640
    rasterHeight: 360
    actualRasterOpenedAndInspected: true
  }>
  transitionSpotChecks: Array<{
    frameNumber: number
    rasterRef: CaptionDomainRef
    rasterWidth: 640
    rasterHeight: 360
    actualRasterOpenedAndInspected: true
  }>
}

export interface CaptionBrollApprovedRunProfessionalInspectionReceipt {
  schemaVersion:
    typeof CAPTION_BROLL_APPROVED_RUN_PROFESSIONAL_INSPECTION_VERSION
  receiptId: string
  receiptDigestSha256: string
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope
  inspectionPackageRef: CaptionDomainRef
  baselineTechnicalPreviewRef: CaptionDomainRef
  ownerRequestRef: CaptionDomainRef
  ownerResultRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  canonicalTranscriptEvidenceRef: CaptionDomainRef
  outputs: [
    CaptionBrollApprovedRunProfessionalInspectionOutput & {
      variant: 'full_motion'
    },
    CaptionBrollApprovedRunProfessionalInspectionOutput & {
      variant: 'reduced_motion'
    },
  ]
  coverage: {
    frameCountPerVariant: 127
    variantCount: 2
    totalRenderedFramesRepresented: 254
    everyRenderedFrameRepresentedExactlyOnce: true
    completeTimePixelInspectionPerformed: true
    originalResolutionSpotChecksComplete: true
    transitionEntranceHoldAndExitCoverageComplete: true
    fullReducedMotionSemanticParityInspected: true
    completeMotionPlaybackInspectionPerformed: false
  }
  findings: {
    sourceSubstitutionObserved: false
    sourceAspectDistortionObserved: false
    faceObstructionObserved: false
    gestureObstructionObserved: false
    captionClippingObserved: false
    phraseOverflowObserved: false
    heroAndAccessiblePlateCollisionObserved: false
    unstablePlacementObserved: false
    unusableCueTransitionObserved: false
    stuckCaptionLayerObserved: false
    tailTruncationObserved: false
  }
  acceptedForCaptionOwnedProfessionalAppearance: true
  technicalPreviewAcceptedAsFinalCaptionDesign: false
  motionVariantOutputsByteDistinct: true
  deterministicTechnicalQaReplaced: false
  qualifiedSharedPostrenderAiReviewClaimed: false
  independentFinalQaClaimed: false
  browserLocalCompletionClaimed: false
  mediaBytesSerialized: false
  localPathsSerialized: false
  providerCallMade: false
  operationDispatchAuthorityGranted: false
  repairExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
