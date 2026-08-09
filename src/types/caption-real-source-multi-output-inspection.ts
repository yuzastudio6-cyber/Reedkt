import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  CaptionRealSourceOutputFormat,
} from './caption-remotion-real-source-multi-output-review'

export const CAPTION_REAL_SOURCE_MULTI_OUTPUT_INSPECTION_VERSION =
  'caption-real-source-multi-output-direct-inspection-v1' as const

export type CaptionRealSourceMultiOutputInspectionVariant =
  | 'widescreen_full_motion'
  | 'widescreen_reduced_motion'
  | 'square_full_motion'
  | 'square_reduced_motion'

export interface CaptionRealSourceMultiOutputReviewSpecEvidence {
  variant: CaptionRealSourceMultiOutputInspectionVariant
  outputFormat: CaptionRealSourceOutputFormat
  reducedMotion: boolean
  reviewSpecRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  confirmedOutputFrameRef: CaptionDomainRef
  confirmedOutputWidth: 1920 | 1440
  confirmedOutputHeight: 1080 | 1440
}

export interface CaptionRealSourceMultiOutputRenderEvidence {
  variant: CaptionRealSourceMultiOutputInspectionVariant
  outputFormat: CaptionRealSourceOutputFormat
  reducedMotion: boolean
  reviewSpecRef: CaptionDomainRef
  artifactRef: CaptionDomainRef
  artifactSha256: string
  mimeType: 'video/mp4'
  byteLength: number
  rasterWidth: 640 | 480
  rasterHeight: 360 | 480
  fpsNumerator: 30
  fpsDenominator: 1
  frameCount: number
}

export interface CaptionRealSourceMultiOutputContactSheetEvidence {
  sheetId: string
  variant: CaptionRealSourceMultiOutputInspectionVariant
  reviewSpecRef: CaptionDomainRef
  renderArtifactRef: CaptionDomainRef
  startFrame: 0
  endFrameExclusive: number
  representedFrameCount: number
  rasterRef: CaptionDomainRef
  rasterSha256: string
  rasterWidth: 1692 | 1276
  rasterHeight: 742 | 982
  tileColumns: 13
  tileRows: 10
  thumbnailWidth: 128 | 96
  thumbnailHeight: 72 | 96
  actualRasterOpenedAndInspected: true
}

export interface CaptionRealSourceMultiOutputOriginalFrameInspection {
  inspectionItemId: string
  variant: CaptionRealSourceMultiOutputInspectionVariant
  reviewSpecRef: CaptionDomainRef
  renderArtifactRef: CaptionDomainRef
  frameNumber: number
  rasterRef: CaptionDomainRef
  rasterSha256: string
  rasterWidth: 640 | 480
  rasterHeight: 360 | 480
  actualRasterOpenedAndInspected: true
}

export interface CaptionRealSourceMultiOutputInspectionReceipt {
  schemaVersion: typeof CAPTION_REAL_SOURCE_MULTI_OUTPUT_INSPECTION_VERSION
  inspectionId: string
  inspectionDigestSha256: string
  observedAt: string
  originalSourceRef: CaptionDomainRef
  originalSourceSha256: string
  reviewSpecs: [
    CaptionRealSourceMultiOutputReviewSpecEvidence,
    CaptionRealSourceMultiOutputReviewSpecEvidence,
    CaptionRealSourceMultiOutputReviewSpecEvidence,
    CaptionRealSourceMultiOutputReviewSpecEvidence,
  ]
  renderArtifacts: [
    CaptionRealSourceMultiOutputRenderEvidence,
    CaptionRealSourceMultiOutputRenderEvidence,
    CaptionRealSourceMultiOutputRenderEvidence,
    CaptionRealSourceMultiOutputRenderEvidence,
  ]
  contactSheets: [
    CaptionRealSourceMultiOutputContactSheetEvidence,
    CaptionRealSourceMultiOutputContactSheetEvidence,
    CaptionRealSourceMultiOutputContactSheetEvidence,
    CaptionRealSourceMultiOutputContactSheetEvidence,
  ]
  originalResolutionSpotChecks:
    CaptionRealSourceMultiOutputOriginalFrameInspection[]
  coverage: {
    outputFormatCount: 2
    motionVariantCountPerOutput: 2
    renderArtifactCount: 4
    frameCountPerRender: number
    totalRenderedFramesRepresented: number
    everyRenderedFrameRepresentedExactlyOnce: true
    contactSheetCoverageComplete: true
    originalResolutionSpotCheckFrames: [8, 21, 80, 122]
    originalResolutionSpotChecksComplete: true
    outputSpecificRecompositionInspected: true
    fullReducedMotionSemanticParityInspected: true
    completeMotionPlaybackClaimed: false
  }
  findings: {
    sourceSubstitutionObserved: false
    sourceAspectDistortionObserved: false
    crossCanvasEvidenceReuseObserved: false
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
  designFindings: {
    editorialSidecarReadable: true
    speakerPanelRemainsVisuallyPrimary: true
    fullReducedMotionSemanticParityAccepted: true
    widescreenRecompositionAccepted: true
    squareRecompositionAccepted: true
  }
  inspectionMethod:
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1'
  inspectorClass: 'codex_agent_direct_visual_inspection'
  realSourcePixelsInspected: true
  syntheticEngineeringFixtureUsed: false
  syntheticEngineeringFixtureQualifiedProfessionalAppearance: false
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
