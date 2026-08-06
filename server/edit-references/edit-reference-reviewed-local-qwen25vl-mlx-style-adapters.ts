import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { z } from 'zod'
import {
  QWEN_VISUAL_UNDERSTANDING_RETIREMENT,
  type QwenColorTreatmentObservation,
  type QwenGraphicsMotionObservation,
} from '../services/qwen-visual-understanding-provider'
import type {
  PreferenceTechnicalColorSignalEvidence,
  PreferenceTechnicalMotionSignalEvidence,
} from '../../src/types/edit-reference'
import {
  assertEditReferenceColorTreatmentStudyRequest,
  assertEditReferenceColorTreatmentStudyResult,
  createBlockedEditReferenceColorTreatmentStudyResult,
  type EditReferenceColorTreatmentFrameEvidence,
  type EditReferenceColorTreatmentStudyAdapter,
  type EditReferenceColorTreatmentStudyRequest,
  type EditReferenceColorTreatmentStudyResult,
} from './edit-reference-color-treatment-study-contract'
import {
  assertExactTechnicalColorEvidence,
  buildEditReferenceAnalyzedColorTreatmentStudyResult,
  type EditReferenceResolvedColorFrame,
} from './edit-reference-qwen-color-treatment-adapter'
import {
  assertEditReferenceGraphicsMotionStudyRequest,
  assertEditReferenceGraphicsMotionStudyResult,
  createBlockedEditReferenceGraphicsMotionStudyResult,
  type EditReferenceGraphicsMotionFrameEvidence,
  type EditReferenceGraphicsMotionStudyAdapter,
  type EditReferenceGraphicsMotionStudyRequest,
  type EditReferenceGraphicsMotionStudyResult,
} from './edit-reference-graphics-motion-study-contract'
import {
  assertExactTechnicalMotionEvidence,
  buildEditReferenceAnalyzedGraphicsMotionStudyResult,
  type EditReferenceResolvedGraphicsMotionFrame,
} from './edit-reference-qwen-graphics-motion-adapter'
import type { EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt } from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'

const execFileAsync = promisify(execFile)
const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(
  new URL('./runtime/qwen25vl-mlx-classify-reference-style.py', import.meta.url),
)
const OUTPUT_SCHEMA_VERSION = 'reeditpro-reviewed-local-qwen25vl-mlx-reference-style-v1' as const
const MODEL_ROUTING_POLICY_VERSION = 'model-routing-policy-v1' as const
const COLOR_ADAPTER_ID = 'reeditpro_reviewed_local_qwen25vl_mlx_color' as const
const GRAPHICS_ADAPTER_ID = 'reeditpro_reviewed_local_qwen25vl_mlx_graphics' as const
const MAX_FRAME_BYTES = 2 * 1024 * 1024
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const

const commonOutputShape = {
  schemaVersion: z.literal(OUTPUT_SCHEMA_VERSION),
  framesAnalyzed: z.number().int().min(2).max(8),
  semanticSpecialistModelExecuted: z.literal(true),
  rawModelOutputPersisted: z.literal(false),
  rawFramesPersisted: z.literal(false),
  exactVisibleTextRetained: z.literal(false),
  identityAnalysisPerformed: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
} as const

const colorClassificationsSchema = z.object({
  paletteRelationship: z.enum([
    'restrained_neutral', 'warm_cohesive', 'cool_cohesive', 'high_chroma_contrast', 'mixed_varied',
  ]),
  temperatureCharacter: z.enum(['warm', 'cool', 'neutral', 'mixed']),
  whiteBalanceCharacter: z.enum(['balanced', 'warm_cast', 'cool_cast', 'mixed_or_uncertain']),
  contrastStructure: z.enum(['soft', 'balanced', 'strong', 'mixed']),
  saturationVibrance: z.enum(['restrained', 'natural', 'vivid', 'mixed']),
  lumaDistribution: z.enum(['low_key', 'high_key', 'balanced', 'mixed']),
  highlightRolloff: z.enum(['soft', 'abrupt', 'mixed_or_uncertain']),
  shadowTreatment: z.enum(['open', 'deep', 'balanced', 'mixed']),
  sceneConsistency: z.enum(['consistent', 'intentionally_varied', 'inconsistent', 'uncertain']),
  overallColorCharacter: z.enum([
    'clean_natural', 'premium_clean', 'warm_lifestyle', 'cinematic_contrast',
    'documentary_neutral', 'bright_social', 'moody_dramatic', 'muted_editorial',
    'high_key_clean', 'mixed_custom',
  ]),
  confidence: z.number().min(0.01).max(1),
}).strict()

