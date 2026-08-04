import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  EDIT_REFERENCE_AUDIO_SOUND_DESIGN_MODEL_ROUTING_POLICY_VERSION,
  assertEditReferenceAudioSoundDesignProviderInput,
  assertEditReferenceAudioSoundDesignProviderResult,
  type EditReferenceAudioSoundDesignProvider,
  type EditReferenceAudioSoundDesignProviderInput,
  type EditReferenceAudioSoundDesignProviderObservation,
  type EditReferenceAudioSoundDesignProviderResult,
} from '../services/edit-reference-audio-sound-design-provider'
import type {
  EditReferenceReviewedLocalAstAudioSetRuntimeReceipt,
} from './edit-reference-reviewed-local-ast-audioset-runtime'

const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(new URL('./runtime/ast-audioset-classify-audio.py', import.meta.url))
const OUTPUT_SCHEMA_VERSION = 'reeditpro-reviewed-local-ast-audioset-audio-v1' as const
const ADAPTER_ID = 'reeditpro_reviewed_local_ast_audioset_audio' as const
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MAX_PROCESS_OUTPUT_BYTES = 256 * 1024

const audioSetLabelSchema = z.object({
  label: z.string().trim().min(1).max(160).refine((value) => (
    !/https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\//i.test(value)
  )),
  score: z.number().finite().min(0).max(1),
}).strict()

const runnerWindowSchema = z.object({
  startSeconds: z.number().finite().nonnegative().max(120),
  endSeconds: z.number().finite().positive().max(120),
  topLabels: z.array(audioSetLabelSchema).min(1).max(5),
}).strict().refine((value) => value.endSeconds > value.startSeconds)

const runnerOutputSchema = z.object({
  schemaVersion: z.literal(OUTPUT_SCHEMA_VERSION),
  windowsAnalyzed: z.number().int().min(1).max(3),
  windows: z.array(runnerWindowSchema).min(1).max(3),
  deviceUsed: z.enum(['mps', 'cpu']),
  semanticAudioModelExecuted: z.literal(true),
  rawAudioPersisted: z.literal(false),
  rawWaveformOrSpectrogramPersisted: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
  exactAudioFingerprintRetained: z.literal(false),
  externalUrlFetched: z.literal(false),
  networkAttempted: z.literal(false),
  providerCallMade: z.literal(false),
}).strict().refine((value) => value.windowsAnalyzed === value.windows.length)

type RunnerOutput = z.infer<typeof runnerOutputSchema>
type SoundCharacter = 'music' | 'pulse' | 'sound_events' | 'ambient_field'

export interface CreateEditReferenceReviewedLocalAstAudioSetProviderInput {
  readonly runtime: EditReferenceReviewedLocalAstAudioSetRuntimeReceipt
  readonly pythonCommand: string
  readonly modelPath: string
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
}

/**
 * Runs a reviewed AudioSet classifier over one bounded private WAV. Raw labels
 * stay process-local; only generalized, target-adapted observations cross the
 * provider-neutral Audio/Sound Design boundary.
 */
export function createEditReferenceReviewedLocalAstAudioSetProvider(
  input: CreateEditReferenceReviewedLocalAstAudioSetProviderInput,
): EditReferenceAudioSoundDesignProvider {
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  const timeoutMs = Math.min(30 * 60 * 1_000, Math.max(30_000, input.timeoutMs ?? 10 * 60 * 1_000))
  return {
    executionMode: 'controlled_local',
    async analyze(
      request: EditReferenceAudioSoundDesignProviderInput,
    ): Promise<EditReferenceAudioSoundDesignProviderResult> {
      assertEditReferenceAudioSoundDesignProviderInput(request)
      let modelCallMade = false
      try {
        await validateRuntimePath(input.pythonCommand, 'Reviewed local AST Python command', false, true)
        await validateRuntimePath(input.modelPath, 'Reviewed local AST model', true)
        await validateRuntimePath(runnerScriptPath, 'Reviewed local AST runner')
        const output = await executeClassification({
          pythonCommand: input.pythonCommand,
          runnerScriptPath,
          modelPath: input.modelPath,
          audioBytes: request.boundedAudio.bytes,
          timeoutMs,
        })
        modelCallMade = output.semanticAudioModelExecuted
        assertOutputCoverage(request, output)
        const result: EditReferenceAudioSoundDesignProviderResult = {
          status: 'completed',
          observations: buildObservations(request, output),
          execution: {
            boundedPrivateAudioRead: true,
            structuredEvidenceRead: true,
            providerCallMade: false,
            modelCallMade: true,
            workerJobCreated: false,
            remoteMutationMade: false,
          },
          runtimeProvenance: {
            runtimeSource: 'verified_local',
            adapterId: ADAPTER_ID,
            adapterVersion: input.runtime.adapterVersion,
            providerId: null,
            modelId: input.runtime.modelId,
            modelRevision: input.runtime.modelRevision,
            modelAggregateSha256: input.runtime.modelAggregateSha256,
            modelRoutingPolicyVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_MODEL_ROUTING_POLICY_VERSION,
            analysisInstructionDigestSha256: sha256(`${OUTPUT_SCHEMA_VERSION}:${await hashFile(runnerScriptPath)}`),
          },
          blockers: [],
        }
        assertEditReferenceAudioSoundDesignProviderResult(request, result)
        return result
      } catch {
        const result: EditReferenceAudioSoundDesignProviderResult = {
          status: 'blocked',
          observations: [],
          execution: {
            boundedPrivateAudioRead: modelCallMade,
            structuredEvidenceRead: true,
            providerCallMade: false,
            modelCallMade,
            workerJobCreated: false,
            remoteMutationMade: false,
          },
          blockers: ['semantic_audio_runtime_invalid'],
        }
        assertEditReferenceAudioSoundDesignProviderResult(request, result)
        return result
      }
    },
  }
}

