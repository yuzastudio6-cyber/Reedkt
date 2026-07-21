import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  resolveEditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
  type EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding,
  type EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
} from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'
import {
  QWEN_STORY_EDITORIAL_MODEL_ROUTING_POLICY_VERSION,
  qwenStoryEditorialStructuredContextSchema,
  type QwenStoryEditorialObservation,
  type QwenStoryEditorialProviderResult,
  type QwenStoryEditorialReasoningProvider,
  type QwenStoryEditorialStructuredContext,
} from '../services/qwen-story-editorial-provider'

export const EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_STORY_EDITORIAL_PROVIDER_ID =
  'qwen25vl_mlx_story_editorial_reasoning_provider' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_STORY_EDITORIAL_PROVIDER_VERSION =
  'v1' as const

const OUTPUT_SCHEMA_VERSION =
  'reeditpro-reviewed-local-qwen25vl-mlx-story-editorial-v1' as const
const INPUT_SCHEMA_VERSION =
  'reeditpro-reviewed-local-story-editorial-input-v1' as const
const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(
  new URL('./runtime/qwen25vl-mlx-classify-story-editorial.py', import.meta.url),
)
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MAX_INPUT_BYTES = 32_000
const MAX_OUTPUT_BYTES = 128 * 1024

const classificationsSchema = z.object({
  hookFunction: z.enum([
    'direct_context', 'problem_led', 'question_led', 'promise_led',
    'visual_entry', 'gradual_context', 'uncertain',
  ]),
  narrativeShape: z.enum([
    'setup_development_payoff', 'problem_solution_proof',
    'educational_progression', 'demonstration_progression',
    'montage_progression', 'mixed', 'uncertain',
  ]),
  informationDensity: z.enum(['low', 'moderate', 'high', 'varied', 'uncertain']),
  brollMeaningSupport: z.enum([
    'primary_subject_dominant', 'support_visual_dominant',
    'alternating_support', 'contextual_only', 'uncertain',
  ]),
  pacingCharacter: z.enum(['measured', 'brisk', 'accelerating', 'varied', 'uncertain']),
  confidence: z.number().min(0.01).max(1),
}).strict()