const graphicsClassificationsSchema = z.object({
  iconsPresence: z.enum(['none', 'restrained', 'prominent', 'uncertain']),
  spacingDensity: z.enum(['tight', 'balanced', 'open', 'mixed']),
  layoutHierarchy: z.enum(['single_focus', 'two_level', 'layered', 'full_frame', 'mixed']),
  overlayPlacement: z.enum(['upper', 'lower', 'edge_anchored', 'centered', 'distributed', 'mixed']),
  confidence: z.number().min(0.01).max(1),
}).strict()

const colorOutputSchema = z.object({
  ...commonOutputShape,
  profile: z.literal('color_treatment'),
  classifications: colorClassificationsSchema,
}).strict()

const graphicsOutputSchema = z.object({
  ...commonOutputShape,
  profile: z.literal('graphics_motion'),
  classifications: graphicsClassificationsSchema,
}).strict()

type ColorClassifications = z.infer<typeof colorClassificationsSchema>
type GraphicsClassifications = z.infer<typeof graphicsClassificationsSchema>

interface ReviewedLocalStyleAdapterBaseInput {
  readonly runtime: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
  readonly pythonCommand: string
  readonly modelPath: string
  readonly privateFrameRoot: string
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
  readonly now?: () => string
}

export interface CreateEditReferenceReviewedLocalQwen25VlMlxColorAdapterInput
  extends ReviewedLocalStyleAdapterBaseInput {
  readonly technicalColorEvidence: PreferenceTechnicalColorSignalEvidence
  readonly resolvePrivateFrame: (
    sample: EditReferenceColorTreatmentFrameEvidence,
  ) => Promise<EditReferenceResolvedColorFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedColorFrame[],
  ) => Promise<void>
}

export interface CreateEditReferenceReviewedLocalQwen25VlMlxGraphicsAdapterInput
  extends ReviewedLocalStyleAdapterBaseInput {
  readonly technicalMotionEvidence: PreferenceTechnicalMotionSignalEvidence
  readonly resolvePrivateFrame: (
    sample: EditReferenceGraphicsMotionFrameEvidence,
  ) => Promise<EditReferenceResolvedGraphicsMotionFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedGraphicsMotionFrame[],
  ) => Promise<void>
}

