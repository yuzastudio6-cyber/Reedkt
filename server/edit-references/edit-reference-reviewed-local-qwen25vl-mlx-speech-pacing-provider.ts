import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { QWEN_VISUAL_UNDERSTANDING_RETIREMENT } from
  '../services/qwen-visual-understanding-provider'
import {
  resolveEditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
  type EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding,
  type EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
} from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'
import {
  QWEN_SPEECH_PACING_MODEL_ROUTING_POLICY_VERSION,
  qwenSpeechPacingStructuredContextSchema,
  type QwenSpeechPacingObservation,
  type QwenSpeechPacingProviderResult,
  type QwenSpeechPacingReasoningProvider,
  type QwenSpeechPacingStructuredContext,
} from '../services/qwen-speech-pacing-provider'

export const EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_SPEECH_PACING_PROVIDER_ID =
  'qwen25vl_mlx_speech_pacing_reasoning_provider' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_SPEECH_PACING_PROVIDER_VERSION =
  'v1' as const

const OUTPUT_SCHEMA_VERSION =
  'reeditpro-reviewed-local-qwen25vl-mlx-speech-pacing-v1' as const
const INPUT_SCHEMA_VERSION =
  'reeditpro-reviewed-local-speech-pacing-input-v1' as const
const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(
  new URL('./runtime/qwen25vl-mlx-classify-speech-pacing.py', import.meta.url),
)
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MAX_INPUT_BYTES = 32_000
const MAX_OUTPUT_BYTES = 128 * 1024

const classificationsSchema = z.object({
  transcriptStructure: z.enum([
    'linear_exposition', 'setup_development_payoff', 'question_answer',
    'list_or_steps', 'story_arc', 'mixed', 'uncertain',
  ]),
  openingFunction: z.enum([
    'direct_context', 'question_led', 'problem_led', 'promise_led',
    'narrative_entry', 'gradual_context', 'uncertain',
  ]),
  sentenceRhythm: z.enum(['compact', 'balanced', 'extended', 'varied', 'uncertain']),
  speechDensity: z.enum(['sparse', 'moderate', 'dense', 'varied', 'uncertain']),
  pausePattern: z.enum(['minimal', 'breathing_room', 'sectional', 'varied', 'uncertain']),
  captionTimingNeed: z.enum([
    'segment_sufficient', 'word_precision_helpful', 'word_precision_important', 'uncertain',
  ]),
  confidence: z.number().min(0.01).max(1),
}).strict()