const outputSchema = z.object({
  schemaVersion: z.literal(OUTPUT_SCHEMA_VERSION),
  evidenceItemsAnalyzed: z.number().int().min(4).max(64),
  classifications: classificationsSchema,
  semanticSpecialistModelExecuted: z.literal(true),
  rawEvidencePersisted: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
  exactReferenceWordingRetained: z.literal(false),
  exactReferenceSequenceInstructionCreated: z.literal(false),
  exactReferenceTimingInstructionCreated: z.literal(false),
  executableTargetOperationCreated: z.literal(false),
  identityAnalysisPerformed: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

type Classifications = z.infer<typeof classificationsSchema>

export interface CreateEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProviderInput {
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
 * Explicit-injection, internal-testing-only Story/Editorial reasoning over
 * bounded structured evidence. It never reads media or transcript artifacts,
 * calls the network, or acquires production/cost/customer authority.
 */
export function createEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProvider(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProviderInput,
): QwenStoryEditorialReasoningProvider {
  const timeoutMs = boundedTimeout(input.timeoutMs)
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  let runtimePromise: Promise<ReviewedRuntimeAuthority> | undefined
  const runtime = (): Promise<ReviewedRuntimeAuthority> => {
    runtimePromise ??= validateReviewedRuntime(input, runnerScriptPath)
    return runtimePromise
  }

  return {
    executionMode: 'controlled_local',
    async analyze(value): Promise<QwenStoryEditorialProviderResult> {
      const parsed = qwenStoryEditorialStructuredContextSchema.safeParse(value)
      if (!parsed.success) return blocked(false, false, ['story_editorial_reviewed_local_context_invalid'])
      const context = parsed.data
      if (!contextAuthorityIsConsistent(context)) {
        return blocked(true, false, ['story_editorial_reviewed_local_context_authority_invalid'])
      }
      let modelCallMade = false
      try {
        const authority = await runtime()
        const serializedInput = JSON.stringify(createModelInput(context))
        if (Buffer.byteLength(serializedInput, 'utf8') > MAX_INPUT_BYTES) {
          return blocked(true, false, ['story_editorial_reviewed_local_context_outside_bound'])
        }
        const output = outputSchema.parse(await executeClassifier({
          pythonCommand: input.pythonCommand,
          runnerScriptPath: authority.runnerScriptPath,
          modelPath: input.modelPath,
          serializedInput,
          timeoutMs,
          onSpawn: () => { modelCallMade = true },
        }))
        if (output.evidenceItemsAnalyzed !== context.evidenceItems.length) {
          return blocked(true, true, ['story_editorial_reviewed_local_coverage_mismatch'])
        }
        return {
          status: 'completed',
          observations: buildObservations(context, output.classifications),
          coverage: {
            partial: missingEvidenceKinds(context).length > 0,
            missingEvidenceKinds: missingEvidenceKinds(context),
          },
          execution: {
            structuredEvidenceRead: true,
            providerCallMade: false,
            modelCallMade: true,
            workerJobCreated: false,
            remoteMutationMade: false,
          },
          runtimeProvenance: {
            runtimeSource: 'verified_local',
            adapterId: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_STORY_EDITORIAL_PROVIDER_ID,
            adapterVersion: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_STORY_EDITORIAL_PROVIDER_VERSION,
            providerId: null,
            modelId: authority.receipt.modelId,
            modelRevision: authority.receipt.modelRevision,
            modelAggregateSha256: authority.receipt.modelAggregateSha256,
            modelRoutingPolicyVersion: QWEN_STORY_EDITORIAL_MODEL_ROUTING_POLICY_VERSION,
            reasoningInstructionDigestSha256: sha256([
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
            ? 'story_editorial_reviewed_local_runtime_failed'
            : 'story_editorial_reviewed_local_runtime_unavailable',
        ])
      }
    },
  }
}

function createModelInput(context: QwenStoryEditorialStructuredContext) {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    audioPresence: context.audioPresence,
    sourceClaimsPresent: context.sourceClaimsPresent,
    evidenceItems: context.evidenceItems.map((item, index) => ({
      index,
      evidenceId: item.evidenceId,
      kind: item.kind,
      untrustedSummary: item.summary,
      confidence: item.confidence,
      requiresUserReview: item.requiresUserReview,
    })),
  }
}

function buildObservations(
  context: QwenStoryEditorialStructuredContext,
  value: Classifications,
): QwenStoryEditorialObservation[] {
  const media = evidenceIds(context, 'media_structure')
  const visual = evidenceIds(context, 'visual_language')
  const transcript = evidenceIds(context, 'transcript_semantic_summary')
  const speech = evidenceIds(context, 'speech_timing_summary')
  const goals = evidenceIds(context, 'study_goal')
  const semantic = unique([...visual, ...transcript, ...goals])
  const broad = unique([...media, ...semantic])
  const pacing = unique([...semantic, ...speech])
  const review = (classification: string): boolean => (
    classification === 'mixed' || classification === 'varied' || classification === 'uncertain'
  )
  return [
    observation('hook_function', hookSummary(value.hookFunction), semantic, value.confidence, review(value.hookFunction)),
    observation('narrative_arc', narrativeSummary(value.narrativeShape), broad, value.confidence, review(value.narrativeShape)),
    observation('information_density', densitySummary(value.informationDensity), broad, value.confidence, review(value.informationDensity)),
    observation('broll_meaning_support', brollSummary(value.brollMeaningSupport), semantic, value.confidence, review(value.brollMeaningSupport)),
    observation('pacing_section', pacingSummary(value.pacingCharacter), pacing, value.confidence, review(value.pacingCharacter)),
  ]
}

function observation(
  category: QwenStoryEditorialObservation['category'],
  summary: string,
  evidenceIdsValue: readonly string[],
  confidence: number,
  requiresUserReview: boolean,
): QwenStoryEditorialObservation {
  return {
    category,
    summary,
    evidenceIds: [...evidenceIdsValue],
    confidence,
    transferability: 'transferable_principle',
    requiresUserReview,
    claimRelated: false,
    factSafetyStatus: 'not_applicable',
  }
}

function contextAuthorityIsConsistent(context: QwenStoryEditorialStructuredContext): boolean {
  const ids = context.evidenceItems.map((item) => item.evidenceId)
  if (
    JSON.stringify(context).length > MAX_INPUT_BYTES
    || new Set(ids).size !== ids.length
    || evidenceIds(context, 'media_structure').length < 1
    || evidenceIds(context, 'visual_language').length < 1
    || evidenceIds(context, 'study_goal').length < 1
  ) return false
  if (context.audioPresence === 'present' && (
    evidenceIds(context, 'transcript_semantic_summary').length < 1
    || evidenceIds(context, 'speech_timing_summary').length < 1
  )) return false
  if (context.sourceClaimsPresent && evidenceIds(context, 'fact_safety').length < 1) return false
  return context.evidenceManifestDigestSha256 === sha256(JSON.stringify({
    schemaVersion: context.schemaVersion,
    audioPresence: context.audioPresence,
    sourceClaimsPresent: context.sourceClaimsPresent,
    evidenceItems: context.evidenceItems,
    boundaries: context.boundaries,
  }))
}

function evidenceIds(
  context: QwenStoryEditorialStructuredContext,
  kind: QwenStoryEditorialStructuredContext['evidenceItems'][number]['kind'],
): string[] {
  return context.evidenceItems.filter((item) => item.kind === kind).map((item) => item.evidenceId)
}

function missingEvidenceKinds(context: QwenStoryEditorialStructuredContext): string[] {
  return [
    ...(context.audioPresence === 'present' && evidenceIds(context, 'transcript_semantic_summary').length < 1
      ? ['transcript_semantic_summary'] : []),
    ...(context.audioPresence === 'present' && evidenceIds(context, 'speech_timing_summary').length < 1
      ? ['speech_timing_summary'] : []),
    ...(context.sourceClaimsPresent && evidenceIds(context, 'fact_safety').length < 1
      ? ['fact_safety'] : []),
  ]
}

async function validateReviewedRuntime(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProviderInput,
  runnerScriptPath: string,
): Promise<ReviewedRuntimeAuthority> {
  await validateRuntimePath(runnerScriptPath, 'Reviewed local Story/Editorial runner')
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
  ) throw new Error('Reviewed local Qwen receipt exceeds Story/Editorial internal-test authority.')
  return {
    receipt,
    runnerScriptPath,
    runnerDigestSha256: sha256(await readFile(runnerScriptPath)),
  }
}

async function validateRuntimePath(value: string, label: string): Promise<void> {
  if (!path.isAbsolute(value) || /https?:\/\//i.test(value)) throw new Error(`${label} must be one absolute local path.`)
  if (!path.resolve(value).startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
  const configured = path.resolve(value)
  const resolved = await realpath(value)
  const valueStat = await lstat(value)
  if (resolved !== configured || valueStat.isSymbolicLink() || !valueStat.isFile()) {
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
      finish(() => reject(new Error('Reviewed local Story/Editorial runtime timed out.')))
    }, input.timeoutMs)
    child.once('spawn', input.onSpawn)
    child.once('error', () => finish(() => reject(new Error('Reviewed local Story/Editorial runtime could not start.'))))
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
      if (Buffer.byteLength(stdout, 'utf8') > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        finish(() => reject(new Error('Reviewed local Story/Editorial output exceeded its bound.')))
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length
      if (stderrBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        finish(() => reject(new Error('Reviewed local Story/Editorial diagnostics exceeded their bound.')))
      }
    })
    child.once('close', (code) => finish(() => {
      if (code !== 0) {
        reject(new Error('Reviewed local Story/Editorial runtime failed closed.'))
        return
      }
      try {
        const jsonLine = stdout.trim().split(/\r?\n/).reverse().find((line) => line.trim().startsWith('{'))
        if (!jsonLine) throw new Error('Reduced Story/Editorial JSON was omitted.')
        resolve(JSON.parse(jsonLine) as unknown)
      } catch {
        reject(new Error('Reviewed local Story/Editorial output was invalid.'))
      }
    }))
    child.stdin.on('error', () => undefined)
    child.stdin.end(input.serializedInput, 'utf8')
  })
}

function hookSummary(value: Classifications['hookFunction']): string {
  return ({
    direct_context: 'The opening establishes the subject and working context directly.',
    problem_led: 'The opening frames a problem before developing the broader explanation.',
    question_led: 'The opening uses a question-like function to create attention and frame the subject.',
    promise_led: 'The opening signals a likely benefit or takeaway before the main development.',
    visual_entry: 'The opening enters through a visual idea before expanding the surrounding context.',
    gradual_context: 'The opening builds context gradually instead of front-loading the central point.',
    uncertain: 'The bounded evidence does not prove one stable opening function.',
  })[value]
}

function narrativeSummary(value: Classifications['narrativeShape']): string {
  return ({
    setup_development_payoff: 'The source follows a generalized setup, development, and payoff-like progression.',
    problem_solution_proof: 'The source generally moves from a problem through a response toward supporting proof.',
    educational_progression: 'The source advances through a generalized explanatory learning progression.',
    demonstration_progression: 'The source generally establishes context, demonstrates an idea, and confirms an outcome.',
    montage_progression: 'The source builds meaning through a sequence of supporting visual groups rather than one continuous demonstration.',
    mixed: 'The source combines several narrative patterns, so target adaptation needs section-level review.',
    uncertain: 'The bounded evidence does not prove one stable narrative progression.',
  })[value]
}

function densitySummary(value: Classifications['informationDensity']): string {
  return ({
    low: 'The source generally favors low information density and sustained visual breathing room.',
    moderate: 'The source maintains moderate information density with regular comprehension room.',
    high: 'The source carries high information density and requires careful target readability support.',
    varied: 'The source varies information density across its generalized editorial progression.',
    uncertain: 'The bounded evidence does not prove one stable information-density pattern.',
  })[value]
}

function brollSummary(value: Classifications['brollMeaningSupport']): string {
  return ({
    primary_subject_dominant: 'Supporting visuals remain secondary to the primary subject or explanatory surface.',
    support_visual_dominant: 'Supporting visuals carry much of the explanatory meaning while the primary subject recedes.',
    alternating_support: 'The source alternates between primary material and supporting visuals to clarify meaning.',
    contextual_only: 'Supporting visuals mainly establish context rather than carrying essential explanation.',
    uncertain: 'The bounded evidence does not prove one stable supporting-visual role.',
  })[value]
}

function pacingSummary(value: Classifications['pacingCharacter']): string {
  return ({
    measured: 'The editorial progression generally leaves measured comprehension room between ideas.',
    brisk: 'The editorial progression generally favors brisk movement between ideas.',
    accelerating: 'The editorial progression generally increases momentum as the source develops.',
    varied: 'The editorial progression varies pace according to the surrounding story function.',
    uncertain: 'The bounded evidence does not prove one stable editorial pacing character.',
  })[value]
}

function blocked(
  structuredEvidenceRead: boolean,
  modelCallMade: boolean,
  blockers: readonly string[],
): QwenStoryEditorialProviderResult {
  return {
    status: 'blocked',
    observations: [],
    execution: {
      structuredEvidenceRead,
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