export function createEditReferenceReviewedLocalQwen25VlMlxColorAdapter(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxColorAdapterInput,
): EditReferenceColorTreatmentStudyAdapter {
  if (!QWEN_VISUAL_UNDERSTANDING_RETIREMENT.freshExecutionAllowed) {
    throw new Error(
      'reviewed_local_qwen25vl_mlx_retired_use_visual_intelligence',
    )
  }
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  const timeoutMs = boundedTimeout(input.timeoutMs)
  return {
    adapterId: COLOR_ADAPTER_ID,
    adapterVersion: input.runtime.adapterVersion,
    async analyze(request): Promise<EditReferenceColorTreatmentStudyResult> {
      assertEditReferenceColorTreatmentStudyRequest(request)
      assertControlledColorRequest(request)
      const startedAt = now(input)
      const resolvedFrames: EditReferenceResolvedColorFrame[] = []
      let boundedPrivateFramesRead = false
      let technicalColorResultRead = false
      let modelCallMade = false
      let output: z.infer<typeof colorOutputSchema> | undefined
      let failureMessage: string | undefined
      try {
        assertExactTechnicalColorEvidence(request, input.technicalColorEvidence)
        technicalColorResultRead = true
        await validateRuntimeInputs(input, runnerScriptPath)
        await resolveExactPrivateFrames({
          privateFrameRoot: input.privateFrameRoot,
          samples: request.frameSamples,
          resolvePrivateFrame: input.resolvePrivateFrame,
          resolved: resolvedFrames,
        })
        boundedPrivateFramesRead = true
        output = colorOutputSchema.parse(await executeProfile({
          profile: 'color_treatment',
          pythonCommand: input.pythonCommand,
          runnerScriptPath,
          modelPath: input.modelPath,
          framePaths: resolvedFrames.map((frame) => frame.localFilePath),
          timeoutMs,
        }))
        modelCallMade = output.semanticSpecialistModelExecuted
        if (output.framesAnalyzed !== request.frameSamples.length) {
          throw new Error('Reviewed local Color Treatment output omitted bounded frames.')
        }
      } catch {
        failureMessage = 'The reviewed local Color Treatment runtime failed closed without retaining raw model output or private frame paths.'
      }

      const temporaryFramesCleaned = await cleanAndProveMissing(
        resolvedFrames,
        input.cleanupPrivateFrames,
      )
      if (!temporaryFramesCleaned) {
        failureMessage = 'The reviewed local Color Treatment runtime could not prove ephemeral frame cleanup.'
      }
      if (!output || failureMessage) {
        return createBlockedEditReferenceColorTreatmentStudyResult({
          request,
          blockerCode: temporaryFramesCleaned ? 'runtime_response_invalid' : 'ephemeral_cleanup_failed',
          blockerMessage: failureMessage ?? 'The reviewed local Color Treatment runtime returned invalid bounded evidence.',
          retryAvailable: true,
          retryReason: 'Retry after validating the exact private local runtime, model, technical-color evidence, and ephemeral frame workspace.',
          execution: {
            boundedPrivateFramesRead,
            technicalColorResultRead,
            providerCallMade: false,
            modelCallMade,
            workerJobCreated: false,
            temporaryFramesCleaned,
          },
        })
      }

      const runnerDigestSha256 = await hashFile(runnerScriptPath)
      const result = buildEditReferenceAnalyzedColorTreatmentStudyResult({
        request,
        observations: buildColorObservations(request, output.classifications),
        runtimeSource: 'verified_local',
        providerCallMade: false,
        modelCallMade: true,
        workerJobCreated: false,
        analyzer: localAnalyzer(input.runtime, COLOR_ADAPTER_ID, runnerDigestSha256, 'color_treatment'),
        provenance: {
          executionId: localExecutionId(request.orchestrationId, input.runtime.runtimeId, 'color'),
          startedAt,
          completedAt: now(input),
        },
        usage: controlledTestUsage(),
      })
      assertEditReferenceColorTreatmentStudyResult(request, result)
      return result
    },
  }
}