const outputSchema = z.object({
  schemaVersion: z.literal(OUTPUT_SCHEMA_VERSION),
  segmentsAnalyzed: z.number().int().min(1).max(1_000),
  wordsAvailable: z.number().int().min(0).max(10_000),
  classifications: classificationsSchema,
  semanticSpecialistModelExecuted: z.literal(true),
  rawTranscriptPersisted: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
  exactReferenceWordingRetained: z.literal(false),
  exactReferenceTimingInstructionCreated: z.literal(false),
  executableCutInstructionCreated: z.literal(false),
  voiceIdentityAnalysisPerformed: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

type Classifications = z.infer<typeof classificationsSchema>

export interface CreateEditReferenceReviewedLocalQwen25VlMlxSpeechPacingProviderInput {
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly runValidation?: EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
}

interface ReviewedRuntimeAuthority {
  readonly receipt: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
  readonly runnerScriptPath: string
  readonly runnerDigestSha256: string
}

/**
 * Creates an explicit-injection, internal-testing-only Speech/Pacing provider.
 * The pinned Qwen receipt proves exact model/runtime bytes; this provider adds
 * a separate enum-only transcript-use boundary and never changes that receipt
 * into production, provider, pricing, or delivery authority.
 */
export function createEditReferenceReviewedLocalQwen25VlMlxSpeechPacingProvider(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxSpeechPacingProviderInput,
): QwenSpeechPacingReasoningProvider {
  if (!QWEN_VISUAL_UNDERSTANDING_RETIREMENT.freshExecutionAllowed) {
    throw new Error(
      'reviewed_local_qwen25vl_mlx_retired_use_visual_intelligence',
    )
  }
  const timeoutMs = boundedTimeout(input.timeoutMs)
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  let runtimePromise: Promise<ReviewedRuntimeAuthority> | undefined
  const runtime = (): Promise<ReviewedRuntimeAuthority> => {
    runtimePromise ??= validateReviewedRuntime(input, runnerScriptPath)
    return runtimePromise
  }

  return {
    executionMode: 'controlled_local',
    async analyze(value): Promise<QwenSpeechPacingProviderResult> {
      const parsed = qwenSpeechPacingStructuredContextSchema.safeParse(value)
      if (!parsed.success) {
        return blocked(false, false, ['speech_pacing_reviewed_local_context_invalid'])
      }
      const context = parsed.data
      if (!contextAuthorityIsConsistent(context)) {
        return blocked(true, false, ['speech_pacing_reviewed_local_context_authority_invalid'])
      }
      let modelCallMade = false
      try {
        const authority = await runtime()
        const modelInput = createModelInput(context)
        const serializedInput = JSON.stringify(modelInput)
        if (Buffer.byteLength(serializedInput, 'utf8') > MAX_INPUT_BYTES) {
          return blocked(true, false, ['speech_pacing_reviewed_local_context_outside_bound'])
        }
        const output = outputSchema.parse(await executeClassifier({
          pythonCommand: input.pythonCommand,
          runnerScriptPath: authority.runnerScriptPath,
          modelPath: input.modelPath,
          serializedInput,
          timeoutMs,
          onSpawn: () => { modelCallMade = true },
        }))
        const wordCount = context.transcriptSegments.reduce(
          (count, segment) => count + segment.words.length,
          0,
        )
        if (
          output.segmentsAnalyzed !== context.transcriptSegments.length
          || output.wordsAvailable !== wordCount
        ) {
          return blocked(true, true, ['speech_pacing_reviewed_local_coverage_mismatch'])
        }
        const observations = buildObservations(context, output.classifications)
        return {
          status: 'completed',
          observations,
          coverage: {
            partial: missingEvidenceKinds(context).length > 0,
            missingEvidenceKinds: missingEvidenceKinds(context),
          },
          execution: {
            privateTranscriptArtifactRead: true,
            structuredTimingEvidenceRead: true,
            providerCallMade: false,
            modelCallMade: true,
            workerJobCreated: false,
            remoteMutationMade: false,
          },
          runtimeProvenance: {
            runtimeSource: 'verified_local',
            adapterId: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_SPEECH_PACING_PROVIDER_ID,
            adapterVersion: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_SPEECH_PACING_PROVIDER_VERSION,
            providerId: null,
            modelId: authority.receipt.modelId,
            modelRevision: authority.receipt.modelRevision,
            modelAggregateSha256: authority.receipt.modelAggregateSha256,
            modelRoutingPolicyVersion: QWEN_SPEECH_PACING_MODEL_ROUTING_POLICY_VERSION,
            analysisInstructionDigestSha256: sha256([
              OUTPUT_SCHEMA_VERSION,
              INPUT_SCHEMA_VERSION,
              authority.runnerDigestSha256,
              authority.receipt.manifestDigestSha256,
            ].join(':')),
          },
          blockers: [],
        }
      } catch {
        return blocked(true, modelCallMade, [
          modelCallMade
            ? 'speech_pacing_reviewed_local_runtime_failed'
            : 'speech_pacing_reviewed_local_runtime_unavailable',
        ])
      }
    },
  }
}

function createModelInput(context: QwenSpeechPacingStructuredContext) {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    wordTimingAvailable: context.wordTimingMode !== 'not_available',
    segments: context.transcriptSegments.map((segment, index) => ({
      index,
      text: segment.text,
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      wordCount: segment.words.length,
    })),
  }
}

function buildObservations(
  context: QwenSpeechPacingStructuredContext,
  value: Classifications,
): QwenSpeechPacingObservation[] {
  const transcriptEvidenceIds = evidenceIds(context, 'transcript')
  const segmentEvidenceIds = evidenceIds(context, 'segment_timing')
  const studyGoalEvidenceIds = evidenceIds(context, 'study_goal')
  const wordEvidenceIds = evidenceIds(context, 'word_timing')
  const baseEvidenceIds = unique([
    ...transcriptEvidenceIds,
    ...segmentEvidenceIds,
    ...studyGoalEvidenceIds,
  ])
  const firstSegment = context.transcriptSegments[0]
  const lastSegment = context.transcriptSegments.at(-1)!
  const wholeRange = sourceRange(
    'speech-pacing-reviewed-local-whole-range',
    firstSegment.startSeconds,
    lastSegment.endSeconds,
    'segment',
    unique([...transcriptEvidenceIds, ...segmentEvidenceIds]),
  )
  const openingRange = sourceRange(
    'speech-pacing-reviewed-local-opening-range',
    firstSegment.startSeconds,
    firstSegment.endSeconds,
    'segment',
    unique([...transcriptEvidenceIds, ...segmentEvidenceIds]),
  )
  const captionUsesWords = context.wordTimingMode !== 'not_available' && wordEvidenceIds.length > 0
  const captionEvidenceIds = captionUsesWords
    ? unique([...baseEvidenceIds, ...wordEvidenceIds])
    : baseEvidenceIds
  const captionRange = sourceRange(
    'speech-pacing-reviewed-local-caption-range',
    firstSegment.startSeconds,
    lastSegment.endSeconds,
    captionUsesWords ? 'word' : 'segment',
    captionUsesWords
      ? unique([...transcriptEvidenceIds, ...segmentEvidenceIds, ...wordEvidenceIds])
      : unique([...transcriptEvidenceIds, ...segmentEvidenceIds]),
  )
  const review = (classification: string): boolean => (
    classification === 'mixed' || classification === 'varied' || classification === 'uncertain'
  )
  return [
    observation({
      category: 'transcript_structure',
      summary: transcriptStructureSummary(value.transcriptStructure),
      evidenceIds: baseEvidenceIds,
      sourceRange: wholeRange,
      confidence: value.confidence,
      requiresUserReview: review(value.transcriptStructure),
    }),
    observation({
      category: 'hook_phrasing_function',
      summary: openingFunctionSummary(value.openingFunction),
      evidenceIds: baseEvidenceIds,
      sourceRange: openingRange,
      confidence: value.confidence,
      requiresUserReview: review(value.openingFunction),
    }),
    observation({
      category: 'sentence_rhythm',
      summary: sentenceRhythmSummary(value.sentenceRhythm),
      evidenceIds: baseEvidenceIds,
      sourceRange: wholeRange,
      confidence: value.confidence,
      requiresUserReview: review(value.sentenceRhythm),
    }),
    observation({
      category: 'speech_density',
      summary: speechDensitySummary(value.speechDensity),
      evidenceIds: baseEvidenceIds,
      sourceRange: wholeRange,
      confidence: value.confidence,
      requiresUserReview: review(value.speechDensity),
    }),
    observation({
      category: 'pause_pattern',
      summary: pausePatternSummary(value.pausePattern),
      evidenceIds: baseEvidenceIds,
      sourceRange: wholeRange,
      confidence: value.confidence,
      requiresUserReview: review(value.pausePattern),
    }),
    observation({
      category: 'caption_timing_evidence',
      summary: captionTimingSummary(value.captionTimingNeed),
      evidenceIds: captionEvidenceIds,
      sourceRange: captionRange,
      confidence: value.confidence,
      requiresUserReview: review(value.captionTimingNeed),
      transferability: 'context_only',
    }),
  ]
}

function observation(input: {
  readonly category: QwenSpeechPacingObservation['category']
  readonly summary: string
  readonly evidenceIds: readonly string[]
  readonly sourceRange: QwenSpeechPacingObservation['sourceRanges'][number]
  readonly confidence: number
  readonly requiresUserReview: boolean
  readonly transferability?: QwenSpeechPacingObservation['transferability']
}): QwenSpeechPacingObservation {
  return {
    category: input.category,
    summary: input.summary,
    evidenceIds: [...input.evidenceIds],
    sourceRanges: [input.sourceRange],
    confidence: input.confidence,
    transferability: input.transferability ?? 'transferable_principle',
    timingBasis: input.sourceRange.timingBasis,
    requiresUserReview: input.requiresUserReview,
    meaningPreservationRequired: true,
    claimRelated: false,
    factSafetyStatus: 'not_applicable',
  }
}

function sourceRange(
  rangeId: string,
  startSeconds: number,
  endSeconds: number,
  timingBasis: QwenSpeechPacingObservation['timingBasis'],
  evidenceIds: readonly string[],
): QwenSpeechPacingObservation['sourceRanges'][number] {
  return { rangeId, startSeconds, endSeconds, timingBasis, evidenceIds: [...evidenceIds] }
}

function evidenceIds(
  context: QwenSpeechPacingStructuredContext,
  kind: QwenSpeechPacingStructuredContext['evidenceItems'][number]['kind'],
): string[] {
  return context.evidenceItems
    .filter((item) => item.kind === kind)
    .map((item) => item.evidenceId)
}

function missingEvidenceKinds(context: QwenSpeechPacingStructuredContext): string[] {
  return [
    ...(context.wordTimingMode === 'not_available' ? ['word_timing'] : []),
    ...(context.speakerSegmentationMode === 'not_requested' ? ['speaker_segmentation'] : []),
  ]
}

function contextAuthorityIsConsistent(context: QwenSpeechPacingStructuredContext): boolean {
  if (
    JSON.stringify(context).length > MAX_INPUT_BYTES
    || context.analysisWindowEndSeconds <= context.analysisWindowStartSeconds
    || context.analysisWindowEndSeconds > context.sourceDurationSeconds + 0.001
  ) return false
  const evidence = context.evidenceItems.map((item) => item.evidenceId)
  if (
    new Set(evidence).size !== evidence.length
    || evidenceIds(context, 'transcript').length < 1
    || evidenceIds(context, 'segment_timing').length < 1
  ) return false
  if (context.wordTimingMode === 'not_available') {
    if (context.wordTimingChecksumSha256 !== null || context.transcriptSegments.some((segment) => segment.words.length > 0)) {
      return false
    }
  } else if (
    !context.wordTimingChecksumSha256
    || context.transcriptSegments.some((segment) => segment.words.length < 1)
  ) return false
  if ((context.speakerSegmentationMode === 'not_requested') !== (context.speakerTurns.length === 0)) return false
  if ((context.speakerSegmentationMode === 'not_requested') !== (context.speakerSegmentationChecksumSha256 === null)) return false
  let previousSegmentEnd = context.analysisWindowStartSeconds
  for (const segment of context.transcriptSegments) {
    if (
      segment.endSeconds <= segment.startSeconds
      || segment.startSeconds < context.analysisWindowStartSeconds - 0.001
      || segment.endSeconds > context.analysisWindowEndSeconds + 0.001
      || segment.startSeconds < previousSegmentEnd - 0.001
    ) return false
    previousSegmentEnd = segment.endSeconds
    let previousWordEnd = segment.startSeconds
    for (const word of segment.words) {
      if (
        word.endSeconds <= word.startSeconds
        || word.startSeconds < segment.startSeconds - 0.001
        || word.endSeconds > segment.endSeconds + 0.001
        || word.startSeconds < previousWordEnd - 0.001
      ) return false
      previousWordEnd = word.endSeconds
    }
  }
  return context.speakerTurns.every((turn) => (
    turn.endSeconds > turn.startSeconds
    && turn.startSeconds >= context.analysisWindowStartSeconds - 0.001
    && turn.endSeconds <= context.analysisWindowEndSeconds + 0.001
    && turn.evidenceIds.every((id) => evidence.includes(id))
  ))
}

async function validateReviewedRuntime(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxSpeechPacingProviderInput,
  runnerScriptPath: string,
): Promise<ReviewedRuntimeAuthority> {
  await validateRuntimePath(runnerScriptPath, 'Reviewed local Speech/Pacing runner')
  const receipt = await resolveEditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt({
    manifestPath: input.manifestPath,
    modelPath: input.modelPath,
    pythonCommand: input.pythonCommand,
    ...(input.runValidation ? { runValidation: input.runValidation } : {}),
  })
  if (
    receipt.commercialUseStatus !== 'internal_testing_only'
    || !receipt.approvedForInternalTesting
    || receipt.productionReady
    || receipt.providerCallMade
    || receipt.externalUrlFetched
  ) throw new Error('Reviewed local Qwen receipt exceeds Speech/Pacing internal-test authority.')
  return {
    receipt,
    runnerScriptPath,
    runnerDigestSha256: sha256(await readFile(runnerScriptPath)),
  }
}

async function validateRuntimePath(value: string, label: string): Promise<void> {
  if (!path.isAbsolute(value) || /https?:\/\//i.test(value)) {
    throw new Error(`${label} must be one absolute local path.`)
  }
  if (!path.resolve(value).startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
  const configured = path.resolve(value)
  const resolved = await realpath(value)
  const pathStat = await lstat(value)
  if (resolved !== configured || pathStat.isSymbolicLink() || !pathStat.isFile()) {
    throw new Error(`${label} must be one exact non-symlinked file.`)
  }
}

async function executeClassifier(input: {
  readonly pythonCommand: string
  readonly runnerScriptPath: string
  readonly modelPath: string
  readonly serializedInput: string
  readonly timeoutMs: number
  readonly onSpawn: () => void
}): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const child = spawn(input.pythonCommand, [input.runnerScriptPath, input.modelPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: offlineEnvironment(),
    })
    let stdout = ''
    let stderrBytes = 0
    let settled = false
    const finish = (callback: () => void): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      callback()
    }
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      finish(() => reject(new Error('Reviewed local Speech/Pacing runtime timed out.')))
    }, input.timeoutMs)
    child.once('spawn', input.onSpawn)
    child.once('error', () => finish(() => reject(new Error('Reviewed local Speech/Pacing runtime could not start.'))))
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
      if (Buffer.byteLength(stdout, 'utf8') > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        finish(() => reject(new Error('Reviewed local Speech/Pacing output exceeded its bound.')))
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length
      if (stderrBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        finish(() => reject(new Error('Reviewed local Speech/Pacing diagnostics exceeded their bound.')))
      }
    })
    child.once('close', (code) => finish(() => {
      if (code !== 0) {
        reject(new Error('Reviewed local Speech/Pacing runtime failed closed.'))
        return
      }
      try {
        const jsonLine = stdout.trim().split(/\r?\n/).reverse()
          .find((line) => line.trim().startsWith('{'))
        if (!jsonLine) throw new Error('Reduced Speech/Pacing JSON was omitted.')
        resolve(JSON.parse(jsonLine) as unknown)
      } catch {
        reject(new Error('Reviewed local Speech/Pacing output was invalid.'))
      }
    }))
    child.stdin.on('error', () => undefined)
    child.stdin.end(input.serializedInput, 'utf8')
  })
}

