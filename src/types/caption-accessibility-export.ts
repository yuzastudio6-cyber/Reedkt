import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionTextDirection } from './caption-font-runtime'

export const CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION =
  'caption-accessibility-export-plan-v1' as const
export const CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION =
  'caption-accessible-artifact-set-v1' as const
export const CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION =
  'caption-canvas-aware-ass-profile-v2' as const
export const CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION =
  'caption-export-packaging-handoff-v1' as const

export type CaptionAccessibleFormat = 'srt' | 'webvtt' | 'ass'
export type CaptionOutputRecompositionProfile =
  | 'widescreen_balanced_v1'
  | 'vertical_compact_v1'

export interface CaptionAccessibilityCue {
  cueId: string
  sourceNodeId: string | null
  sourceEventRef: CaptionDomainRef | null
  phraseId: string | null
  exactSourceWordIds: string[]
  frameRange: CaptionDomainFrameRange
  stableReadRange: CaptionDomainFrameRange
  cueKind: 'speech' | 'meaningful_sound'
  languageTag: string
  direction: CaptionTextDirection
  speakerLabel: string | null
  completeText: string
  lines: string[]
  graphemeCount: number
  translationRef: CaptionDomainRef | null
  translationState:
    | 'source_language'
    | 'approved_private_fixture'
    | 'pending_review'
  fontResolutionRef: CaptionDomainRef
  targetLanguageRecompositionApplied: true
  sourceLanguageGeometryReused: false
}

export interface CaptionAccessibilityExportPlan {
  schemaVersion: typeof CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION
  planId: string
  planDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sourceSceneGroupRef: CaptionDomainRef
  sourceSceneGroupFrameRef: CaptionDomainRef
  transcriptRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  approvedSnapshotRef: CaptionDomainRef | null
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    outputId: string
    width: number
    height: number
    aspectRatioNumerator: number
    aspectRatioDenominator: number
    fpsNumerator: number
    fpsDenominator: number
  }
  privateReviewFrame: {
    width: number
    height: number
    scaleNumerator: 1
    scaleDenominator: 3
    exactAspectRatioPreserved: true
    finalCustomerCanvasClaimed: false
  }
  sourceLanguageTag: string
  outputLanguageTag: string
  outputDirection: CaptionTextDirection
  recompositionProfileId: CaptionOutputRecompositionProfile
  layoutPolicy: {
    maxGraphemesPerLine: number
    maxLines: 2
    horizontalSafeMarginBasisPoints: number
    verticalSafeMarginBasisPoints: number
    fontSizeBasisPointsOfFrameHeight: number
    lineHeightMilli: number
  }
  cues: CaptionAccessibilityCue[]
  fontQualificationRef: CaptionDomainRef
  fontResolutionRef: CaptionDomainRef
  fontAdmission:
    | 'blocked_canonical_registry'
    | 'contract_fixture_only'
    | 'qualified_private_internal'
  sidecarDisposition: 'private_contract_ready'
  assDisposition:
    | 'private_ascii_fixture_only'
    | 'blocked_missing_qualified_font_or_shaping'
    | 'qualified_private_internal'
  requiredFormats: ['srt', 'webvtt', 'ass']
  canvasAwareAssProfileVersion: typeof CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION
  libassOperationId: 'tool.libass.render_approved_caption_track.v1'
  ffmpegOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
  stableCompleteWordingRetained: true
  meaningfulSoundDescriptionsSupported: true
  speakerLabelsEvidenceBound: true
  outputSpecificRecompositionApplied: true
  englishLineGeometryReusedForLocalizedOutput: false
  reducedMotionChangesStableWording: false
  legacyFixedCanvasAssBuilderPreserved: true
  exactApprovedSnapshotRereadRequiredBeforeExecution: true
  exactStoryTimingRereadRequiredBeforeExecution: true
  exactFontAssetRereadRequiredBeforeExecution: true
  captionOwnsLibassRuntime: false
  captionOwnsFfmpegPackaging: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionAccessibleArtifactDescriptor {
  artifactId: string
  format: CaptionAccessibleFormat
  languageTag: string
  contentType: 'application/x-subrip' | 'text/vtt' | 'text/x-ssa'
  encoding: 'utf-8'
  contentSha256: string
  byteLength: number
  cueCount: number
  canvasRef: CaptionDomainRef | null
  disposition:
    | 'private_contract_ready'
    | 'private_ascii_fixture_only'
    | 'blocked_missing_qualified_font_or_shaping'
    | 'qualified_private_internal'
  privateArtifact: true
  textEmbeddedInPublicReceipt: false
  localPathIncluded: false
  signedUrlIncluded: false
  persisted: false
  qaApproved: false
}

export interface CaptionExportPackagingHandoff {
  schemaVersion: typeof CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION
  handoffId: string
  handoffDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  accessibilityPlanRef: CaptionDomainRef
  artifactSetLocator: {
    id: string
    version: typeof CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION
  }
  approvedSnapshotRef: CaptionDomainRef | null
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  libassOperationId: 'tool.libass.render_approved_caption_track.v1'
  ffmpegOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
  requestedPackaging:
    | 'private_sidecars_only'
    | 'private_ass_fallback_overlay_and_sidecars'
  finalRenderInputRequired: true
  exactArtifactRereadRequired: true
  streamLanguageMetadataRequired: true
  frameRateAndAudioSyncPreservationRequired: true
  technicalProbeRequired: true
  providerCallRequired: false
  operationRegistered: false
  dispatchGranted: false
  runtimeAuthority: false
  assetCreated: false
  qaApprovalGranted: false
  publicDeliveryCreated: false
  productionReady: false
}

export interface CaptionAccessibleArtifactSet {
  schemaVersion: typeof CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION
  artifactSetId: string
  artifactSetDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  accessibilityPlanRef: CaptionDomainRef
  artifacts: CaptionAccessibleArtifactDescriptor[]
  packagingHandoff: CaptionExportPackagingHandoff
  everyCueDerivedFromCanonicalLineage: true
  everyRequiredSidecarPresent: true
  assBlockedWhenFontOrShapingUnqualified: true
  rawChatIncluded: false
  mediaBytesIncluded: false
  credentialsIncluded: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionBuiltAccessibleFile {
  format: CaptionAccessibleFormat
  text: string
  contentSha256: string
  byteLength: number
}