export function createEditReferenceReviewedLocalQwen25VlMlxGraphicsAdapter(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxGraphicsAdapterInput,
): EditReferenceGraphicsMotionStudyAdapter {
  if (!QWEN_VISUAL_UNDERSTANDING_RETIREMENT.freshExecutionAllowed) {
    throw new Error(
      'reviewed_local_qwen25vl_mlx_retired_use_visual_intelligence',
    )
  }
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  const timeoutMs = boundedTimeout(input.timeoutMs)
  return {
    adapterId: GRAPHICS_ADAPTER_ID,
    adapterVersion: input.runtime.adapterVersion,
    async analyze(request): Promise<EditReferenceGraphicsMotionStudyResult> {
      assertEditReferenceGraphicsMotionStudyRequest(request)
      assertControlledGraphicsRequest(request)
      const startedAt = now(input)
      const resolvedFrames: EditReferenceResolvedGraphicsMotionFrame[] = []
      let boundedPrivateFramesRead = false
      let technicalMotionResultRead = false
      let modelCallMade = false
      let output: z.infer<typeof graphicsOutputSchema> | undefined
      let failureMessage: string | undefined
      try {
        assertExactTechnicalMotionEvidence(request, input.technicalMotionEvidence)
        technicalMotionResultRead = true
        await validateRuntimeInputs(input, runnerScriptPath)
        await resolveExactPrivateFrames({
          privateFrameRoot: input.privateFrameRoot,
          samples: request.frameSamples,
          resolvePrivateFrame: input.resolvePrivateFrame,
          resolved: resolvedFrames,
        })
        boundedPrivateFramesRead = true
        output = graphicsOutputSchema.parse(await executeProfile({
          profile: 'graphics_motion',
          pythonCommand: input.pythonCommand,
          runnerScriptPath,
          modelPath: input.modelPath,
          framePaths: resolvedFrames.map((frame) => frame.localFilePath),
          timeoutMs,
        }))
        modelCallMade = output.semanticSpecialistModelExecuted
        if (output.framesAnalyzed !== request.frameSamples.length) {
          throw new Error('Reviewed local Graphics/Motion output omitted bounded frames.')
        }
      } catch {
        failureMessage = 'The reviewed local Graphics/Motion runtime failed closed without retaining raw model output or private frame paths.'
      }

      const temporaryFramesCleaned = await cleanAndProveMissing(
        resolvedFrames,
        input.cleanupPrivateFrames,
      )
      if (!temporaryFramesCleaned) {
        failureMessage = 'The reviewed local Graphics/Motion runtime could not prove ephemeral frame cleanup.'
      }
      if (!output || failureMessage) {
        return createBlockedEditReferenceGraphicsMotionStudyResult({
          request,
          blockerCode: temporaryFramesCleaned ? 'runtime_response_invalid' : 'ephemeral_cleanup_failed',
          blockerMessage: failureMessage ?? 'The reviewed local Graphics/Motion runtime returned invalid bounded evidence.',
          retryAvailable: true,
          retryReason: 'Retry after validating the exact private local runtime, model, technical-motion evidence, and ephemeral frame workspace.',
          execution: {
            boundedPrivateFramesRead,
            technicalMotionResultRead,
            providerCallMade: false,
            modelCallMade,
            workerJobCreated: false,
            temporaryFramesCleaned,
          },
        })
      }

      const runnerDigestSha256 = await hashFile(runnerScriptPath)
      const result = buildEditReferenceAnalyzedGraphicsMotionStudyResult({
        request,
        observations: buildGraphicsObservations(request, output.classifications),
        runtimeSource: 'verified_local',
        providerCallMade: false,
        modelCallMade: true,
        workerJobCreated: false,
        analyzer: localAnalyzer(input.runtime, GRAPHICS_ADAPTER_ID, runnerDigestSha256, 'graphics_motion'),
        provenance: {
          executionId: localExecutionId(request.orchestrationId, input.runtime.runtimeId, 'graphics'),
          startedAt,
          completedAt: now(input),
        },
        usage: controlledTestUsage(),
      })
      assertEditReferenceGraphicsMotionStudyResult(request, result)
      return result
    },
  }
}

function assertControlledColorRequest(request: EditReferenceColorTreatmentStudyRequest): void {
  if (
    request.executionScope !== 'controlled_test'
    || request.approvedUsageEstimateId !== null
    || request.internalCostBudgetId !== null
    || request.immutableRateCardSnapshotId !== null
    || request.maximumAuthorizedInternalCostMicros !== null
    || !request.boundedPrivateFrameInputAllowed
    || request.rawFullMediaInputAllowed
    || request.rawFramePersistenceAllowed
    || request.rawHistogramPersistenceAllowed
    || request.rawProviderPayloadPersistenceAllowed
    || request.externalUrlFetchAllowed
  ) throw new Error('Reviewed local Color Treatment request exceeds its controlled-test authority.')
}

function assertControlledGraphicsRequest(request: EditReferenceGraphicsMotionStudyRequest): void {
  if (
    request.executionScope !== 'controlled_test'
    || request.approvedUsageEstimateId !== null
    || request.internalCostBudgetId !== null
    || request.immutableRateCardSnapshotId !== null
    || request.maximumAuthorizedInternalCostMicros !== null
    || !request.boundedPrivateFrameInputAllowed
    || request.rawFullMediaInputAllowed
    || request.rawFramePersistenceAllowed
    || request.rawDifferenceFramePersistenceAllowed
    || request.rawProviderPayloadPersistenceAllowed
    || request.externalUrlFetchAllowed
  ) throw new Error('Reviewed local Graphics/Motion request exceeds its controlled-test authority.')
}

