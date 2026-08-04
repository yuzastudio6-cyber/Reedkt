/**
 * Historical Qwen visual-understanding DTO compatibility only.
 *
 * Fresh visual execution moved to WeEditPro Visual Intelligence. This module
 * intentionally contains no filesystem reader, subprocess, model loader,
 * network client, Google authentication, runtime URL, or provider response
 * parser. Keeping the old DTO identity allows immutable Qwen-era evidence to
 * be reread without leaving an executable visual-provider transport behind.
 */

interface EditReferenceVisualUnderstandingResult {
  status: 'completed' | 'blocked'
  summary?: string
  visibleSubjects: string[]
  visibleObjects: string[]
  screenTextRegions: string[]
  compositionRisks: string[]
  brollOpportunities: string[]
  captionObservations: string[]
  styleObservations: string[]
  frameEvidence: Array<{
    frameId: string
    timeSeconds?: number
    summary: string
    safeZones: string[]
    uncertainty: string[]
  }>
  evidenceArtifactIds: string[]
  blockers: string[]
  warnings: string[]
}

interface EditReferenceVisualUnderstandingInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  mediaAssetId: string
  analysisRole: 'source_edit_planning' | 'reference_style_analysis'
  frameArtifacts: Array<{
    artifactId: string
    localFilePath: string
    timeSeconds?: number
    checksum?: string
  }>
}

export type QwenVisualLanguageCategory =
  | 'composition_hierarchy'
  | 'framing_and_shot_scale'
  | 'subject_placement'
  | 'camera_behavior'
  | 'scene_rhythm'
  | 'visual_density'
  | 'broll_pattern'
  | 'transition_language'
  | 'caption_visible_text_and_overlay'
  | 'graphic_overlay_language'
  | 'color_contrast_and_lighting'
  | 'visual_storytelling'

export interface QwenVisualLanguageObservation {
  category: QwenVisualLanguageCategory
  summary: string
  frameIds: string[]
  confidence: number
  identityRelated: boolean
  requiresUserReview: boolean
}

export interface QwenVisualTransferSafety {
  observationMode: 'transferable_visual_principles_only'
  exactLayoutInstructionCreated: false
  exactVisibleTextRetained: false
  exactCameraPathInstructionCreated: false
  identityTransferInstructionCreated: false
  copyrightedAssetInstructionCreated: false
}

export type QwenColorTreatmentCategory =
  | 'palette_relationship'
  | 'temperature_character'
  | 'white_balance_character'
  | 'contrast_structure'
  | 'saturation_vibrance'
  | 'luma_distribution'
  | 'highlight_rolloff'
  | 'shadow_treatment'
  | 'skin_tone_protection'
  | 'scene_consistency'
  | 'overall_color_character'

export interface QwenColorTreatmentObservation {
  category: QwenColorTreatmentCategory
  summary: string
  frameIds: string[]
  confidence: number
  transferability:
    | 'transferable_principle'
    | 'context_only'
    | 'non_transferable'
  requiresUserReview: boolean
  skinToneRelated: boolean
  brandColorRelated: boolean
  hdrOrColorManagementRelated: boolean
}

export interface QwenColorTransferSafety {
  observationMode: 'generalized_tonal_principles_only'
  exactPaletteSwatchesRetained: false
  exactColorValuesRetained: false
  exactCurvesOrControlPointsRetained: false
  exactGradeSettingsRetained: false
  exactLutIdentityOrDataRetained: false
  exactLookTransformRetained: false
  sourceBrandColorAssetCopied: false
  executableTargetGradeCreated: false
}

export interface QwenTechnicalColorContext {
  schemaVersion: 'edit-reference-technical-color-context-v1'
  resultDigestSha256: string
  coverage: 'full' | 'partial'
  sampleCount: number
  scannedDurationSeconds: number
  pixelFormat?: string
  colorSpace?: string
  colorTransfer?: string
  colorPrimaries?: string
  colorRange?: string
  hdrTransfer: 'pq' | 'hlg' | 'not_hdr_signaled' | 'unknown'
  lumaAverage8Bit?: number
  lumaObservedMinimum8Bit?: number
  lumaObservedMaximum8Bit?: number
  lumaRobustRangeAverage8Bit?: number
  saturationAverage8Bit?: number
  saturationRobustRangeAverage8Bit?: number
  chromaUAverage8Bit?: number
  chromaVAverage8Bit?: number
  temporalLumaDifferenceAverage8Bit?: number
  temporalChromaDifferenceAverage8Bit?: number
  outOfRangePixelRatioAverage?: number
  technicalDistributionAnalysisRan: true
  semanticColorAnalysisRan: false
  whiteBalanceInferenceRan: false
  temperatureInferenceRan: false
  skinToneAnalysisRan: false
  shotMatchAnalysisRan: false
  lutReconstructionRan: false
}