function transcriptStructureSummary(value: Classifications['transcriptStructure']): string {
  return ({
    linear_exposition: 'The source uses a generally linear explanatory progression.',
    setup_development_payoff: 'The source establishes context, develops it, and closes with a payoff-like resolution.',
    question_answer: 'The source frequently organizes explanation around question-and-answer progression.',
    list_or_steps: 'The source organizes its spoken structure around an ordered set of points or steps.',
    story_arc: 'The source uses a narrative progression with setup, development, and resolution.',
    mixed: 'The source combines several spoken-structure patterns, so target adaptation needs section-level review.',
    uncertain: 'The bounded transcript does not prove one stable spoken-structure pattern.',
  })[value]
}

function openingFunctionSummary(value: Classifications['openingFunction']): string {
  return ({
    direct_context: 'The opening quickly establishes the subject and working context.',
    question_led: 'The opening uses a question-like function to create attention and frame the subject.',
    problem_led: 'The opening frames a problem before developing the explanation.',
    promise_led: 'The opening signals a likely benefit or takeaway before the main development.',
    narrative_entry: 'The opening enters through a story-like moment before broader explanation.',
    gradual_context: 'The opening builds context gradually instead of front-loading the central point.',
    uncertain: 'The bounded opening does not prove one stable attention or framing function.',
  })[value]
}