function buildColorObservations(
  request: EditReferenceColorTreatmentStudyRequest,
  value: ColorClassifications,
): QwenColorTreatmentObservation[] {
  const frameIds = request.frameSamples.map((frame) => frame.privateFrameArtifactId)
  const definitions: Array<{
    category: QwenColorTreatmentObservation['category']
    summary: string
    review: boolean
  }> = [
    { category: 'palette_relationship', summary: colorPaletteSummary(value.paletteRelationship), review: value.paletteRelationship === 'mixed_varied' },
    { category: 'temperature_character', summary: colorTemperatureSummary(value.temperatureCharacter), review: value.temperatureCharacter === 'mixed' },
    { category: 'white_balance_character', summary: whiteBalanceSummary(value.whiteBalanceCharacter), review: value.whiteBalanceCharacter === 'mixed_or_uncertain' },
    { category: 'contrast_structure', summary: contrastSummary(value.contrastStructure), review: value.contrastStructure === 'mixed' },
    { category: 'saturation_vibrance', summary: saturationSummary(value.saturationVibrance), review: value.saturationVibrance === 'mixed' },
    { category: 'luma_distribution', summary: lumaSummary(value.lumaDistribution), review: value.lumaDistribution === 'mixed' },
    { category: 'highlight_rolloff', summary: highlightSummary(value.highlightRolloff), review: value.highlightRolloff === 'mixed_or_uncertain' },
    { category: 'shadow_treatment', summary: shadowSummary(value.shadowTreatment), review: value.shadowTreatment === 'mixed' },
    { category: 'scene_consistency', summary: consistencySummary(value.sceneConsistency), review: ['inconsistent', 'uncertain'].includes(value.sceneConsistency) },
    { category: 'overall_color_character', summary: overallColorSummary(value.overallColorCharacter), review: value.overallColorCharacter === 'mixed_custom' },
  ]
  return definitions.map((definition) => ({
    category: definition.category,
    summary: definition.summary,
    frameIds,
    confidence: value.confidence,
    transferability: 'transferable_principle',
    requiresUserReview: definition.review,
    skinToneRelated: false,
    brandColorRelated: false,
    hdrOrColorManagementRelated: false,
  }))
}

function buildGraphicsObservations(
  request: EditReferenceGraphicsMotionStudyRequest,
  value: GraphicsClassifications,
): QwenGraphicsMotionObservation[] {
  const frameIds = request.frameSamples.map((frame) => frame.privateFrameArtifactId)
  const definitions: Array<{
    category: QwenGraphicsMotionObservation['category']
    summary: string
    review: boolean
  }> = [
    { category: 'icons', summary: iconSummary(value.iconsPresence), review: value.iconsPresence === 'uncertain' },
    { category: 'spacing', summary: spacingSummary(value.spacingDensity), review: value.spacingDensity === 'mixed' },
    { category: 'layout_hierarchy', summary: layoutSummary(value.layoutHierarchy), review: value.layoutHierarchy === 'mixed' },
    { category: 'overlay_placement', summary: overlaySummary(value.overlayPlacement), review: value.overlayPlacement === 'mixed' },
  ]
  return definitions.map((definition) => ({
    category: definition.category,
    summary: definition.summary,
    frameIds,
    confidence: value.confidence,
    transferability: 'transferable_principle',
    requiresUserReview: definition.review,
    visibleTextRelated: false,
    brandOrUiIdentityRelated: false,
    timingRelated: false,
  }))
}

function colorPaletteSummary(value: ColorClassifications['paletteRelationship']): string {
  return ({
    restrained_neutral: 'The sampled frames use a restrained, mostly neutral color relationship.',
    warm_cohesive: 'The sampled frames use a cohesive relationship led by warm color character.',
    cool_cohesive: 'The sampled frames use a cohesive relationship led by cool color character.',
    high_chroma_contrast: 'The sampled frames use vivid color separation to strengthen visual hierarchy.',
    mixed_varied: 'The sampled frames vary in color relationship, so target adaptation needs scene-level review.',
  })[value]
}

