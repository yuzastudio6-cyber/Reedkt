import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  assertOutputPathInsideRoot,
  sanitizePathForLog,
} from '../media/media-path-safety'
import type { SpeechExecutionInput } from '../speech-caption/speech-caption-pipeline-types'
import type { SpeechFoundationSkipReason } from './speech-worker-types'
import { normalizeFasterWhisperExecutionResult, type ParsedFasterWhisperResult } from './faster-whisper-result-parser'

const execFileAsync = promisify(execFile)

export interface FasterWhisperExecutionCommandPlan {
  command: string
  args: string[]
  outputJsonPath: string
  summary: string
}

export interface FasterWhisperExecutionRunResult {
  status: 'completed' | 'skipped' | 'failed'
  parsed?: ParsedFasterWhisperResult
  commandPlan?: FasterWhisperExecutionCommandPlan
  skipReason?: SpeechFoundationSkipReason
  errorMessage?: string
}

export function buildFasterWhisperExecutionCommand(input: SpeechExecutionInput): FasterWhisperExecutionCommandPlan {
  validateFasterWhisperCommandInput(input)
  const outputJsonPath = assertOutputPathInsideRoot(
    path.join(input.outputDirectory as string, 'faster-whisper-output.json'),
    input.outputDirectory as string,
  )
  const command = input.fasterWhisperCommand ?? input.pythonCommand ?? 'python'
  const args = input.fasterWhisperCommand
    ? buildAllowlistedArgs(input, outputJsonPath)
    : ['-m', 'faster_whisper', ...buildAllowlistedArgs(input, outputJsonPath)]

  return {
    command,
    args,
    outputJsonPath,
    summary: `faster-whisper execution for ${sanitizePathForLog(input.sourceAudioLocalPath as string)}`,
  }
}

export async function runFasterWhisperExecutionCommand(input: SpeechExecutionInput): Promise<FasterWhisperExecutionRunResult> {
  const skipReason = buildFasterWhisperExecutionSkipReason(input)
  if (skipReason) return { status: 'skipped', skipReason }

  const commandPlan = buildFasterWhisperExecutionCommand(input)
  await mkdir(path.dirname(commandPlan.outputJsonPath), { recursive: true })

  try {
    await execFileAsync(commandPlan.command, commandPlan.args, {
      timeout: input.timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    })
    const output = await readFile(commandPlan.outputJsonPath, 'utf8')
    return {
      status: 'completed',
      parsed: normalizeFasterWhisperExecutionResult(output),
      commandPlan,
    }
  } catch (error) {
    return {
      status: 'failed',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : 'faster-whisper execution failed.',
    }
  }
}

export function buildFasterWhisperExecutionSkipReason(input: SpeechExecutionInput): SpeechFoundationSkipReason | undefined {
  if (input.mode !== 'local_dev') {
    return {
      code: 'real_transcription_not_local_dev',
      message: `${input.mode} does not execute faster-whisper directly.`,
      tool: 'faster_whisper',
    }
  }

  if (!input.enableRealTranscription) {
    return {
      code: 'real_transcription_disabled',
      message: 'Real local-dev transcription is disabled.',
      tool: 'faster_whisper',
    }
  }

  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) {
    return {
      code: 'local_audio_missing',
      message: 'Local-dev transcription skipped because the source audio path is missing.',
      tool: 'faster_whisper',
    }
  }

  if (!input.localModelPath || !existsSync(input.localModelPath)) {
    return {
      code: 'local_model_missing',
      message: 'Local-dev transcription skipped because the model path is missing. No download was attempted.',
      tool: 'faster_whisper',
    }
  }

  if (!input.outputDirectory) {
    return {
      code: 'output_directory_missing',
      message: 'Local-dev transcription skipped because no safe output directory was provided.',
      tool: 'faster_whisper',
    }
  }

  return undefined
}

function validateFasterWhisperCommandInput(input: SpeechExecutionInput): void {
  if (input.allowModelDownload) throw new Error('Model download flags are blocked.')
  if (input.arbitraryArgs?.length) throw new Error('Arbitrary faster-whisper args are blocked.')
  if (!input.sourceAudioLocalPath) throw new Error('sourceAudioLocalPath is required for faster-whisper execution.')
  if (!input.localModelPath && !input.modelName) throw new Error('localModelPath or modelName is required.')
  if (!input.outputDirectory) throw new Error('outputDirectory is required.')

  for (const [label, value] of [
    ['sourceAudioLocalPath', input.sourceAudioLocalPath],
    ['localModelPath', input.localModelPath],
    ['outputDirectory', input.outputDirectory],
  ] as const) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}

function buildAllowlistedArgs(input: SpeechExecutionInput, outputJsonPath: string): string[] {
  const args = [
    input.sourceAudioLocalPath as string,
    '--model',
    input.localModelPath ?? input.modelName ?? 'local-model-required',
    '--device',
    input.device,
    '--output_format',
    'json',
    '--output',
    outputJsonPath,
  ]

  if (input.language) args.push('--language', input.language)
  if (input.computeType) args.push('--compute_type', input.computeType)
  if (input.wordTimestamps) args.push('--word_timestamps', 'true')
  if (input.vadFilter) args.push('--vad_filter', 'true')
  if (input.beamSize) args.push('--beam_size', String(input.beamSize))

  if (args.some((arg) => /download|from_pretrained|snapshot/i.test(arg))) {
    throw new Error('faster-whisper command contains blocked model download syntax.')
  }

  return args
}