function assertOutputCoverage(
  input: EditReferenceAudioSoundDesignProviderInput,
  output: RunnerOutput,
): void {
  let previousStart = -1
  for (const window of output.windows) {
    if (
      window.startSeconds < previousStart
      || window.endSeconds > input.structuredContext.analysisWindowEndSeconds + 0.001
    ) throw new Error('Reviewed local AST output is outside the exact bounded sample.')
    previousStart = window.startSeconds
  }
}

function buildObservations(
  input: EditReferenceAudioSoundDesignProviderInput,
  output: RunnerOutput,
): EditReferenceAudioSoundDesignProviderObservation[] {
  const byCharacter = new Map<SoundCharacter, RunnerOutput['windows']>()
  for (const window of output.windows) {
    const characters = classifyWindow(window)
    for (const character of characters) {
      byCharacter.set(character, [...(byCharacter.get(character) ?? []), window])
    }
  }
  if (byCharacter.size === 0) byCharacter.set('ambient_field', output.windows)

  const privateAudioEvidenceIds = evidenceIds(input, 'private_audio')
  const studyGoalEvidenceIds = evidenceIds(input, 'study_goal')
  const mediaEvidenceIds = evidenceIds(input, 'media_structure')
  const coreEvidenceIds = unique([
    ...privateAudioEvidenceIds,
    ...studyGoalEvidenceIds,
    ...mediaEvidenceIds,
  ])

  return [...byCharacter.entries()].slice(0, 4).map(([character, windows]) => {
    const definition = observationDefinition(character)
    const evidenceForObservation = coreEvidenceIds
    return {
      category: definition.category,
      summary: definition.summary,
      evidenceIds: evidenceForObservation,
      sourceRanges: windows.slice(0, 8).map((window) => ({
        startSeconds: input.boundedAudio.startSeconds + window.startSeconds,
        endSeconds: Math.min(
          input.boundedAudio.endSeconds,
          input.boundedAudio.startSeconds + window.endSeconds,
        ),
        evidenceIds: evidenceForObservation,
      })),
      confidence: confidenceForWindows(windows),
      transferability: 'context_only',
      requiresUserReview: true,
      nonTransferableAssetWarning: false,
    }
  })
}

function classifyWindow(window: RunnerOutput['windows'][number]): SoundCharacter[] {
  const selected = window.topLabels.filter((label, index) => index === 0 || label.score >= 0.08)
  const labels = selected.map((value) => value.label.toLowerCase())
  const characters = new Set<SoundCharacter>()
  if (labels.some(isMusicLabel)) characters.add('music')
  if (labels.some(isPulseLabel)) characters.add('pulse')
  if (labels.some(isSoundEventLabel)) characters.add('sound_events')
  if (labels.some(isAmbientLabel) || labels.some(isSpeechOrSilenceLabel)) characters.add('ambient_field')
  if (characters.size === 0) characters.add('ambient_field')
  return [...characters]
}