function colorTemperatureSummary(value: ColorClassifications['temperatureCharacter']): string {
  return ({
    warm: 'Warm color character is the dominant generalized treatment across the samples.',
    cool: 'Cool color character is the dominant generalized treatment across the samples.',
    neutral: 'A neutral color character is dominant across the sampled frames.',
    mixed: 'Color temperature varies across the samples and requires target-scene adaptation.',
  })[value]
}

function whiteBalanceSummary(value: ColorClassifications['whiteBalanceCharacter']): string {
  return ({
    balanced: 'The samples present a generally balanced neutral reference for white balance.',
    warm_cast: 'The samples present a deliberate warm cast as a generalized visual characteristic.',
    cool_cast: 'The samples present a deliberate cool cast as a generalized visual characteristic.',
    mixed_or_uncertain: 'White-balance character is mixed or uncertain across the bounded samples.',
  })[value]
}

function contrastSummary(value: ColorClassifications['contrastStructure']): string {
  return ({
    soft: 'The sampled treatment favors soft tonal separation and restrained contrast.',
    balanced: 'The sampled treatment uses balanced tonal separation with readable midtones.',
    strong: 'The sampled treatment uses strong tonal separation to establish emphasis.',
    mixed: 'Contrast structure varies across the samples and requires target shot matching.',
  })[value]
}

function saturationSummary(value: ColorClassifications['saturationVibrance']): string {
  return ({
    restrained: 'The sampled treatment keeps saturation restrained.',
    natural: 'The sampled treatment keeps saturation natural and controlled.',
    vivid: 'The sampled treatment uses vivid saturation as a broad visual principle.',
    mixed: 'Saturation character varies across the samples and requires target review.',
  })[value]
}

function lumaSummary(value: ColorClassifications['lumaDistribution']): string {
  return ({
    low_key: 'The sampled frames favor a darker tonal distribution with selective bright emphasis.',
    high_key: 'The sampled frames favor a bright tonal distribution with open exposure.',
    balanced: 'The sampled frames distribute dark, middle, and bright regions in a balanced way.',
    mixed: 'Tonal distribution varies across the samples and requires scene-aware adaptation.',
  })[value]
}

function highlightSummary(value: ColorClassifications['highlightRolloff']): string {
  return ({
    soft: 'Highlights transition softly and preserve a restrained upper tonal region.',
    abrupt: 'Highlights transition more abruptly and require clipping review on target media.',
    mixed_or_uncertain: 'Highlight behavior is mixed or uncertain across the bounded samples.',
  })[value]
}

function shadowSummary(value: ColorClassifications['shadowTreatment']): string {
  return ({
    open: 'Shadow regions remain open enough to preserve visible detail.',
    deep: 'Shadow regions are intentionally deep and used to establish visual weight.',
    balanced: 'Shadow regions balance depth with readable detail.',
    mixed: 'Shadow treatment varies across the samples and requires target shot review.',
  })[value]
}

function consistencySummary(value: ColorClassifications['sceneConsistency']): string {
  return ({
    consistent: 'The sampled scenes maintain a cohesive generalized color character.',
    intentionally_varied: 'The sampled scenes vary their color character in a purposeful contextual pattern.',
    inconsistent: 'The sampled scenes show inconsistent color character that should not be treated as a reusable principle.',
    uncertain: 'The bounded sample set cannot establish scene-level color consistency with confidence.',
  })[value]
}

function overallColorSummary(value: ColorClassifications['overallColorCharacter']): string {
  return ({
    clean_natural: 'The overall color character is clean, natural, and restrained.',
    premium_clean: 'The overall color character is polished, controlled, and premium-clean.',
    warm_lifestyle: 'The overall color character is warm, approachable, and lifestyle-oriented.',
    cinematic_contrast: 'The overall color character uses cinematic tonal separation and controlled emphasis.',
    documentary_neutral: 'The overall color character is documentary-neutral and evidence-forward.',
    bright_social: 'The overall color character is bright, vivid, and optimized for immediate visual clarity.',
    moody_dramatic: 'The overall color character is darker, dramatic, and selectively emphasized.',
    muted_editorial: 'The overall color character is muted, restrained, and editorial.',
    high_key_clean: 'The overall color character is bright, open, and high-key clean.',
    mixed_custom: 'The overall color character is mixed and needs an explicit target-specific interpretation.',
  })[value]
}

