import { createHash } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { open } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { z } from 'zod'
import {
  assertDependencyRuntimeAdmission,
  resolveDependencyRuntimeAdmission,
} from '../security-review/dependency-runtime-admission'

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

const visualLanguageCategorySchema = z.enum([
  'composition_hierarchy',
  'framing_and_shot_scale',
  'subject_placement',
  'camera_behavior',
  'scene_rhythm',
  'visual_density',
  'broll_pattern',
  'transition_language',
  'caption_visible_text_and_overlay',
  'graphic_overlay_language',
  'color_contrast_and_lighting',
  'visual_storytelling',
])

const visualLanguageObservationSchema = z.object({
  category: visualLanguageCategorySchema,
  summary: z.string().trim().min(1).max(900),
  frameIds: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  confidence: z.number().min(Number.EPSILON).max(1),
  identityRelated: z.boolean(),
  requiresUserReview: z.boolean(),
}).strict()

const colorTreatmentCategorySchema = z.enum([
  'palette_relationship',
  'temperature_character',
  'white_balance_character',
  'contrast_structure',
  'saturation_vibrance',
  'luma_distribution',
  'highlight_rolloff',
  'shadow_treatment',
  'skin_tone_protection',
  'scene_consistency',
  'overall_color_character',
])

const colorTreatmentObservationSchema = z.object({
  category: colorTreatmentCategorySchema,
  summary: z.string().trim().min(1).max(900),
  frameIds: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  confidence: z.number().min(Number.EPSILON).max(1),
  transferability: z.enum(['transferable_principle', 'context_only', 'non_transferable']),
  requiresUserReview: z.boolean(),
  skinToneRelated: z.boolean(),
  brandColorRelated: z.boolean(),
  hdrOrColorManagementRelated: z.boolean(),
}).strict()

const graphicsMotionCategorySchema = z.enum([
  'titles',
  'cards',
  'lower_thirds',
  'icons',
  'spacing',
  'layout_hierarchy',
  'motion_intensity',
  'entry_exit_behavior',
  'overlay_placement',
  'ui_demonstration_patterns',
  'transition_motion',
])

const graphicsMotionObservationSchema = z.object({
  category: graphicsMotionCategorySchema,
  summary: z.string().trim().min(1).max(900),
  frameIds: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  confidence: z.number().min(Number.EPSILON).max(1),
  transferability: z.enum(['transferable_principle', 'context_only', 'non_transferable']),
  requiresUserReview: z.boolean(),
  visibleTextRelated: z.boolean(),
  brandOrUiIdentityRelated: z.boolean(),
  timingRelated: z.boolean(),
}).strict()

const captionDesignCategorySchema = z.enum([
  'font_character',
  'weight_treatment',
  'size_hierarchy',
  'placement',
  'safe_zone_behavior',
  'line_break_pattern',
  'highlighted_word_treatment',
  'color_treatment',
  'stroke_shadow_background',
  'animation_style',
  'entry_exit_timing',
  'caption_density',
  'spacing',
  'speech_alignment',
  'readability',
])

const captionDesignObservationSchema = z.object({
  category: captionDesignCategorySchema,
  summary: z.string().trim().min(1).max(900),
  frameIds: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  confidence: z.number().min(Number.EPSILON).max(1),
  transferability: z.enum(['transferable_principle', 'context_only', 'non_transferable']),
  timingBasis: z.enum(['frame_sequence', 'segment', 'word']),
  requiresUserReview: z.boolean(),
  safeZoneRelated: z.boolean(),
  speechTimingRelated: z.boolean(),
  fontOrBrandRelated: z.boolean(),
  claimRelated: z.boolean(),
  exactReferenceWordingRetained: z.literal(false),
  exactFontIdentityClaimed: z.literal(false),
}).strict()

const visualTransferSafetySchema = z.object({
  observationMode: z.literal('transferable_visual_principles_only'),
  exactLayoutInstructionCreated: z.literal(false),
  exactVisibleTextRetained: z.literal(false),
  exactCameraPathInstructionCreated: z.literal(false),
  identityTransferInstructionCreated: z.literal(false),
  copyrightedAssetInstructionCreated: z.literal(false),
}).strict()

