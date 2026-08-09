import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_BROLL_APPROVED_RUN_EXACT_FRAME_PROFESSIONAL_INSPECTION_VERSION =
  'caption-broll-approved-run-exact-frame-professional-direct-inspection-v1' as const

export type CaptionBrollApprovedRunExactFrameInspectionVariant =
  | 'full_motion'
  | 'reduced_motion'

export interface CaptionBrollApprovedRunExactFrameProfessionalInspectionOutput {
  variant: CaptionBrollApprovedRunExactFrameInspectionVariant
  exactFrameReviewRef: CaptionDomainRef
  renderArtifactRef: CaptionDomainRef
  byteLength: number
  width: 3840
  height: 2160
  fps: 30
  frameCount: 127
  codec: 'h264'
  pixelFormat: 'yuv420p'
  colorSpace: 'bt709'
  colorTransfer: 'bt709'
  colorPrimaries: 'bt709'
  durationMilliseconds: 4288
  everyFrameContactSheet: {
    rasterRef: CaptionDomainRef
    representedFrameCount: 127
    rasterWidth: 3840
    rasterHeight: 1080
    tileColumns: 16
    tileRows: 8
    thumbnailWidth: 240
    thumbnailHeight: 135
    actualRasterOpenedAndInspected: true
  }
  exactResolutionSpotChecks: Array<{
    frameNumber: number
    rasterRef: CaptionDomainRef
    rasterWidth: 3840
    rasterHeight: 2160
    actualRasterOpenedAndInspected: true
  }>
  transitionSpotChecks: Array<{
    frameNumber: number
    rasterRef: CaptionDomainRef
    rasterWidth: 3840
    rasterHeight: 2160
    actualRasterOpenedAndInspected: true
  }>
}

/**
 * Caption-owned evidence that typography and layout were inspected on the
 * exact confirmed frame. The underlying source is still a 640x360 private
 * proxy, so this receipt deliberately does not claim final picture quality,
 * final-canvas ownership, qualified postrender AI review, or final QA.
 */
export interface CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt {
  schemaVersion:
    typeof CAPTION_BROLL_APPROVED_RUN_EXACT_FRAME_PROFESSIONAL_INSPECTION_VERSION
  receiptId: string
  receiptDigestSha256: string
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope
  exactFrameInspectionPackageRef: CaptionDomainRef
  sourceProxyReviewPackageRef: CaptionDomainRef
  approvedSnapshotRef: CaptionDomainRef
  executionPackageRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
  outputs: [
    CaptionBrollApprovedRunExactFrameProfessionalInspectionOutput & {
      variant: 'full_motion'
    },
    CaptionBrollApprovedRunExactFrameProfessionalInspectionOutput & {
      variant: 'reduced_motion'
    },
  ]
  coverage: {
    frameCountPerVariant: 127
    variantCount: 2
    totalRenderedFramesRepresented: 254
    everyRenderedFrameRepresentedExactlyOnce: true
    everyFrameThumbnailInspectionPerformed: true
    exactResolutionSpotChecksComplete: true
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
    exactFrameTypographyDefectObserved: false
    exactFrameLayoutDefectObserved: false
  }
  acceptedForCaptionOwnedExactFrameTypographyAndLayout: true
  sourceProxyUpscaleDisclosed: true
  sourcePictureQualityQualified: false
  finalCustomerCanvasClaimed: false
  replacesCanonicalFinalCanvas: false
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