function iconSummary(value: GraphicsClassifications['iconsPresence']): string {
  return ({
    none: 'Icon-like graphic elements are not a meaningful part of the sampled hierarchy.',
    restrained: 'Icon-like graphic elements appear sparingly as supporting navigation or explanation cues.',
    prominent: 'Icon-like graphic elements are prominent contributors to the sampled visual hierarchy.',
    uncertain: 'The bounded samples cannot establish a reliable icon-use pattern.',
  })[value]
}

function spacingSummary(value: GraphicsClassifications['spacingDensity']): string {
  return ({
    tight: 'The sampled graphic organization uses compact spacing and dense grouping.',
    balanced: 'The sampled graphic organization balances compact grouping with readable separation.',
    open: 'The sampled graphic organization uses generous separation around important elements.',
    mixed: 'Spacing density varies across the samples and requires target-layout adaptation.',
  })[value]
}

function layoutSummary(value: GraphicsClassifications['layoutHierarchy']): string {
  return ({
    single_focus: 'The sampled graphics organize attention around one dominant focal region.',
    two_level: 'The sampled graphics use a clear primary region with one supporting level.',
    layered: 'The sampled graphics use layered foreground and supporting regions to establish hierarchy.',
    full_frame: 'The sampled graphics distribute visual information across the available frame.',
    mixed: 'Layout hierarchy varies across the samples and requires target-content adaptation.',
  })[value]
}

function overlaySummary(value: GraphicsClassifications['overlayPlacement']): string {
  return ({
    upper: 'Supporting overlays generally occupy upper frame regions while preserving the main focal area.',
    lower: 'Supporting overlays generally occupy lower frame regions while preserving the main focal area.',
    edge_anchored: 'Supporting overlays are generally anchored near frame edges.',
    centered: 'Supporting overlays are generally organized around the central frame region.',
    distributed: 'Supporting overlays are distributed across several purposeful frame regions.',
    mixed: 'Overlay placement varies across the samples and requires target safe-zone review.',
  })[value]
}

async function executeProfile(input: {
  readonly profile: 'color_treatment' | 'graphics_motion'
  readonly pythonCommand: string
  readonly runnerScriptPath: string
  readonly modelPath: string
  readonly framePaths: readonly string[]
  readonly timeoutMs: number
}): Promise<unknown> {
  const result = await execFileAsync(input.pythonCommand, [
    input.runnerScriptPath,
    input.profile,
    input.modelPath,
    ...input.framePaths,
  ], {
    timeout: input.timeoutMs,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    env: offlineEnvironment(),
  })
  const jsonLine = result.stdout.trim().split(/\r?\n/).reverse().find((line) => line.trim().startsWith('{'))
  if (!jsonLine) throw new Error('Reviewed local Qwen specialist omitted reduced JSON output.')
  return JSON.parse(jsonLine) as unknown
}

async function resolveExactPrivateFrames<
  TSample extends { readonly privateFrameArtifactId: string; readonly frameChecksumSha256: string },
  TFrame extends { readonly privateFrameArtifactId: string; readonly localFilePath: string },