const colorTransferSafetySchema = z.object({
  observationMode: z.literal('generalized_tonal_principles_only'),
  exactPaletteSwatchesRetained: z.literal(false),
  exactColorValuesRetained: z.literal(false),
  exactCurvesOrControlPointsRetained: z.literal(false),
  exactGradeSettingsRetained: z.literal(false),
  exactLutIdentityOrDataRetained: z.literal(false),
  exactLookTransformRetained: z.literal(false),
  sourceBrandColorAssetCopied: z.literal(false),
  executableTargetGradeCreated: z.literal(false),
}).strict()

const graphicsMotionTransferSafetySchema = z.object({
  observationMode: z.literal('generalized_graphics_motion_principles_only'),
  exactGraphicAssetsRetained: z.literal(false),
  exactReferenceTextOrIconIdentityRetained: z.literal(false),
  exactLayoutOrSpacingValuesRetained: z.literal(false),
  exactAnimationKeyframesOrCurvesRetained: z.literal(false),
  exactTransitionPathOrTimingRetained: z.literal(false),
  exactBrandOrUiIdentityRetained: z.literal(false),
  sourceGraphicOrUiAssetCopied: z.literal(false),
  executableTargetGraphicsMotionOperationCreated: z.literal(false),
}).strict()

const captionDesignTransferSafetySchema = z.object({
  observationMode: z.literal('generalized_caption_design_principles_only'),
  exactReferenceCaptionWordingRetained: z.literal(false),
  exactFontIdentityRetained: z.literal(false),
  exactLineBreakRetained: z.literal(false),
  exactHighlightWordRetained: z.literal(false),
  exactColorValueRetained: z.literal(false),
  exactLayoutRetained: z.literal(false),
  exactAnimationCurveRetained: z.literal(false),
  exactTimingMapRetained: z.literal(false),
  copyrightedFontOrBrandAssetRetained: z.literal(false),
  executableTargetCaptionPlanCreated: z.literal(false),
}).strict()

const technicalColorContextSchema = z.object({
  schemaVersion: z.literal('edit-reference-technical-color-context-v1'),
  resultDigestSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  coverage: z.enum(['full', 'partial']),
  sampleCount: z.number().int().min(1).max(24),
  scannedDurationSeconds: z.number().positive().max(600),
  pixelFormat: z.string().trim().min(1).max(80).optional(),
  colorSpace: z.string().trim().min(1).max(80).optional(),
  colorTransfer: z.string().trim().min(1).max(80).optional(),
  colorPrimaries: z.string().trim().min(1).max(80).optional(),
  colorRange: z.string().trim().min(1).max(80).optional(),
  hdrTransfer: z.enum(['pq', 'hlg', 'not_hdr_signaled', 'unknown']),
  lumaAverage8Bit: z.number().finite().optional(),
  lumaObservedMinimum8Bit: z.number().finite().optional(),
  lumaObservedMaximum8Bit: z.number().finite().optional(),
  lumaRobustRangeAverage8Bit: z.number().finite().optional(),
  saturationAverage8Bit: z.number().finite().optional(),
  saturationRobustRangeAverage8Bit: z.number().finite().optional(),
  chromaUAverage8Bit: z.number().finite().optional(),
  chromaVAverage8Bit: z.number().finite().optional(),
  temporalLumaDifferenceAverage8Bit: z.number().finite().optional(),
  temporalChromaDifferenceAverage8Bit: z.number().finite().optional(),
  outOfRangePixelRatioAverage: z.number().min(0).max(1).optional(),
  technicalDistributionAnalysisRan: z.literal(true),
  semanticColorAnalysisRan: z.literal(false),
  whiteBalanceInferenceRan: z.literal(false),
  temperatureInferenceRan: z.literal(false),
  skinToneAnalysisRan: z.literal(false),
  shotMatchAnalysisRan: z.literal(false),
  lutReconstructionRan: z.literal(false),
}).strict()

