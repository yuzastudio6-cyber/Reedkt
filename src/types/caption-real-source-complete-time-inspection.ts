import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_VERSION =
  'caption-real-source-complete-time-direct-inspection-v1' as const

export type CaptionRealSourceInspectionVariant =
  | 'full_motion'
  | 'reduced_motion'

export interface CaptionRealSourceContactSheetEvidence {
  sheetId: string
  variant: CaptionRealSourceInspectionVariant
  renderArtifactRef: CaptionDomainRef
  sheetIndex: number
  startFrame: number
  endFrameExclusive: number
  representedFrameCount: number
  rasterRef: CaptionDomainRef
  rasterSha256: string
  rasterWidth: 924
  rasterHeight: 1624
  tileColumns: 5
  tileRows: 5
  thumbnailWidth: 180
  thumbnailHeight: 320
  actualRasterOpenedAndInspected: true
}

export interface CaptionRealSourceOriginalFrameInspection {
  inspectionItemId: string
  variant: CaptionRealSourceInspectionVariant
  renderArtifactRef: CaptionDomainRef
  frameNumber: number
  rasterRef: CaptionDomainRef
  rasterSha256: string
  rasterWidth: 360
  rasterHeight: 640
  actualRasterOpenedAndInspected: true
}

export interface CaptionRealSourceCompleteTimeInspectionReceipt {
  schemaVersion: typeof CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_VERSION
  inspectionId: string
  inspectionDigestSha256: string
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope
  fullMotionReviewSpecRef: CaptionDomainRef
  reducedMotionReviewSpecRef: CaptionDomainRef
  renderArtifacts: [
    {
      variant: 'full_motion'
      artifactRef: CaptionDomainRef
      mimeType: 'video/mp4'
      byteLength: number
      rasterWidth: 360
      rasterHeight: 640
      fpsNumerator: 30
      fpsDenominator: 1
      frameCount: number
    },
    {
      variant: 'reduced_motion'
      artifactRef: CaptionDomainRef
      mimeType: 'video/mp4'
      byteLength: number
      rasterWidth: 360
      rasterHeight: 640
      fpsNumerator: 30
      fpsDenominator: 1
      frameCount: number
    },
  ]
  contactSheets: CaptionRealSourceContactSheetEvidence[]
  originalResolutionSpotChecks: CaptionRealSourceOriginalFrameInspection[]
  coverage: {
    frameCountPerVariant: number
    variantCount: 2
    totalRenderedFramesRepresented: number
    everyFrameRepresentedExactlyOnce: true
    contactSheetCoverageComplete: true
    originalResolutionSpotChecksComplete: true
    completeMotionPlaybackClaimed: false
  }
  findings: {
    faceObstructionObserved: false
    gestureObstructionObserved: false
    captionClippingObserved: false
    phraseOverflowObserved: false
    heroAndAccessiblePlateCollisionObserved: false
    unstablePlacementObserved: false
    unusableCueTransitionObserved: false
    tailTruncationObserved: false
  }
  inspectionMethod:
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1'
  inspectorClass: 'codex_agent_direct_visual_inspection'
  realSourcePixelsInspected: true
  syntheticEngineeringFixtureUsed: false
  acceptedForCaptionOwnedProfessionalAppearance: true
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