>(input: {
  readonly privateFrameRoot: string
  readonly samples: readonly TSample[]
  readonly resolvePrivateFrame: (sample: TSample) => Promise<TFrame>
  readonly resolved: TFrame[]
}): Promise<void> {
  const configuredRoot = path.resolve(input.privateFrameRoot)
  const rootStat = await lstat(configuredRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('Ephemeral Qwen frame root is invalid.')
  const root = await realpath(configuredRoot)
  for (const sample of input.samples) {
    const frame = await input.resolvePrivateFrame(sample)
    if (frame.privateFrameArtifactId !== sample.privateFrameArtifactId) throw new Error('Qwen specialist frame identity mismatch.')
    const configuredPath = path.resolve(frame.localFilePath)
    const frameStat = await lstat(configuredPath)
    if (!frameStat.isFile() || frameStat.isSymbolicLink() || frameStat.size < 1 || frameStat.size > MAX_FRAME_BYTES) {
      throw new Error('Qwen specialist frame is outside its reviewed file bound.')
    }
    const localFilePath = await realpath(configuredPath)
    const relative = path.relative(root, localFilePath)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Qwen specialist frame escaped its private root.')
    if (input.resolved.some((candidate) => candidate.localFilePath === localFilePath)) throw new Error('Qwen specialist frame paths must be unique.')
    if (await hashFile(localFilePath) !== sample.frameChecksumSha256) throw new Error('Qwen specialist frame checksum mismatch.')
    input.resolved.push({ ...frame, localFilePath } as TFrame)
  }
}

async function validateRuntimeInputs(
  input: ReviewedLocalStyleAdapterBaseInput,
  runnerScriptPath: string,
): Promise<void> {
  await validateRuntimePath(input.pythonCommand, 'Reviewed local Qwen Python command', false, true)
  await validateRuntimePath(input.modelPath, 'Reviewed local Qwen model', true)
  await validateRuntimePath(runnerScriptPath, 'Reviewed local Qwen specialist runner')
}

async function validateRuntimePath(
  value: string,
  label: string,
  directory = false,
  allowExecutableAlias = false,
): Promise<void> {
  if (!path.isAbsolute(value) || /https?:\/\//i.test(value)) throw new Error(`${label} must be one absolute local path.`)
  if (!path.resolve(value).startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
  const resolved = await realpath(value)
  if (!allowExecutableAlias && resolved !== path.resolve(value)) throw new Error(`${label} must not use an aliased path.`)
  const pathStat = await lstat(value)
  const targetStat = await lstat(resolved)
  if (
    (!allowExecutableAlias && pathStat.isSymbolicLink())
    || (directory ? !pathStat.isDirectory() : !targetStat.isFile())
  ) throw new Error(`${label} is not a reviewed local path.`)
}

async function cleanAndProveMissing<TFrame extends { readonly localFilePath: string }>(
  frames: readonly TFrame[],
  cleanup: (frames: readonly TFrame[]) => Promise<void>,
): Promise<boolean> {
  try {
    await cleanup(frames)
    await Promise.all(frames.map(async (frame) => {
      try {
        await stat(frame.localFilePath)
        throw new Error('Ephemeral frame remains after cleanup.')
      } catch (error) {
        if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
      }
    }))
    return true
  } catch {
    return false
  }
}

function localAnalyzer(
  runtime: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
  adapterId: string,
  runnerDigestSha256: string,
  profile: string,
) {
  return {
    adapterId,
    adapterVersion: runtime.adapterVersion,
    providerId: null,
    modelId: runtime.modelId,
    modelRevision: runtime.modelRevision,
    modelAggregateSha256: runtime.modelAggregateSha256,
    modelRoutingPolicyVersion: MODEL_ROUTING_POLICY_VERSION,
    analysisInstructionDigestSha256: sha256(`${OUTPUT_SCHEMA_VERSION}:${profile}:${runnerDigestSha256}`),
  }
}

function controlledTestUsage() {
  return {
    mode: 'controlled_test_unmetered' as const,
    approvedUsageEstimateId: null,
    internalCostBudgetId: null,
    immutableRateCardSnapshotId: null,
    maximumAuthorizedInternalCostMicros: null,
    meteredInternalCostMicros: '0',
    usageEventIds: [] as string[],
    internalCostRecordIds: [] as string[],
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
}

function localExecutionId(orchestrationId: string, runtimeId: string, profile: string): string {
  return `qwen25vl-mlx-${profile}-${sha256(`${orchestrationId}:${runtimeId}`).slice(0, 24)}`
}

function boundedTimeout(value: number | undefined): number {
  return Math.min(45 * 60 * 1_000, Math.max(30_000, value ?? 20 * 60 * 1_000))
}

async function hashFile(file: string): Promise<string> {
  const bytes = await import('node:fs/promises').then(({ readFile }) => readFile(file))
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function now(input: ReviewedLocalStyleAdapterBaseInput): string {
  return input.now?.() ?? new Date().toISOString()
}

function offlineEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    TOKENIZERS_PARALLELISM: 'false',
    NO_PROXY: '*',
    no_proxy: '*',
  }
}
