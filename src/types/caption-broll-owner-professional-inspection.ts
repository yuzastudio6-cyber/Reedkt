import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_BROLL_OWNER_PROFESSIONAL_INSPECTION_VERSION =
  'caption-broll-owner-professional-direct-inspection-v1' as const

export type CaptionBrollOwnerInspectionVariant =
  | 'full_motion'
  | 'reduced_motion'

export interface CaptionBrollOwnerProfessionalInspectionReceipt {
  schemaVersion:
    typeof CAPTION_BROLL_OWNER_PROFESSIONAL_INSPECTION_VERSION
  inspectionId: string
  inspectionDigestSha256: string
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope
  ownerResultRef: CaptionDomainRef
  acceptedReviewSpecRefs: [
    {
      variant: 'full_motion'
      reviewSpecRef: CaptionDomainRef
    },
    {
      variant: 'reduced_motion'
      reviewSpecRef: CaptionDomainRef
    },
  ]
  rejectedAttempt: {
    fullMotionReviewSpecRef: CaptionDomainRef
    reducedMotionReviewSpecRef: CaptionDomainRef
    fullMotionRenderArtifactRef: CaptionDomainRef
    reducedMotionRenderArtifactRef: CaptionDomainRef
    inspectedFrameEvidence: Array<{
      frameNumber: number
      rasterRef: CaptionDomainRef
      rasterSha256: string
      rasterWidth: 640
      rasterHeight: 360
      actualRasterOpenedAndInspected: true
    }>
    rejectionReasonCodes: ['face_obstruction_by_hero_typography']
    deterministicTechnicalPassNotSufficient: true
    professionalAppearanceAccepted: false
    retainedAsFailedEvidence: true
  }
  acceptedRenderArtifacts: [
    {
      variant: 'full_motion'
      reviewSpecRef: CaptionDomainRef
      artifactRef: CaptionDomainRef
      artifactSha256: string
      mimeType: 'video/mp4'
      byteLength: number
      rasterWidth: 640
      rasterHeight: 360
      fpsNumerator: 24
      fpsDenominator: 1
      frameCount: 72
    },
    {
      variant: 'reduced_motion'
      reviewSpecRef: CaptionDomainRef
      artifactRef: CaptionDomainRef
      artifactSha256: string
      mimeType: 'video/mp4'
      byteLength: number
      rasterWidth: 640
      rasterHeight: 360
      fpsNumerator: 24
      fpsDenominator: 1
      frameCount: 72
    },
  ]
  contactSheets: [
    {
      variant: 'full_motion'
      renderArtifactRef: CaptionDomainRef
      startFrame: 0
      endFrameExclusive: 72
      representedFrameCount: 72
      rasterRef: CaptionDomainRef
      rasterSha256: string
      rasterWidth: 1536
      rasterHeight: 432
      tileColumns: 12
      tileRows: 6
      thumbnailWidth: 128
      thumbnailHeight: 72
      actualRasterOpenedAndInspected: true
    },
    {
      variant: 'reduced_motion'
      renderArtifactRef: CaptionDomainRef
      startFrame: 0
      endFrameExclusive: 72
      representedFrameCount: 72
      rasterRef: CaptionDomainRef
      rasterSha256: string
      rasterWidth: 1536
      rasterHeight: 432
      tileColumns: 12
      tileRows: 6
      thumbnailWidth: 128
      thumbnailHeight: 72
      actualRasterOpenedAndInspected: true
    },
  ]
  originalResolutionSpotChecks: Array<{
    inspectionItemId: string
    variant: CaptionBrollOwnerInspectionVariant
    reviewSpecRef: CaptionDomainRef
    renderArtifactRef: CaptionDomainRef
    frameNumber: number
    rasterRef: CaptionDomainRef
    rasterSha256: string
    rasterWidth: 640
    rasterHeight: 360
    actualRasterOpenedAndInspected: true
  }>
  coverage: {
    frameCountPerVariant: 72
    variantCount: 2
    totalRenderedFramesRepresented: 144
    everyRenderedFrameRepresentedExactlyOnce: true
    contactSheetCoverageComplete: true
    originalResolutionSpotChecksComplete: true
    cueEntranceHoldAndExitCoverageComplete: true
    fullReducedMotionSemanticParityInspected: true
    completeMotionPlaybackClaimed: false
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
  repair: {
    repairReason: 'hero_typography_obscured_speaker_face'
    repairAction:
      'reposition_hero_typography_to_open_left_side_outside_face_and_gesture'
    rejectedAndAcceptedArtifactsVersionSeparated: true
    acceptedHeroPlacement: 'open_left_side'
    acceptedStableCaptionPlacement: 'lower_safe_band'
    repairDidNotChangeOwnerSelectionCropOrTiming: true
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