export type QwenGraphicsMotionCategory =
  | 'titles'
  | 'cards'
  | 'lower_thirds'
  | 'icons'
  | 'spacing'
  | 'layout_hierarchy'
  | 'motion_intensity'
  | 'entry_exit_behavior'
  | 'overlay_placement'
  | 'ui_demonstration_patterns'
  | 'transition_motion'

export interface QwenGraphicsMotionObservation {
  category: QwenGraphicsMotionCategory
  summary: string
  frameIds: string[]
  confidence: number
  transferability:
    | 'transferable_principle'
    | 'context_only'
    | 'non_transferable'
  requiresUserReview: boolean
  visibleTextRelated: boolean
  brandOrUiIdentityRelated: boolean
  timingRelated: boolean
}

export interface QwenGraphicsMotionTransferSafety {
  observationMode: 'generalized_graphics_motion_principles_only'
  exactGraphicAssetsRetained: false
  exactReferenceTextOrIconIdentityRetained: false
  exactLayoutOrSpacingValuesRetained: false
  exactAnimationKeyframesOrCurvesRetained: false
  exactTransitionPathOrTimingRetained: false
  exactBrandOrUiIdentityRetained: false
  sourceGraphicOrUiAssetCopied: false
  executableTargetGraphicsMotionOperationCreated: false
}

export interface QwenTechnicalMotionContext {
  schemaVersion: 'edit-reference-technical-motion-context-v1'
  resultDigestSha256: string
  coverage: 'full' | 'partial'
  sampleCount: number
  scannedDurationSeconds: number
  activityThreshold8Bit: number
  highActivityThreshold8Bit: number
  activeSampleRatio: number
  highActivitySampleRatio: number
  peakSampleCount: number
  technicalFrameDifferenceAnalysisRan: true
  semanticMotionAnalysisRan: false
  cameraMotionInferenceRan: false
  objectTrackingRan: false
  transitionClassificationRan: false
  graphicsEntryExitAnalysisRan: false
  opticalFlowAnalysisRan: false
  rawFramePixelsPersisted: false
  rawDifferenceFramesPersisted: false
  rawHistogramPersisted: false
  rawProcessOutputPersisted: false
}

export type QwenCaptionDesignCategory =
  | 'font_character'
  | 'weight_treatment'
  | 'size_hierarchy'
  | 'placement'
  | 'safe_zone_behavior'
  | 'line_break_pattern'
  | 'highlighted_word_treatment'
  | 'color_treatment'
  | 'stroke_shadow_background'
  | 'animation_style'
  | 'entry_exit_timing'
  | 'caption_density'
  | 'spacing'
  | 'speech_alignment'
  | 'readability'

export interface QwenCaptionDesignObservation {
  category: QwenCaptionDesignCategory
  summary: string
  frameIds: string[]
  confidence: number
  transferability:
    | 'transferable_principle'
    | 'context_only'
    | 'non_transferable'
  timingBasis: 'frame_sequence' | 'segment' | 'word'
  requiresUserReview: boolean
  safeZoneRelated: boolean
  speechTimingRelated: boolean
  fontOrBrandRelated: boolean
  claimRelated: boolean
  exactReferenceWordingRetained: false
  exactFontIdentityClaimed: false
}

export interface QwenCaptionDesignTransferSafety {
  observationMode: 'generalized_caption_design_principles_only'
  exactReferenceCaptionWordingRetained: false
  exactFontIdentityRetained: false
  exactLineBreakRetained: false
  exactHighlightWordRetained: false
  exactColorValueRetained: false
  exactLayoutRetained: false
  exactAnimationCurveRetained: false
  exactTimingMapRetained: false
  copyrightedFontOrBrandAssetRetained: false
  executableTargetCaptionPlanCreated: false
}

export interface QwenTechnicalCaptionContext {
  schemaVersion: 'edit-reference-caption-design-context-v1'
  resultDigestSha256: string
  coverage: 'full' | 'partial'
  analyzedFrameCount: number
  regionCount: number
  evidenceMode:
    | 'visual_ocr'
    | 'visual_ocr_segment_timing'
    | 'visual_ocr_word_timing'
  frames: Array<{
    frameId: string
    frameTimeSeconds: number
    textRegions: Array<{
      regionId: string
      normalizedBounds: {
        x: number
        y: number
        width: number
        height: number
      }
      lineCount: number
      estimatedCharacterCount: number
      confidence: number
      exactTextPersisted: false
    }>
  }>
  captionOcrRuntimeExecuted: true
  exactTextPersisted: false
  rawOutputPersisted: false
  semanticCaptionDesignInterpreted: false
  transcriptAlignmentRan: false
  speechTimingRan: false
}