const technicalMotionContextSchema = z.object({
  schemaVersion: z.literal('edit-reference-technical-motion-context-v1'),
  resultDigestSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  coverage: z.enum(['full', 'partial']),
  sampleCount: z.number().int().min(1).max(24),
  scannedDurationSeconds: z.number().positive().max(120),
  activityThreshold8Bit: z.number().finite().nonnegative(),
  highActivityThreshold8Bit: z.number().finite().positive(),
  activeSampleRatio: z.number().min(0).max(1),
  highActivitySampleRatio: z.number().min(0).max(1),
  peakSampleCount: z.number().int().min(0).max(6),
  technicalFrameDifferenceAnalysisRan: z.literal(true),
  semanticMotionAnalysisRan: z.literal(false),
  cameraMotionInferenceRan: z.literal(false),
  objectTrackingRan: z.literal(false),
  transitionClassificationRan: z.literal(false),
  graphicsEntryExitAnalysisRan: z.literal(false),
  opticalFlowAnalysisRan: z.literal(false),
  rawFramePixelsPersisted: z.literal(false),
  rawDifferenceFramesPersisted: z.literal(false),
  rawHistogramPersisted: z.literal(false),
  rawProcessOutputPersisted: z.literal(false),
}).strict()

const technicalCaptionContextSchema = z.object({
  schemaVersion: z.literal('edit-reference-caption-design-context-v1'),
  resultDigestSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  coverage: z.enum(['full', 'partial']),
  analyzedFrameCount: z.number().int().min(1).max(24),
  regionCount: z.number().int().min(1).max(384),
  evidenceMode: z.enum(['visual_ocr', 'visual_ocr_segment_timing', 'visual_ocr_word_timing']),
  frames: z.array(z.object({
    frameId: z.string().trim().min(1).max(200),
    frameTimeSeconds: z.number().nonnegative().max(120),
    textRegions: z.array(z.object({
      regionId: z.string().trim().min(1).max(200),
      normalizedBounds: z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        width: z.number().positive().max(1),
        height: z.number().positive().max(1),
      }).strict(),
      lineCount: z.number().int().min(1).max(8),
      estimatedCharacterCount: z.number().int().min(1).max(500),
      confidence: z.number().min(Number.EPSILON).max(1),
      exactTextPersisted: z.literal(false),
    }).strict()).max(16),
  }).strict()).min(1).max(8),
  captionOcrRuntimeExecuted: z.literal(true),
  exactTextPersisted: z.literal(false),
  rawOutputPersisted: z.literal(false),
  semanticCaptionDesignInterpreted: z.literal(false),
  transcriptAlignmentRan: z.literal(false),
  speechTimingRan: z.literal(false),
}).strict()

const visualResponseSchema = z.object({
  schemaVersion: z.literal('reeditpro-visual-understanding-v1'),
  summary: z.string().trim().min(1).max(4000),
  visibleSubjects: z.array(z.string().trim().min(1).max(300)).max(80),
  visibleObjects: z.array(z.string().trim().min(1).max(300)).max(120),
  screenTextRegions: z.array(z.string().trim().min(1).max(500)).max(80),
  compositionRisks: z.array(z.string().trim().min(1).max(500)).max(80),
  brollOpportunities: z.array(z.string().trim().min(1).max(500)).max(80),
  captionObservations: z.array(z.string().trim().min(1).max(500)).max(80),
  styleObservations: z.array(z.string().trim().min(1).max(500)).max(80),
  frameEvidence: z.array(z.object({
    frameId: z.string().trim().min(1).max(200),
    timeSeconds: z.number().nonnegative().optional(),
    summary: z.string().trim().min(1).max(1200),
    visibleSubjects: z.array(z.string().trim().min(1).max(240)).max(30),
    visibleObjects: z.array(z.string().trim().min(1).max(240)).max(40),
    textLikeRegions: z.array(z.string().trim().min(1).max(400)).max(30),
    safeZones: z.array(z.string().trim().min(1).max(400)).max(30),
    uncertainty: z.array(z.string().trim().min(1).max(400)).max(30),
  }).strict()).min(1).max(8),
  visualLanguageObservations: z.array(visualLanguageObservationSchema).min(1).max(64).optional(),
  transferSafety: visualTransferSafetySchema.optional(),
  colorTreatmentObservations: z.array(colorTreatmentObservationSchema).min(1).max(64).optional(),
  colorTransferSafety: colorTransferSafetySchema.optional(),
  graphicsMotionObservations: z.array(graphicsMotionObservationSchema).min(1).max(64).optional(),
  graphicsMotionTransferSafety: graphicsMotionTransferSafetySchema.optional(),
  captionDesignObservations: z.array(captionDesignObservationSchema).min(1).max(64).optional(),
  captionDesignTransferSafety: captionDesignTransferSafetySchema.optional(),
  model: z.object({
    modelId: z.string().trim().min(1).max(200),
    modelRevision: z.string().trim().min(1).max(200),
    modelAggregateSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }).strict(),
  generatedAssetsCreated: z.literal(false),
  publicArtifactsCreated: z.literal(false),
  signedUrlsCreated: z.literal(false),
}).strict()