function sentenceRhythmSummary(value: Classifications['sentenceRhythm']): string {
  return ({
    compact: 'The spoken phrasing generally favors compact units with frequent idea boundaries.',
    balanced: 'The spoken phrasing generally balances concise statements with enough development for clarity.',
    extended: 'The spoken phrasing generally develops ideas through longer connected units.',
    varied: 'The spoken phrasing intentionally varies between compact and extended units.',
    uncertain: 'The bounded transcript does not prove one stable sentence-rhythm pattern.',
  })[value]
}

function speechDensitySummary(value: Classifications['speechDensity']): string {
  return ({
    sparse: 'The source leaves substantial room around spoken ideas and avoids continuous verbal density.',
    moderate: 'The source maintains a moderate spoken-information density with regular comprehension room.',
    dense: 'The source carries a high concentration of spoken information and requires careful readability support.',
    varied: 'The source varies spoken-information density across sections for emphasis and recovery.',
    uncertain: 'The bounded transcript does not prove one stable speech-density pattern.',
  })[value]
}

function pausePatternSummary(value: Classifications['pausePattern']): string {
  return ({
    minimal: 'The source generally keeps pauses restrained and maintains forward spoken momentum.',
    breathing_room: 'The source uses regular breathing room between important spoken ideas.',
    sectional: 'The source uses stronger pause separation around larger spoken sections.',
    varied: 'The source varies pause character according to the surrounding spoken function.',
    uncertain: 'The bounded transcript and timing evidence do not prove one stable pause pattern.',
  })[value]
}

function captionTimingSummary(value: Classifications['captionTimingNeed']): string {
  return ({
    segment_sufficient: 'The observed phrasing appears readable with segment-level caption timing evidence.',
    word_precision_helpful: 'The observed phrasing would benefit from word-level caption timing review for readability.',
    word_precision_important: 'The observed speech density makes word-level caption timing review especially important.',
    uncertain: 'The bounded transcript does not prove a stable caption-timing precision need.',
  })[value]
}

function blocked(
  privateTranscriptArtifactRead: boolean,
  modelCallMade: boolean,
  blockers: readonly string[],
): QwenSpeechPacingProviderResult {
  return {
    status: 'blocked',
    observations: [],
    execution: {
      privateTranscriptArtifactRead,
      structuredTimingEvidenceRead: privateTranscriptArtifactRead,
      providerCallMade: false,
      modelCallMade,
      workerJobCreated: false,
      remoteMutationMade: false,
    },
    blockers,
  }
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function boundedTimeout(value: number | undefined): number {
  return Math.min(45 * 60 * 1_000, Math.max(30_000, value ?? 20 * 60 * 1_000))
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
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