export type QwenVisualStudyProfile =
  | 'visual_language'
  | 'color_treatment'
  | 'graphics_motion'
  | 'caption_design'

export interface QwenVisualUnderstandingExecutionEvidence {
  boundedPrivateFramesRead: boolean
  providerCallMade: boolean
  modelCallMade: boolean
  workerJobCreated: false
  remoteMutationMade: false
}

export interface QwenVisualUnderstandingRuntimeProvenance {
  runtimeSource: 'verified_live'
  adapterId: 'qwen_visual_understanding_provider'
  adapterVersion: 'v2'
  providerId: 'qwen_visual_private_cloud_run'
  modelId: 'Qwen/Qwen2.5-VL-7B-Instruct'
  modelRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5'
  modelAggregateSha256:
    '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b'
  modelRoutingPolicyVersion: 'model-routing-policy-v1'
  visualInstructionDigestSha256: string
}

export interface QwenVisualUnderstandingResult
  extends EditReferenceVisualUnderstandingResult {
  visualLanguageObservations: QwenVisualLanguageObservation[]
  transferSafety?: QwenVisualTransferSafety
  colorTreatmentObservations?: QwenColorTreatmentObservation[]
  colorTransferSafety?: QwenColorTransferSafety
  graphicsMotionObservations?: QwenGraphicsMotionObservation[]
  graphicsMotionTransferSafety?: QwenGraphicsMotionTransferSafety
  captionDesignObservations?: QwenCaptionDesignObservation[]
  captionDesignTransferSafety?: QwenCaptionDesignTransferSafety
  execution: QwenVisualUnderstandingExecutionEvidence
  runtimeProvenance?: QwenVisualUnderstandingRuntimeProvenance
}

export interface QwenVisualUnderstandingProvider {
  analyze(
    input: EditReferenceVisualUnderstandingInput & {
      readonly editReferenceStudyProfile?: QwenVisualStudyProfile
      readonly technicalColorContext?: QwenTechnicalColorContext
      readonly technicalMotionContext?: QwenTechnicalMotionContext
      readonly technicalCaptionContext?: QwenTechnicalCaptionContext
    },
  ): Promise<QwenVisualUnderstandingResult>
}

/** @deprecated Fresh Qwen visual transport options are ignored. */
export interface QwenVisualUnderstandingProviderOptions {
  env?: Record<string, string | undefined>
  authenticatedPost?: (input: {
    url: string
    audience: string
    body: Record<string, unknown>
    timeoutMs: number
  }) => Promise<{ status: number; data: unknown }>
}

export const QWEN_VISUAL_UNDERSTANDING_RETIREMENT = Object.freeze({
  schemaVersion: 'qwen-visual-understanding-retirement-v1' as const,
  status: 'retired_historical_read_only' as const,
  replacementCapability: 'visual_intelligence' as const,
  freshExecutionAllowed: false as const,
  filesystemMediaReadAllowed: false as const,
  subprocessOrModelLoadAllowed: false as const,
  networkOrProviderCallAllowed: false as const,
  runtimeUrlOrCredentialReadAllowed: false as const,
  historicalEvidenceReadable: true as const,
})

/**
 * @deprecated Fresh callers must use the provider-neutral Visual Intelligence
 * lifecycle. This tombstone never reads the supplied input or options.
 */
export function createQwenVisualUnderstandingProvider(
  options: QwenVisualUnderstandingProviderOptions = {},
): QwenVisualUnderstandingProvider {
  void options
  return Object.freeze({
    async analyze(): Promise<QwenVisualUnderstandingResult> {
      return blockedHistoricalProvider()
    },
  })
}

function blockedHistoricalProvider(): QwenVisualUnderstandingResult {
  return Object.freeze({
    status: 'blocked' as const,
    visibleSubjects: [],
    visibleObjects: [],
    screenTextRegions: [],
    compositionRisks: [],
    brollOpportunities: [],
    captionObservations: [],
    styleObservations: [],
    frameEvidence: [],
    visualLanguageObservations: [],
    colorTreatmentObservations: [],
    graphicsMotionObservations: [],
    captionDesignObservations: [],
    evidenceArtifactIds: [],
    blockers: ['qwen_visual_runtime_retired_historical_read_only'],
    warnings: [
      'Fresh Qwen visual execution is disabled. Use visual_intelligence with the exact qualified Gemini Pro High lifecycle. Historical Qwen evidence remains readable only under its original schema and digest.',
    ],
    execution: {
      boundedPrivateFramesRead: false,
      providerCallMade: false,
      modelCallMade: false,
      workerJobCreated: false as const,
      remoteMutationMade: false as const,
    },
  })
}