export type QwenVisualLanguageObservation = z.infer<typeof visualLanguageObservationSchema>
export type QwenVisualTransferSafety = z.infer<typeof visualTransferSafetySchema>
export type QwenColorTreatmentObservation = z.infer<typeof colorTreatmentObservationSchema>
export type QwenColorTransferSafety = z.infer<typeof colorTransferSafetySchema>
export type QwenTechnicalColorContext = z.infer<typeof technicalColorContextSchema>
export type QwenGraphicsMotionObservation = z.infer<typeof graphicsMotionObservationSchema>
export type QwenGraphicsMotionTransferSafety = z.infer<typeof graphicsMotionTransferSafetySchema>
export type QwenTechnicalMotionContext = z.infer<typeof technicalMotionContextSchema>
export type QwenCaptionDesignObservation = z.infer<typeof captionDesignObservationSchema>
export type QwenCaptionDesignTransferSafety = z.infer<typeof captionDesignTransferSafetySchema>
export type QwenTechnicalCaptionContext = z.infer<typeof technicalCaptionContextSchema>
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
  modelAggregateSha256: '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b'
  modelRoutingPolicyVersion: 'model-routing-policy-v1'
  visualInstructionDigestSha256: string
}

export interface QwenVisualUnderstandingResult extends EditReferenceVisualUnderstandingResult {
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

export interface QwenVisualUnderstandingProviderOptions {
  env?: Record<string, string | undefined>
  authenticatedPost?: (input: {
    url: string
    audience: string
    body: Record<string, unknown>
    timeoutMs: number
  }) => Promise<{ status: number; data: unknown }>
}

const secretLikePattern = /service.?role|api.?key|authorization|bearer\s+|signed.?url|sk-[a-z0-9_-]+/i

export function createQwenVisualUnderstandingProvider(
  options: QwenVisualUnderstandingProviderOptions = {},
): QwenVisualUnderstandingProvider {
  const env = options.env ?? process.env
  return {
    async analyze(input): Promise<QwenVisualUnderstandingResult> {
      const mode = clean(env.REEDITPRO_QWEN_VISUAL_RUNTIME_MODE)
      const url = clean(env.QWEN_VISUAL_RUNTIME_URL)
      const audience = clean(env.QWEN_VISUAL_RUNTIME_AUDIENCE) ?? url
      if (mode !== 'internal_enabled' || !url || !audience) {
        return blocked('qwen_visual_runtime_not_configured', [
          'Qwen visual runtime requires internal_enabled mode plus a private runtime URL and audience.',
        ])
      }
      if (!/^https:\/\//i.test(url)) {
        return blocked('qwen_visual_runtime_https_required', ['Qwen visual runtime URL must use HTTPS.'])
      }
      if (!options.authenticatedPost) {
        const admission = resolveDependencyRuntimeAdmission('google_cloud_auth')
        return blocked('dependency_security_review_required', [admission.message])
      }
      if (input.frameArtifacts.length === 0) {
        return blocked('qwen_visual_frames_required', ['No private representative frame artifact was available.'])
      }
      const studyProfile = input.editReferenceStudyProfile ?? 'visual_language'
      const technicalColorContext = studyProfile === 'color_treatment'
        ? technicalColorContextSchema.safeParse(input.technicalColorContext)
        : undefined
      const technicalMotionContext = studyProfile === 'graphics_motion'
        ? technicalMotionContextSchema.safeParse(input.technicalMotionContext)
        : undefined
      const technicalCaptionContext = studyProfile === 'caption_design'
        ? technicalCaptionContextSchema.safeParse(input.technicalCaptionContext)
        : undefined
      if (studyProfile === 'color_treatment' && !technicalColorContext?.success) {
        return blocked('qwen_visual_color_context_required', [
          'Color Treatment requires an exact bounded technical-color context before private frame analysis.',
        ])
      }
      if (studyProfile === 'graphics_motion' && !technicalMotionContext?.success) {
        return blocked('qwen_visual_motion_context_required', [
          'Graphics/Motion requires an exact bounded technical-motion context before private frame analysis.',
        ])
      }
      if (studyProfile === 'caption_design' && !technicalCaptionContext?.success) {
        return blocked('qwen_visual_caption_context_required', [
          'Caption Design requires an exact bounded OCR-geometry context with no recognized text.',
        ])
      }

      let frames: Array<{
        frameId: string
        timeSeconds: number | undefined
        contentType: 'image/jpeg'
        checksumSha256: string
        imageBase64: string
      }>
      try {
        frames = await Promise.all(input.frameArtifacts.slice(0, 8).map(async (frame) => {
          const handle = await open(frame.localFilePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
          let bytes: Buffer
          try {
            const stat = await handle.stat()
            if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024) {
              throw new Error(`Private visual frame ${frame.artifactId} is empty or exceeds the 2 MiB request limit.`)
            }
            bytes = await handle.readFile()
          } finally {
            await handle.close()
          }
          const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
          if (frame.checksum && checksumSha256 !== frame.checksum) {
            throw new Error(`Private visual frame ${frame.artifactId} failed checksum verification.`)
          }
          return {
            frameId: frame.artifactId,
            timeSeconds: frame.timeSeconds,
            contentType: 'image/jpeg' as const,
            checksumSha256,
            imageBase64: bytes.toString('base64'),
          }
        }))
      } catch (error) {
        return blocked('qwen_visual_frame_read_failed', [safeError(error)])
      }
      const analysisCategories = studyProfile === 'color_treatment'
        ? [
            'palette_relationship',
            'temperature_character',
            'white_balance_character',
            'contrast_structure',
            'saturation_vibrance',
            'luma_distribution',
            'highlight_rolloff',
            'shadow_treatment',
            'skin_tone_protection',
            'scene_consistency',
            'overall_color_character',
          ]
        : studyProfile === 'graphics_motion'
          ? [
              'titles',
              'cards',
              'lower_thirds',
              'icons',
              'spacing',
              'layout_hierarchy',
              'motion_intensity',
              'entry_exit_behavior',
              'overlay_placement',
              'ui_demonstration_patterns',
              'transition_motion',
            ]
          : studyProfile === 'caption_design'
            ? [
                'font_character',
                'weight_treatment',
                'size_hierarchy',
                'placement',
                'safe_zone_behavior',
                'line_break_pattern',
                'highlighted_word_treatment',
                'color_treatment',
                'stroke_shadow_background',
                'animation_style',
                'entry_exit_timing',
                'caption_density',
                'spacing',
                'speech_alignment',
                'readability',
              ]
            : [
            'visible_subjects',
            'visible_objects',
            'screen_text_regions',
            'composition_risks',
            'safe_zones',
            'broll_opportunities',
            'caption_observations',
            'style_observations',
            'composition_hierarchy',
            'framing_and_shot_scale',
            'subject_placement',
            'camera_behavior',
            'scene_rhythm',
            'visual_density',
            'broll_pattern',
            'transition_language',
            'caption_visible_text_and_overlay',
            'graphic_overlay_language',
            'color_contrast_and_lighting',
            'visual_storytelling',
          ]
      const task = studyProfile === 'color_treatment'
        ? {
            useCase: input.analysisRole,
            specialist: 'edit_reference_color_treatment',
            outputMode: 'structured_metadata_only',
            analysisCategories,
            colorTreatmentOutputMode: 'generalized_tonal_principles_only',
          }
        : studyProfile === 'graphics_motion'
          ? {
              useCase: input.analysisRole,
              specialist: 'edit_reference_graphics_motion',
              outputMode: 'structured_metadata_only',
              analysisCategories,
              graphicsMotionOutputMode: 'generalized_graphics_motion_principles_only',
            }
          : studyProfile === 'caption_design'
            ? {
                useCase: input.analysisRole,
                specialist: 'edit_reference_caption_design',
                outputMode: 'structured_metadata_only',
                analysisCategories,
                captionDesignOutputMode: 'generalized_caption_design_principles_only',
              }
            : {
              useCase: input.analysisRole,
              specialist: 'edit_reference_visual_language',
              outputMode: 'structured_metadata_only',
              analysisCategories,
              visualLanguageOutputMode: 'generalized_observations_only',
            }
      const safety = {
        privateInputOnly: true,
        rawPromptIncluded: false,
        generatedAssetsAllowed: false,
        publicArtifactsAllowed: false,
        signedUrlsAllowed: false,
        exactLayoutInstructionsAllowed: false,
        exactVisibleTextRetentionAllowed: false,
        exactCameraPathInstructionsAllowed: false,
        identityTransferInstructionsAllowed: false,
        copyrightedAssetInstructionsAllowed: false,
        ...(studyProfile === 'color_treatment' ? {
          exactPaletteSwatchesAllowed: false,
          exactColorValuesAllowed: false,
          exactCurvesOrControlPointsAllowed: false,
          exactGradeSettingsAllowed: false,
          exactLutIdentityOrDataAllowed: false,
          exactLookTransformAllowed: false,
          sourceBrandColorAssetCopyAllowed: false,
          executableTargetGradeAllowed: false,
        } : {}),
        ...(studyProfile === 'graphics_motion' ? {
          exactGraphicAssetTransferAllowed: false,
          exactReferenceTextOrIconTransferAllowed: false,
          exactLayoutOrSpacingTransferAllowed: false,
          exactAnimationKeyframeOrCurveTransferAllowed: false,
          exactTransitionPathOrTimingTransferAllowed: false,
          exactBrandOrUiIdentityTransferAllowed: false,
          sourceGraphicOrUiAssetCopyAllowed: false,
          executableTargetGraphicsMotionOperationAllowed: false,
        } : {}),
        ...(studyProfile === 'caption_design' ? {
          rawRecognizedTextInputAllowed: false,
          exactReferenceCaptionWordingRetentionAllowed: false,
          exactFontIdentityRetentionAllowed: false,
          exactLineBreakRetentionAllowed: false,
          exactHighlightWordRetentionAllowed: false,
          exactColorValueRetentionAllowed: false,
          exactLayoutRetentionAllowed: false,
          exactAnimationCurveRetentionAllowed: false,
          exactTimingMapRetentionAllowed: false,
          copyrightedFontOrBrandAssetRetentionAllowed: false,
          executableTargetCaptionPlanAllowed: false,
        } : {}),
      }
      const body = {
        schemaVersion: 'reeditpro-visual-understanding-request-v1',
        requestId: `visual:${input.workspaceId}:${input.projectId}:${input.editSessionId}:${input.mediaAssetId}`,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        mediaAssetId: input.mediaAssetId,
        task,
        frames,
        ...(technicalColorContext?.success ? { technicalColorContext: technicalColorContext.data } : {}),
        ...(technicalMotionContext?.success ? { technicalMotionContext: technicalMotionContext.data } : {}),
        ...(technicalCaptionContext?.success ? { technicalCaptionContext: technicalCaptionContext.data } : {}),
        safety,
      }
      const visualInstructionDigestSha256 = createHash('sha256').update(JSON.stringify({
        schemaVersion: body.schemaVersion,
        task: body.task,
        safety: body.safety,
      })).digest('hex')
      const post = options.authenticatedPost ?? authenticatedCloudRunPost
      let response: Awaited<ReturnType<typeof post>>
      try {
        response = await post({
          url,
          audience,
          body,
          timeoutMs: parsePositiveInt(env.QWEN_VISUAL_RUNTIME_TIMEOUT_MS, 180_000, 600_000),
        })
      } catch (error) {
        return blocked('qwen_visual_runtime_request_failed', [safeError(error)], {
          boundedPrivateFramesRead: true,
          providerCallMade: true,
          modelCallMade: false,
        })
      }
      if (response.status < 200 || response.status >= 300) {
        return blocked('qwen_visual_runtime_non_success', [`Private visual runtime returned HTTP ${response.status}.`], {
          boundedPrivateFramesRead: true,
          providerCallMade: true,
          modelCallMade: false,
        })
      }
      const parsed = visualResponseSchema.safeParse(response.data)
      if (!parsed.success) {
        return blocked(
          'qwen_visual_runtime_invalid_response',
          parsed.error.issues.map((issue) => `${issue.path.join('.') || 'response'}: ${issue.message}`),
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      if (containsSecretLikeValue(parsed.data)) {
        return blocked(
          'qwen_visual_runtime_unsafe_response',
          ['Structured visual response contained secret-like or signed-URL text.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      if (
        parsed.data.model.modelId !== 'Qwen/Qwen2.5-VL-7B-Instruct' ||
        parsed.data.model.modelRevision !== 'cc594898137f460bfe9f0759e9844b3ce807cfb5' ||
        parsed.data.model.modelAggregateSha256 !== '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b'
      ) {
        return blocked(
          'qwen_visual_runtime_model_policy_mismatch',
          ['Structured visual response did not match the approved model revision and aggregate checksum.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      if (
        studyProfile === 'color_treatment'
        && (!parsed.data.colorTreatmentObservations?.length || !parsed.data.colorTransferSafety)
      ) {
        return blocked(
          'qwen_visual_runtime_missing_color_treatment_output',
          ['Structured Color Treatment output omitted generalized observations or the strict no-copy record.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      if (
        studyProfile === 'graphics_motion'
        && (!parsed.data.graphicsMotionObservations?.length || !parsed.data.graphicsMotionTransferSafety)
      ) {
        return blocked(
          'qwen_visual_runtime_missing_graphics_motion_output',
          ['Structured Graphics/Motion output omitted generalized observations or the strict no-copy record.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      if (
        studyProfile === 'caption_design'
        && (!parsed.data.captionDesignObservations?.length || !parsed.data.captionDesignTransferSafety)
      ) {
        return blocked(
          'qwen_visual_runtime_missing_caption_design_output',
          ['Structured Caption Design output omitted generalized observations or the strict no-copy record.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      const returnedFrameIds = new Set(parsed.data.frameEvidence.map((frame) => frame.frameId))
      const inputFrameIds = frames.map((frame) => frame.frameId)
      if (inputFrameIds.some((frameId) => !returnedFrameIds.has(frameId))) {
        return blocked(
          'qwen_visual_runtime_incomplete_frame_evidence',
          ['Structured visual response omitted one or more submitted frame IDs.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      const unknownObservationFrame = parsed.data.visualLanguageObservations?.find((observation) => (
        observation.frameIds.some((frameId) => !inputFrameIds.includes(frameId))
      ))
      if (unknownObservationFrame) {
        return blocked(
          'qwen_visual_runtime_unknown_observation_frame',
          ['Structured visual-language observations referenced a frame outside the submitted private manifest.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      const unknownColorObservationFrame = parsed.data.colorTreatmentObservations?.find((observation) => (
        observation.frameIds.some((frameId) => !inputFrameIds.includes(frameId))
      ))
      if (unknownColorObservationFrame) {
        return blocked(
          'qwen_visual_runtime_unknown_color_observation_frame',
          ['Structured Color Treatment observations referenced a frame outside the submitted private manifest.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      const unknownGraphicsMotionObservationFrame = parsed.data.graphicsMotionObservations?.find((observation) => (
        observation.frameIds.some((frameId) => !inputFrameIds.includes(frameId))
      ))
      if (unknownGraphicsMotionObservationFrame) {
        return blocked(
          'qwen_visual_runtime_unknown_graphics_motion_observation_frame',
          ['Structured Graphics/Motion observations referenced a frame outside the submitted private manifest.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }
      const unknownCaptionDesignObservationFrame = parsed.data.captionDesignObservations?.find((observation) => (
        observation.frameIds.some((frameId) => !inputFrameIds.includes(frameId))
      ))
      if (unknownCaptionDesignObservationFrame) {
        return blocked(
          'qwen_visual_runtime_unknown_caption_design_observation_frame',
          ['Structured Caption Design observations referenced a frame outside the submitted private manifest.'],
          { boundedPrivateFramesRead: true, providerCallMade: true, modelCallMade: true },
        )
      }

      return {
        status: 'completed',
        summary: parsed.data.summary,
        visibleSubjects: parsed.data.visibleSubjects,
        visibleObjects: parsed.data.visibleObjects,
        screenTextRegions: parsed.data.screenTextRegions,
        compositionRisks: parsed.data.compositionRisks,
        brollOpportunities: parsed.data.brollOpportunities,
        captionObservations: parsed.data.captionObservations,
        styleObservations: parsed.data.styleObservations,
        frameEvidence: parsed.data.frameEvidence.map((frame) => ({
          frameId: frame.frameId,
          timeSeconds: frame.timeSeconds,
          summary: frame.summary,
          safeZones: frame.safeZones,
          uncertainty: frame.uncertainty,
        })),
        visualLanguageObservations: parsed.data.visualLanguageObservations ?? [],
        transferSafety: parsed.data.transferSafety,
        colorTreatmentObservations: parsed.data.colorTreatmentObservations ?? [],
        colorTransferSafety: parsed.data.colorTransferSafety,
        graphicsMotionObservations: parsed.data.graphicsMotionObservations ?? [],
        graphicsMotionTransferSafety: parsed.data.graphicsMotionTransferSafety,
        captionDesignObservations: parsed.data.captionDesignObservations ?? [],
        captionDesignTransferSafety: parsed.data.captionDesignTransferSafety,
        evidenceArtifactIds: inputFrameIds,
        blockers: [],
        warnings: [
          `Structured private visual evidence was accepted from ${parsed.data.model.modelId} at revision ${parsed.data.model.modelRevision}.`,
          'No raw prompt, generated asset, public artifact, or signed URL was included in the visual request.',
        ],
        execution: {
          boundedPrivateFramesRead: true,
          providerCallMade: true,
          modelCallMade: true,
          workerJobCreated: false,
          remoteMutationMade: false,
        },
        runtimeProvenance: {
          runtimeSource: 'verified_live',
          adapterId: 'qwen_visual_understanding_provider',
          adapterVersion: 'v2',
          providerId: 'qwen_visual_private_cloud_run',
          modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
          modelRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5',
          modelAggregateSha256: '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b',
          modelRoutingPolicyVersion: 'model-routing-policy-v1',
          visualInstructionDigestSha256,
        },
      }
    },
  }
}

async function authenticatedCloudRunPost(input: {
  url: string
  audience: string
  body: Record<string, unknown>
  timeoutMs: number
}): Promise<{ status: number; data: unknown }> {
  assertDependencyRuntimeAdmission('google_cloud_auth')
  const { GoogleAuth } = createRequire(import.meta.url)('google-auth-library') as typeof import('google-auth-library')
  const auth = new GoogleAuth()
  const client = await auth.getIdTokenClient(input.audience)
  const response = await client.request<unknown>({
    url: input.url,
    method: 'POST',
    data: input.body,
    timeout: input.timeoutMs,
    headers: {
      'content-type': 'application/json',
      'x-reeditpro-runtime': 'autonomous-source-visual-understanding',
    },
  })
  return { status: response.status, data: response.data }
}

function blocked(
  code: string,
  warnings: string[],
  execution: Partial<Pick<QwenVisualUnderstandingExecutionEvidence,
    'boundedPrivateFramesRead' | 'providerCallMade' | 'modelCallMade'>> = {},
): QwenVisualUnderstandingResult {
  return {
    status: 'blocked',
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
    blockers: [code],
    warnings,
    execution: {
      boundedPrivateFramesRead: execution.boundedPrivateFramesRead ?? false,
      providerCallMade: execution.providerCallMade ?? false,
      modelCallMade: execution.modelCallMade ?? false,
      workerJobCreated: false,
      remoteMutationMade: false,
    },
  }
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return secretLikePattern.test(message)
    ? 'Private visual runtime request failed with a redacted error.'
    : message.slice(0, 500)
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === 'string') return secretLikePattern.test(value)
  if (Array.isArray(value)) return value.some(containsSecretLikeValue)
  if (value && typeof value === 'object') return Object.values(value).some(containsSecretLikeValue)
  return false
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}