function observationDefinition(character: SoundCharacter): {
  readonly category: EditReferenceAudioSoundDesignProviderObservation['category']
  readonly summary: string
} {
  switch (character) {
    case 'music': return {
      category: 'music_energy',
      summary: 'The bounded sample uses a clearly present music layer whose intensity contributes to overall momentum; target music must be selected and mixed independently.',
    }
    case 'pulse': return {
      category: 'tempo_character',
      summary: 'The sampled sound has a recurring pulse-like character, while exact tempo, beat positions, and target synchronization remain intentionally unclaimed.',
    }
    case 'sound_events': return {
      category: 'sfx_density',
      summary: 'Discrete sound-event layers recur in the bounded sample; their density is contextual and any target effects require fresh visual-cue justification.',
    }
    case 'ambient_field': return {
      category: 'ambience',
      summary: 'The bounded sample establishes a recognizable foreground-to-background sound field, but its target ambience and speech relationship require fresh target evidence.',
    }
  }
}

function confidenceForWindows(windows: RunnerOutput['windows']): number {
  const average = windows.reduce((sum, window) => sum + window.topLabels[0].score, 0) / windows.length
  return Number(Math.min(0.95, Math.max(0.05, average)).toFixed(6))
}

function evidenceIds(
  input: EditReferenceAudioSoundDesignProviderInput,
  kind: EditReferenceAudioSoundDesignProviderInput['structuredContext']['evidenceItems'][number]['kind'],
): string[] {
  return input.structuredContext.evidenceItems
    .filter((item) => item.kind === kind)
    .map((item) => item.evidenceId)
}

function isMusicLabel(value: string): boolean {
  return /music|musical|song|singing|choir|instrument|guitar|piano|drum|percussion|orchestra|violin|saxophone|trumpet|synthesizer|electronic|rock|pop|hip hop|jazz|classical/.test(value)
}

function isPulseLabel(value: string): boolean {
  return /rhythm|beat|drum|percussion|clapping|tapping|clicking|tick|pulse/.test(value)
}

function isSoundEventLabel(value: string): boolean {
  return /explosion|gunshot|impact|slam|click|beep|alarm|door|whoosh|crash|breaking|typing|keyboard|telephone|bell|knock|tap|footstep|mechanical|engine|sound effect/.test(value)
}

function isAmbientLabel(value: string): boolean {
  return /wind|rain|water|ocean|stream|traffic|vehicle|crowd|room|environment|noise|hum|buzz|bird|animal|insect|fire|thunder|static|sine wave|inside|outside/.test(value)
}

function isSpeechOrSilenceLabel(value: string): boolean {
  return /speech|conversation|narration|monologue|whisper|talking|silence|quiet|no sound/.test(value)
}

async function executeClassification(input: {
  readonly pythonCommand: string
  readonly runnerScriptPath: string
  readonly modelPath: string
  readonly audioBytes: Uint8Array
  readonly timeoutMs: number
}): Promise<RunnerOutput> {
  return await new Promise<RunnerOutput>((resolve, reject) => {
    const child = spawn(input.pythonCommand, [input.runnerScriptPath, input.modelPath], {
      env: offlineEnvironment(),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let stdout = Buffer.alloc(0)
    let stderrBytes = 0
    let settled = false
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      finish(new Error('Reviewed local AST classification timed out.'))
    }, input.timeoutMs)
    const finish = (error?: Error, value?: RunnerOutput) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(value as RunnerOutput)
    }
    child.stdout.on('data', (chunk: Buffer) => {
      stdout = Buffer.concat([stdout, chunk])
      if (stdout.byteLength > MAX_PROCESS_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        finish(new Error('Reviewed local AST output exceeded its bound.'))
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > MAX_PROCESS_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        finish(new Error('Reviewed local AST diagnostic output exceeded its bound.'))
      }
    })
    child.on('error', (error) => finish(error))
    child.on('close', (code) => {
      if (code !== 0) return finish(new Error('Reviewed local AST classification failed closed.'))
      try {
        finish(undefined, runnerOutputSchema.parse(JSON.parse(stdout.toString('utf8').trim()) as unknown))
      } catch {
        finish(new Error('Reviewed local AST classification returned an invalid result.'))
      }
    })
    child.stdin.on('error', (error) => finish(error))
    child.stdin.end(Buffer.from(input.audioBytes))
  })
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
  const info = await lstat(value)
  const targetInfo = await stat(resolved)
  if (
    (!allowExecutableAlias && info.isSymbolicLink())
    || (directory ? !info.isDirectory() : !targetInfo.isFile())
  ) throw new Error(`${label} is invalid.`)
}

async function hashFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function offlineEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_HUB_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    TRANSFORMERS_OFFLINE: '1',
    TOKENIZERS_PARALLELISM: 'false',
  }
}
