import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import {
  lstat,
  mkdtemp,
  open,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { z } from 'zod'
import type { QwenCaptionDesignObservation } from '../services/qwen-visual-understanding-provider'
import {
  createBlockedEditReferenceCaptionDesignStudyResult,
  validateEditReferenceCaptionDesignStudyRequest,
  validateEditReferenceCaptionDesignStudyResult,
  type EditReferenceCaptionDesignFrameEvidence,
  type EditReferenceCaptionDesignStudyAdapter,
  type EditReferenceCaptionDesignStudyRequest,
  type EditReferenceCaptionDesignStudyResult,
} from './edit-reference-caption-design-study-contract'
import type {
  EditReferenceAnalyzedCaptionOcrStudyResult,
  EditReferenceCaptionOcrStudyRequest,
} from './edit-reference-caption-ocr-study-contract'
import {
  assertExactCaptionDesignManifestAuthority,
  assertExactCaptionOcrAuthority,
  buildEditReferenceAnalyzedCaptionDesignStudyResult,
  toQwenTechnicalCaptionContext,
  type EditReferenceResolvedCaptionDesignFrame,
} from './edit-reference-qwen-caption-design-adapter'
import type {
  EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
} from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'
import {
  validateEditReferencePrivateCaptionTimingArtifact,
  type EditReferencePrivateCaptionTimingArtifact,
} from './edit-reference-caption-timing-authority'

const execFileAsync = promisify(execFile)
const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(
  new URL('./runtime/qwen25vl-mlx-classify-caption-design.py', import.meta.url),
)
const STATIC_OUTPUT_SCHEMA_VERSION = 'reeditpro-reviewed-local-qwen25vl-mlx-caption-design-v1' as const
const TIMED_OUTPUT_SCHEMA_VERSION = 'reeditpro-reviewed-local-qwen25vl-mlx-caption-design-timed-v1' as const
const FAILURE_OUTPUT_SCHEMA_VERSION = 'reeditpro-reviewed-local-qwen25vl-mlx-caption-design-failure-v1' as const
const STATIC_CONTEXT_SCHEMA_VERSION = 'reeditpro-caption-design-sanitized-ocr-context-v1' as const
const TIMED_CONTEXT_SCHEMA_VERSION = 'reeditpro-caption-design-sanitized-timing-context-v1' as const
const MODEL_ROUTING_POLICY_VERSION = 'model-routing-policy-v1' as const
const ADAPTER_ID = 'reeditpro_reviewed_local_qwen25vl_mlx_caption_design' as const
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MAX_FRAME_BYTES = 2 * 1024 * 1024
const MAX_TIMING_ARTIFACT_BYTES = 8 * 1024 * 1024

const classificationsSchema = z.object({
  fontCharacter: z.enum(['clean_sans', 'serif_editorial', 'display_expressive', 'mixed_or_uncertain']),
  weightTreatment: z.enum(['light_or_regular', 'medium_or_bold', 'mixed_or_uncertain']),
  sizeHierarchy: z.enum(['single_level', 'two_level', 'multi_level', 'mixed_or_uncertain']),
  placement: z.enum(['upper', 'center', 'lower', 'mixed']),
  safeZoneBehavior: z.enum(['generous', 'edge_close', 'mixed_or_uncertain']),
  lineBreakPattern: z.enum(['single_line', 'two_line', 'multi_line', 'mixed']),
  highlightedWordTreatment: z.enum(['absent', 'limited', 'prominent', 'uncertain']),
  colorTreatment: z.enum(['restrained_single', 'high_contrast_dual', 'multicolor', 'mixed']),
  strokeShadowBackground: z.enum(['none_or_minimal', 'stroke_or_shadow', 'background_plate', 'mixed']),
  captionDensity: z.enum(['sparse', 'balanced', 'dense', 'mixed']),
  spacing: z.enum(['tight', 'balanced', 'open', 'mixed']),
  readability: z.enum(['high', 'moderate', 'at_risk', 'uncertain']),
  confidence: z.number().min(0.01).max(1),
}).strict()

const staticOutputSchema = z.object({
  schemaVersion: z.literal(STATIC_OUTPUT_SCHEMA_VERSION),
  profile: z.literal('caption_design'),
  framesAnalyzed: z.number().int().min(1).max(8),
  ocrRegionsAnalyzed: z.number().int().min(0).max(128),
  classifications: classificationsSchema,
  semanticSpecialistModelExecuted: z.literal(true),
  ocrEngineExecutedByCaptionDesignAnalyzer: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
  rawFramesPersisted: z.literal(false),
  rawOcrOutputPersisted: z.literal(false),
  recognizedTextPersisted: z.literal(false),
  exactVisibleTextRetained: z.literal(false),
  exactFontIdentityClaimed: z.literal(false),
  animationOrTimingInferred: z.literal(false),
  identityAnalysisPerformed: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

const timingClassificationsSchema = z.object({
  entryExitTiming: z.enum(['cue_bounded', 'phrase_hold', 'extended_hold', 'mixed_or_uncertain']),
  speechAlignment: z.enum(['tight', 'phrase_grouped', 'loose', 'mixed_or_uncertain']),
  confidence: z.number().min(0.01).max(1),
}).strict()

const timedOutputSchema = z.object({
  schemaVersion: z.literal(TIMED_OUTPUT_SCHEMA_VERSION),
  profile: z.literal('caption_design_timed'),
  framesAnalyzed: z.number().int().min(2).max(8),
  ocrRegionsAnalyzed: z.number().int().min(0).max(128),
  transcriptSegmentsAnalyzed: z.number().int().min(1).max(1_000),
  alignedWordsAnalyzed: z.number().int().min(1).max(10_000),
  classifications: classificationsSchema,
  timingClassifications: timingClassificationsSchema,
  semanticSpecialistModelExecuted: z.literal(true),
  ocrEngineExecutedByCaptionDesignAnalyzer: z.literal(false),
  transcriptRuntimeExecutedByCaptionDesignAnalyzer: z.literal(false),
  privateTranscriptTimingRead: z.literal(true),
  rawModelOutputPersisted: z.literal(false),
  rawFramesPersisted: z.literal(false),
  rawOcrOutputPersisted: z.literal(false),
  recognizedTextPersisted: z.literal(false),
  rawTranscriptTextRead: z.literal(false),
  rawTranscriptTextPersisted: z.literal(false),
  exactVisibleTextRetained: z.literal(false),
  exactFontIdentityClaimed: z.literal(false),
  exactAnimationOrTimingInferred: z.literal(false),
  generalizedEntryExitTimingClassified: z.literal(true),
  generalizedSpeechAlignmentClassified: z.literal(true),
  animationStyleClassified: z.literal(false),
  identityAnalysisPerformed: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

const outputSchema = z.discriminatedUnion('schemaVersion', [staticOutputSchema, timedOutputSchema])

const reducedFailureSchema = z.object({
  schemaVersion: z.literal(FAILURE_OUTPUT_SCHEMA_VERSION),
  failureStage: z.enum([
    'visual_required_fields_missing',
    'visual_enum_invalid',
    'visual_confidence_invalid',
    'visual_json_invalid',
    'timing_required_fields_missing',
    'timing_enum_invalid',
    'timing_confidence_invalid',
    'timing_json_invalid',
  ]),
  semanticSpecialistModelExecuted: z.literal(true),
  rawModelOutputPersisted: z.literal(false),
  rawFramesPersisted: z.literal(false),
  rawOcrOutputPersisted: z.literal(false),
  recognizedTextPersisted: z.literal(false),
  rawTranscriptTextPersisted: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

type Classifications = z.infer<typeof classificationsSchema>
type TimingClassifications = z.infer<typeof timingClassificationsSchema>

export interface EditReferenceResolvedCaptionTimingArtifact {
  readonly privateTranscriptArtifactId: string
  readonly privateWordTimingArtifactId: string
  readonly localFilePath: string
}

interface SanitizedTranscriptTimingContext {
  readonly sourceWindowStartSeconds: number
  readonly sourceWindowEndSeconds: number
  readonly segmentCount: number
  readonly alignedWordCount: number
  readonly segments: readonly {
    readonly segmentOrdinal: number
    readonly startSeconds: number
    readonly endSeconds: number
    readonly wordCount: number
    readonly words: readonly {
      readonly wordOrdinal: number
      readonly startSeconds: number
      readonly endSeconds: number
    }[]
  }[]
  readonly exactWordTimingVerified: true
  readonly interpolatedWordTimingUsed: false
  readonly rawTranscriptTextIncluded: false
}

export interface CreateEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapterInput {
  readonly runtime: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
  readonly pythonCommand: string
  readonly modelPath: string
  readonly privateFrameRoot: string
  readonly privateContextRoot: string
  readonly captionOcrRequest: EditReferenceCaptionOcrStudyRequest
  readonly captionOcrResult: EditReferenceAnalyzedCaptionOcrStudyResult
  readonly resolvePrivateFrame: (
    sample: EditReferenceCaptionDesignFrameEvidence,
  ) => Promise<EditReferenceResolvedCaptionDesignFrame>
  readonly cleanupPrivateFrames: (
    frames: readonly EditReferenceResolvedCaptionDesignFrame[],
  ) => Promise<void>
  readonly privateTranscriptRoot?: string
  readonly resolvePrivateTranscriptTiming?: (
    request: EditReferenceCaptionDesignStudyRequest,
  ) => Promise<EditReferenceResolvedCaptionTimingArtifact>
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
  readonly now?: () => string
}

/**
 * Runs the internal-testing-only MLX/Qwen semantic Caption Design specialist
 * over exact private frames and an exact reviewed-local OCR result. The OCR
 * bridge contains geometry/counts only; the model receives no recognized text.
 */
export function createEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapter(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapterInput,
): EditReferenceCaptionDesignStudyAdapter {
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  const timeoutMs = Math.min(45 * 60 * 1_000, Math.max(30_000, input.timeoutMs ?? 20 * 60 * 1_000))
  return {
    adapterId: ADAPTER_ID,
    adapterVersion: input.runtime.adapterVersion,
    async analyze(request): Promise<EditReferenceCaptionDesignStudyResult> {
      validateEditReferenceCaptionDesignStudyRequest(request)
      assertControlledRequest(request)
      const startedAt = now(input)
      const resolvedFrames: EditReferenceResolvedCaptionDesignFrame[] = []
      let boundedPrivateFramesRead = false
      let captionOcrResultRead = false
      let privateTranscriptTimingRead = false
      let modelCallMade = false
      let temporaryFramesCleaned = true
      let contextWorkspaceCleaned = true
      let contextWorkspace: string | undefined
      let output: z.infer<typeof outputSchema> | undefined
      let transcriptTiming: SanitizedTranscriptTimingContext | undefined
      let failureMessage: string | undefined

      try {
        assertExactCaptionDesignManifestAuthority(request)
        assertExactCaptionOcrAuthority(request, input.captionOcrRequest, input.captionOcrResult, {
          allowReviewedLocalOcrForControlledTest: true,
        })
        captionOcrResultRead = true
        if (request.evidenceMode !== 'visual_ocr') {
          transcriptTiming = await resolveExactPrivateTranscriptTiming(input, request)
          privateTranscriptTimingRead = true
        }
        await validateRuntimeInputs(input, runnerScriptPath)
        await resolveExactPrivateFrames(input, request, resolvedFrames)
        boundedPrivateFramesRead = true
        const context = buildSanitizedContext(request, input.captionOcrResult, transcriptTiming)
        contextWorkspace = await createContextWorkspace(input.privateContextRoot, context)
        const contextPath = path.join(contextWorkspace, 'sanitized-ocr-context.json')
        const runtimeOutput = await executeReviewedLocalModel({
          pythonCommand: input.pythonCommand,
          runnerScriptPath,
          modelPath: input.modelPath,
          contextPath,
          framePaths: resolvedFrames.map((frame) => frame.localFilePath),
          timeoutMs,
        })
        const reducedFailure = reducedFailureSchema.safeParse(runtimeOutput)
        if (reducedFailure.success) {
          modelCallMade = true
          failureMessage = `The reviewed local Caption Design runtime rejected its ${reducedFailure.data.failureStage.replaceAll('_', ' ')} before any model output could enter durable state.`
          throw new Error('Reviewed local Caption Design returned a sanitized failure receipt.')
        }
        output = outputSchema.parse(runtimeOutput)
        modelCallMade = output.semanticSpecialistModelExecuted
        if (
          output.framesAnalyzed !== request.frameSamples.length
          || output.ocrRegionsAnalyzed !== request.captionOcrRegionCount
        ) throw new Error('Reviewed local Caption Design output omitted exact bounded evidence.')
        if (request.evidenceMode === 'visual_ocr') {
          if (output.schemaVersion !== STATIC_OUTPUT_SCHEMA_VERSION) {
            throw new Error('Static Caption Design returned a timed output schema.')
          }
        } else if (
          output.schemaVersion !== TIMED_OUTPUT_SCHEMA_VERSION
          || output.transcriptSegmentsAnalyzed !== request.transcriptSegmentCount
          || output.alignedWordsAnalyzed !== request.alignedWordCount
        ) {
          throw new Error('Timed Caption Design output omitted exact transcript-timing evidence.')
        }
      } catch {
        failureMessage ??= 'The reviewed local Caption Design runtime failed closed without retaining raw model output, recognized text, or private paths.'
      }

      if (contextWorkspace) {
        try {
          await rm(contextWorkspace, { recursive: true, force: true })
          await assertPathMissing(contextWorkspace)
        } catch {
          contextWorkspaceCleaned = false
        }
      }
      if (resolvedFrames.length > 0) {
        try {
          await input.cleanupPrivateFrames(resolvedFrames)
          await Promise.all(resolvedFrames.map((frame) => assertPathMissing(frame.localFilePath)))
        } catch {
          temporaryFramesCleaned = false
        }
      }
      if (!temporaryFramesCleaned || !contextWorkspaceCleaned) {
        failureMessage = 'The reviewed local Caption Design runtime could not prove ephemeral frame and OCR-context cleanup.'
      }
      if (!output || failureMessage) {
        return createBlockedEditReferenceCaptionDesignStudyResult({
          request,
          blockerCode: temporaryFramesCleaned && contextWorkspaceCleaned
            ? 'runtime_response_invalid'
            : 'ephemeral_cleanup_failed',
          blockerMessage: failureMessage ?? 'The reviewed local Caption Design runtime returned invalid bounded evidence.',
          retryAvailable: temporaryFramesCleaned && contextWorkspaceCleaned,
          retryReason: temporaryFramesCleaned && contextWorkspaceCleaned
            ? 'Retry after validating the exact OCR authority, private frames, model manifest, and offline runtime.'
            : null,
          execution: {
            boundedPrivateFramesRead,
            captionOcrResultRead,
            privateTranscriptTimingRead,
            providerCallMade: false,
            modelCallMade,
            workerJobCreated: false,
            temporaryFramesCleaned: temporaryFramesCleaned && contextWorkspaceCleaned,
          },
        })
      }

      const runnerDigestSha256 = sha256(await readFile(runnerScriptPath))
      const result = buildEditReferenceAnalyzedCaptionDesignStudyResult({
        request,
        observations: buildObservations(
          request,
          output.classifications,
          output.schemaVersion === TIMED_OUTPUT_SCHEMA_VERSION
            ? output.timingClassifications
            : undefined,
        ),
        runtimeSource: 'verified_local',
        providerCallMade: false,
        modelCallMade: true,
        workerJobCreated: false,
        analyzer: {
          adapterId: ADAPTER_ID,
          adapterVersion: input.runtime.adapterVersion,
          providerId: null,
          modelId: input.runtime.modelId,
          modelRevision: input.runtime.modelRevision,
          modelAggregateSha256: input.runtime.modelAggregateSha256,
          modelRoutingPolicyVersion: MODEL_ROUTING_POLICY_VERSION,
          analysisInstructionDigestSha256: sha256(`${output.schemaVersion}:${runnerDigestSha256}`),
        },
        provenance: {
          executionId: `qwen25vl-mlx-caption-${sha256(`${request.orchestrationId}:${input.runtime.runtimeId}`).slice(0, 24)}`,
          startedAt,
          completedAt: now(input),
        },
        usage: {
          mode: 'controlled_test_unmetered',
          approvedUsageEstimateId: null,
          internalCostBudgetId: null,
          immutableRateCardSnapshotId: null,
          maximumAuthorizedInternalCostMicros: null,
          meteredInternalCostMicros: '0',
          usageEventIds: [],
          internalCostRecordIds: [],
          customerPriceCalculated: false,
          customerCreditsMutated: false,
          serviceFeeIncluded: false,
        },
      })
      validateEditReferenceCaptionDesignStudyResult(request, result)
      return result
    },
  }
}

function assertControlledRequest(request: EditReferenceCaptionDesignStudyRequest): void {
  if (
    request.executionScope !== 'controlled_test'
    || !['visual_ocr', 'visual_ocr_word_timing'].includes(request.evidenceMode)
    || request.approvedUsageEstimateId !== null
    || request.internalCostBudgetId !== null
    || request.immutableRateCardSnapshotId !== null
    || request.maximumAuthorizedInternalCostMicros !== null
    || !request.boundedPrivateFrameInputAllowed
    || request.rawFullMediaInputAllowed
    || request.rawRecognizedTextInputAllowed
    || request.rawTranscriptInRequestAllowed
    || request.externalUrlFetchAllowed
    || request.rawFramePersistenceAllowed
    || request.rawOcrOutputPersistenceAllowed
    || request.rawProviderPayloadPersistenceAllowed
  ) throw new Error('Reviewed local Caption Design request exceeds controlled-test visual/OCR authority, including optional timing evidence.')
}

function buildSanitizedContext(
  request: EditReferenceCaptionDesignStudyRequest,
  ocrResult: EditReferenceAnalyzedCaptionOcrStudyResult,
  transcriptTiming?: SanitizedTranscriptTimingContext,
): Record<string, unknown> {
  const context = toQwenTechnicalCaptionContext(request, ocrResult)
  const base = {
    schemaVersion: request.evidenceMode === 'visual_ocr'
      ? STATIC_CONTEXT_SCHEMA_VERSION
      : TIMED_CONTEXT_SCHEMA_VERSION,
    frameCount: context.frames.length,
    regionCount: context.regionCount,
    frames: context.frames.map((frame, frameIndex) => ({
      frameIndex,
      sourceTimeSeconds: frame.frameTimeSeconds,
      textRegions: frame.textRegions.map((region) => ({
        normalizedBounds: { ...region.normalizedBounds },
        lineCount: region.lineCount,
        estimatedCharacterCount: region.estimatedCharacterCount,
        confidence: region.confidence,
      })),
    })),
    exactTextPersisted: false,
    rawOcrOutputPersisted: false,
    speechTimingAvailable: request.evidenceMode !== 'visual_ocr',
    rawTranscriptTextIncluded: false,
  }
  if (request.evidenceMode === 'visual_ocr') return base
  if (!transcriptTiming) throw new Error('Timed Caption Design lacks sanitized transcript timing.')
  return {
    ...base,
    transcriptTiming,
  }
}

async function resolveExactPrivateTranscriptTiming(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapterInput,
  request: EditReferenceCaptionDesignStudyRequest,
): Promise<SanitizedTranscriptTimingContext> {
  if (
    request.evidenceMode !== 'visual_ocr_word_timing'
    || !input.privateTranscriptRoot
    || !input.resolvePrivateTranscriptTiming
  ) throw new Error('Reviewed local timed Caption Design requires exact private word-timing authority.')
  const rootStat = await lstat(input.privateTranscriptRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('Reviewed local Caption Design private transcript root is invalid.')
  }
  const root = await realpath(input.privateTranscriptRoot)
  if (!root.startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error('Reviewed local Caption Design private transcript root must remain on the authorized external SD volume.')
  }
  const resolved = await input.resolvePrivateTranscriptTiming(request)
  if (
    resolved.privateTranscriptArtifactId !== request.privateTranscriptArtifactId
    || resolved.privateWordTimingArtifactId !== request.privateWordTimingArtifactId
  ) throw new Error('Reviewed local Caption Design transcript/timing identity does not match the request.')
  const configuredPath = path.resolve(resolved.localFilePath)
  const fileStat = await lstat(configuredPath)
  if (
    !fileStat.isFile()
    || fileStat.isSymbolicLink()
    || fileStat.size < 1
    || fileStat.size > MAX_TIMING_ARTIFACT_BYTES
  ) throw new Error('Reviewed local Caption Design timing artifact is invalid or oversized.')
  const resolvedPath = await realpath(configuredPath)
  const relative = path.relative(root, resolvedPath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Reviewed local Caption Design timing artifact escaped its private root.')
  }
  const handle = await open(resolvedPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  let bytes: Buffer
  try {
    bytes = await handle.readFile()
  } finally {
    await handle.close()
  }
  if (sha256(bytes) !== request.wordTimingChecksumSha256) {
    throw new Error('Reviewed local Caption Design timing artifact checksum changed.')
  }
  const artifact = JSON.parse(bytes.toString('utf8')) as unknown
  validateEditReferencePrivateCaptionTimingArtifact(artifact)
  assertTimingArtifactMatchesRequest(request, artifact)
  return sanitizeTranscriptTimingContext(artifact)
}

function assertTimingArtifactMatchesRequest(
  request: EditReferenceCaptionDesignStudyRequest,
  artifact: EditReferencePrivateCaptionTimingArtifact,
): void {
  if (
    artifact.privateTranscriptArtifactId !== request.privateTranscriptArtifactId
    || artifact.transcriptChecksumSha256 !== request.transcriptChecksumSha256
    || artifact.privateWordTimingArtifactId !== request.privateWordTimingArtifactId
    || artifact.privateMediaArtifactId !== request.privateMediaArtifactId
    || artifact.mediaChecksumSha256 !== request.mediaChecksumSha256
    || artifact.transcriptRuntimeSource !== request.transcriptRuntimeSource
    || artifact.transcriptRuntimeId !== request.transcriptRuntimeId
    || artifact.transcriptRuntimeVersion !== request.transcriptRuntimeVersion
    || artifact.transcriptModelManifestId !== request.transcriptModelManifestId
    || artifact.transcriptExecutionId !== request.transcriptExecutionId
    || artifact.transcriptQaStatus !== request.transcriptQaStatus
    || artifact.segmentTimingAuthorityVerified !== request.segmentTimingAuthorityVerified
    || artifact.wordTimingAuthorityVerified !== request.wordTimingAuthorityVerified
    || artifact.transcriptSegmentCount !== request.transcriptSegmentCount
    || artifact.alignedWordCount !== request.alignedWordCount
    || artifact.sourceCoverageStartSeconds > request.analysisWindowStartSeconds
    || artifact.sourceCoverageEndSeconds < request.analysisWindowEndSeconds
  ) throw new Error('Reviewed local Caption Design timing artifact does not match the exact request authority.')
}

function sanitizeTranscriptTimingContext(
  artifact: EditReferencePrivateCaptionTimingArtifact,
): SanitizedTranscriptTimingContext {
  return {
    sourceWindowStartSeconds: artifact.sourceCoverageStartSeconds,
    sourceWindowEndSeconds: artifact.sourceCoverageEndSeconds,
    segmentCount: artifact.transcriptSegmentCount,
    alignedWordCount: artifact.alignedWordCount,
    segments: artifact.segments.map((segment) => ({
      segmentOrdinal: segment.segmentOrdinal,
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      wordCount: segment.wordCount,
      words: segment.words.map((word) => ({
        wordOrdinal: word.wordOrdinal,
        startSeconds: word.startSeconds,
        endSeconds: word.endSeconds,
      })),
    })),
    exactWordTimingVerified: true,
    interpolatedWordTimingUsed: false,
    rawTranscriptTextIncluded: false,
  }
}

function buildObservations(
  request: EditReferenceCaptionDesignStudyRequest,
  value: Classifications,
  timing?: TimingClassifications,
): QwenCaptionDesignObservation[] {
  const frameIds = request.frameSamples.map((frame) => frame.privateFrameArtifactId)
  const definitions: Array<{
    category: QwenCaptionDesignObservation['category']
    summary: string
    review: boolean
  }> = [
    { category: 'font_character', summary: fontSummary(value.fontCharacter), review: true },
    { category: 'weight_treatment', summary: weightSummary(value.weightTreatment), review: value.weightTreatment === 'mixed_or_uncertain' },
    { category: 'size_hierarchy', summary: hierarchySummary(value.sizeHierarchy), review: value.sizeHierarchy === 'mixed_or_uncertain' },
    { category: 'placement', summary: placementSummary(value.placement), review: value.placement === 'mixed' },
    { category: 'safe_zone_behavior', summary: safeZoneSummary(value.safeZoneBehavior), review: true },
    { category: 'line_break_pattern', summary: lineBreakSummary(value.lineBreakPattern), review: value.lineBreakPattern === 'mixed' },
    { category: 'highlighted_word_treatment', summary: highlightSummary(value.highlightedWordTreatment), review: value.highlightedWordTreatment === 'uncertain' },
    { category: 'color_treatment', summary: colorSummary(value.colorTreatment), review: value.colorTreatment === 'mixed' },
    { category: 'stroke_shadow_background', summary: supportSummary(value.strokeShadowBackground), review: value.strokeShadowBackground === 'mixed' },
    { category: 'caption_density', summary: densitySummary(value.captionDensity), review: value.captionDensity === 'mixed' },
    { category: 'spacing', summary: spacingSummary(value.spacing), review: value.spacing === 'mixed' },
    { category: 'readability', summary: readabilitySummary(value.readability), review: ['at_risk', 'uncertain'].includes(value.readability) },
  ]
  const observations: QwenCaptionDesignObservation[] = definitions.map((definition) => ({
    category: definition.category,
    summary: definition.summary,
    frameIds,
    confidence: value.confidence,
    transferability: 'transferable_principle',
    timingBasis: 'frame_sequence',
    requiresUserReview: definition.review,
    safeZoneRelated: definition.category === 'safe_zone_behavior',
    speechTimingRelated: false,
    fontOrBrandRelated: definition.category === 'font_character',
    claimRelated: false,
    exactReferenceWordingRetained: false,
    exactFontIdentityClaimed: false,
  }))
  if (!timing) return observations
  const timingObservations: QwenCaptionDesignObservation[] = [
    {
      category: 'entry_exit_timing',
      summary: entryExitTimingSummary(timing.entryExitTiming),
      frameIds,
      confidence: timing.confidence,
      transferability: 'transferable_principle',
      timingBasis: 'frame_sequence',
      requiresUserReview: timing.entryExitTiming === 'mixed_or_uncertain',
      safeZoneRelated: false,
      speechTimingRelated: false,
      fontOrBrandRelated: false,
      claimRelated: false,
      exactReferenceWordingRetained: false,
      exactFontIdentityClaimed: false,
    },
    {
      category: 'speech_alignment',
      summary: speechAlignmentSummary(timing.speechAlignment),
      frameIds,
      confidence: timing.confidence,
      transferability: 'transferable_principle',
      timingBasis: 'word',
      requiresUserReview: timing.speechAlignment === 'mixed_or_uncertain',
      safeZoneRelated: false,
      speechTimingRelated: true,
      fontOrBrandRelated: false,
      claimRelated: false,
      exactReferenceWordingRetained: false,
      exactFontIdentityClaimed: false,
    },
  ]
  return [
    ...observations,
    ...timingObservations,
  ]
}

function entryExitTimingSummary(value: TimingClassifications['entryExitTiming']): string {
  return ({
    cue_bounded: 'Caption visibility changes stay bounded to distinct source cues without creating an exact transferable timing map.',
    phrase_hold: 'Caption groups generally hold across coherent spoken phrases and require target-specific retiming.',
    extended_hold: 'Caption groups tend to remain visible beyond short phrase units and require target readability review.',
    mixed_or_uncertain: 'The bounded frame sequence does not establish one reliable caption entry-and-exit character.',
  })[value]
}

function speechAlignmentSummary(value: TimingClassifications['speechAlignment']): string {
  return ({
    tight: 'Caption presence tracks verified speech timing closely while exact source wording and timing remain non-transferable.',
    phrase_grouped: 'Caption presence follows phrase-level speech groups and must be rebuilt from the target transcript.',
    loose: 'Caption presence is only loosely aligned to verified speech timing and requires target-specific correction.',
    mixed_or_uncertain: 'The bounded evidence does not establish reliable caption-to-speech alignment.',
  })[value]
}

function fontSummary(value: Classifications['fontCharacter']): string {
  return ({
    clean_sans: 'The sampled captions show a clean, high-legibility sans-serif character without establishing an exact font identity.',
    serif_editorial: 'The sampled captions show a serif-led editorial character without establishing an exact font identity.',
    display_expressive: 'The sampled captions use an expressive display character that requires target readability and licensing review.',
    mixed_or_uncertain: 'The bounded visual evidence does not establish one reliable font character.',
  })[value]
}

function weightSummary(value: Classifications['weightTreatment']): string {
  return ({
    light_or_regular: 'The sampled captions use restrained light-to-regular visual weight.',
    medium_or_bold: 'The sampled captions use medium-to-bold visual weight for immediate emphasis.',
    mixed_or_uncertain: 'Caption weight varies or remains uncertain in the bounded evidence.',
  })[value]
}

function hierarchySummary(value: Classifications['sizeHierarchy']): string {
  return ({
    single_level: 'The sampled captions maintain one dominant size hierarchy.',
    two_level: 'The sampled captions use a clear primary and supporting size hierarchy.',
    multi_level: 'The sampled captions use several visible hierarchy levels that require target simplification review.',
    mixed_or_uncertain: 'Caption size hierarchy is mixed or uncertain in the bounded evidence.',
  })[value]
}

function placementSummary(value: Classifications['placement']): string {
  return ({
    upper: 'The observed caption field generally occupies an upper frame region and must be recomputed for the target layout.',
    center: 'The observed caption field generally occupies a central frame region and must be recomputed for the target layout.',
    lower: 'The observed caption field generally occupies a lower frame region and must be recomputed for the target layout.',
    mixed: 'Caption placement varies across the bounded evidence and requires target-scene adaptation.',
  })[value]
}

function safeZoneSummary(value: Classifications['safeZoneBehavior']): string {
  return ({
    generous: 'The observed caption field leaves generous edge separation, subject to target safe-zone and collision review.',
    edge_close: 'The observed caption field approaches frame edges and requires stronger target safe-zone review.',
    mixed_or_uncertain: 'Edge separation is mixed or uncertain and requires explicit target safe-zone review.',
  })[value]
}

function lineBreakSummary(value: Classifications['lineBreakPattern']): string {
  return ({
    single_line: 'The sampled caption field generally favors a compact single-line reading pattern.',
    two_line: 'The sampled caption field generally favors a restrained two-line reading pattern.',
    multi_line: 'The sampled caption field uses a denser multi-line reading pattern that requires target readability review.',
    mixed: 'Line-break character varies across the bounded evidence and must be adapted to target wording.',
  })[value]
}

function highlightSummary(value: Classifications['highlightedWordTreatment']): string {
  return ({
    absent: 'The sampled captions do not rely on conspicuous word-level highlighting.',
    limited: 'The sampled captions use restrained selective emphasis as a supporting visual principle.',
    prominent: 'The sampled captions use prominent selective emphasis that requires target restraint and readability review.',
    uncertain: 'The bounded evidence cannot establish a reliable selective-emphasis pattern.',
  })[value]
}

function colorSummary(value: Classifications['colorTreatment']): string {
  return ({
    restrained_single: 'The sampled captions use a restrained, mostly single-color relationship.',
    high_contrast_dual: 'The sampled captions use a high-contrast dual-color relationship for readable emphasis.',
    multicolor: 'The sampled captions use several color roles and require target palette simplification review.',
    mixed: 'Caption color treatment varies across the bounded evidence.',
  })[value]
}

function supportSummary(value: Classifications['strokeShadowBackground']): string {
  return ({
    none_or_minimal: 'The sampled captions use little or no visible supporting stroke, shadow, or plate treatment.',
    stroke_or_shadow: 'The sampled captions use stroke or shadow support to preserve foreground separation.',
    background_plate: 'The sampled captions use a bounded background plate to preserve readable separation.',
    mixed: 'Caption support treatment varies across the bounded evidence and requires target-scene review.',
  })[value]
}

function densitySummary(value: Classifications['captionDensity']): string {
  return ({
    sparse: 'The sampled caption presentation is visually sparse and leaves substantial open frame area.',
    balanced: 'The sampled caption presentation balances information density with open frame area.',
    dense: 'The sampled caption presentation is visually dense and requires target reading-time review.',
    mixed: 'Caption density varies across the bounded evidence.',
  })[value]
}

function spacingSummary(value: Classifications['spacing']): string {
  return ({
    tight: 'The sampled captions use compact internal spacing.',
    balanced: 'The sampled captions use balanced internal spacing for readable grouping.',
    open: 'The sampled captions use generous internal spacing and separation.',
    mixed: 'Caption spacing varies across the bounded evidence.',
  })[value]
}

function readabilitySummary(value: Classifications['readability']): string {
  return ({
    high: 'The bounded visual evidence shows strong generalized caption readability.',
    moderate: 'The bounded visual evidence shows moderate caption readability with target validation still required.',
    at_risk: 'The bounded visual evidence shows readability risk that should not transfer without correction.',
    uncertain: 'The bounded evidence cannot establish reliable caption readability.',
  })[value]
}

async function validateRuntimeInputs(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapterInput,
  runnerScriptPath: string,
): Promise<void> {
  if (
    input.runtime.productionReady
    || input.runtime.providerCallMade
    || input.runtime.allowExternalUrlFetch
    || input.runtime.allowModelDownload
    || input.runtime.commercialUseStatus !== 'internal_testing_only'
  ) throw new Error('Reviewed local Caption Design runtime receipt crossed its internal-testing boundary.')
  await validateLocalPath(input.pythonCommand, 'Reviewed local Qwen Python command', false, true)
  await validateLocalPath(input.modelPath, 'Reviewed local Qwen model', true)
  await validateLocalPath(runnerScriptPath, 'Reviewed local Caption Design runner')
  await validateLocalPath(input.privateContextRoot, 'Reviewed local Caption Design context root', true)
}

async function validateLocalPath(
  value: string,
  label: string,
  directory = false,
  allowExecutableAlias = false,
): Promise<void> {
  if (!path.isAbsolute(value) || /https?:\/\//i.test(value) || !path.resolve(value).startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
  const resolved = await realpath(value)
  if (!allowExecutableAlias && resolved !== path.resolve(value)) throw new Error(`${label} must not use an aliased path.`)
  const sourceStat = await lstat(value)
  const targetStat = await lstat(resolved)
  if ((!allowExecutableAlias && sourceStat.isSymbolicLink()) || (directory ? !sourceStat.isDirectory() : !targetStat.isFile())) {
    throw new Error(`${label} has an invalid filesystem identity.`)
  }
}

async function resolveExactPrivateFrames(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapterInput,
  request: EditReferenceCaptionDesignStudyRequest,
  resolvedFrames: EditReferenceResolvedCaptionDesignFrame[],
): Promise<void> {
  const rootStat = await lstat(input.privateFrameRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('Caption Design private frame root is invalid.')
  const root = await realpath(input.privateFrameRoot)
  for (const sample of request.frameSamples) {
    const frame = await input.resolvePrivateFrame(sample)
    if (frame.privateFrameArtifactId !== sample.privateFrameArtifactId) throw new Error('Caption Design frame identity mismatch.')
    const configuredPath = path.resolve(frame.localFilePath)
    const fileStat = await lstat(configuredPath)
    if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.size < 1 || fileStat.size > MAX_FRAME_BYTES) {
      throw new Error('Caption Design frame is outside its bounded file authority.')
    }
    const localFilePath = await realpath(configuredPath)
    const relative = path.relative(root, localFilePath)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Caption Design frame escaped its private root.')
    const handle = await open(localFilePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
    try {
      const bytes = await handle.readFile()
      if (sha256(bytes) !== sample.frameChecksumSha256) throw new Error('Caption Design frame checksum mismatch.')
      const dimensions = readJpegDimensions(bytes)
      if (dimensions.width !== sample.width || dimensions.height !== sample.height) throw new Error('Caption Design frame dimensions mismatch.')
    } finally {
      await handle.close()
    }
    resolvedFrames.push({ privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath })
  }
}

async function createContextWorkspace(root: string, context: Record<string, unknown>): Promise<string> {
  const workspace = await mkdtemp(path.join(root, 'caption-design-context-'))
  try {
    await writeFile(
      path.join(workspace, 'sanitized-ocr-context.json'),
      JSON.stringify(context),
      { encoding: 'utf8', flag: 'wx', mode: 0o600 },
    )
    return workspace
  } catch (error) {
    await rm(workspace, { recursive: true, force: true })
    throw error
  }
}

async function executeReviewedLocalModel(input: {
  readonly pythonCommand: string
  readonly runnerScriptPath: string
  readonly modelPath: string
  readonly contextPath: string
  readonly framePaths: readonly string[]
  readonly timeoutMs: number
}): Promise<unknown> {
  const result = await execFileAsync(input.pythonCommand, [
    input.runnerScriptPath,
    input.modelPath,
    input.contextPath,
    ...input.framePaths,
  ], {
    timeout: input.timeoutMs,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      HF_HUB_DISABLE_TELEMETRY: '1',
      TOKENIZERS_PARALLELISM: 'false',
      NO_PROXY: '*',
      no_proxy: '*',
    },
  })
  const jsonLine = result.stdout.trim().split(/\r?\n/).reverse().find((line) => line.trim().startsWith('{'))
  if (!jsonLine) throw new Error('Reviewed local Caption Design runtime omitted reduced JSON output.')
  return JSON.parse(jsonLine) as unknown
}

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Caption Design frame is not a JPEG.')
  const markers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  let offset = 2
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break
    const marker = bytes[offset] as number
    offset += 1
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= bytes.length) break
    const length = bytes.readUInt16BE(offset)
    if (length < 2 || offset + length > bytes.length) break
    if (markers.has(marker) && length >= 7) {
      const height = bytes.readUInt16BE(offset + 3)
      const width = bytes.readUInt16BE(offset + 5)
      if (width > 0 && height > 0) return { width, height }
    }
    offset += length
  }
  throw new Error('Caption Design JPEG dimensions are unavailable.')
}

async function assertPathMissing(value: string): Promise<void> {
  try {
    await stat(value)
    throw new Error('Ephemeral Caption Design path remains after cleanup.')
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
  }
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function now(input: CreateEditReferenceReviewedLocalQwen25VlMlxCaptionDesignAdapterInput): string {
  return input.now?.() ?? new Date().toISOString()
}
