import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  assertOutputPathInsideRoot,
  sanitizePathForLog,
} from '../media/media-path-safety'
import { normalizeTranscriptSegments } from './transcript-segment-normalizer'
import type {
  FasterWhisperCommandPlan,
  FasterWhisperInput,
  FasterWhisperTranscriptionResult,
  SpeechFoundationSkipReason,
  TranscriptSegment,
  TranscriptWord,
} from './speech-worker-types'

const execFileAsync = promisify(execFile)

export function validateFasterWhisperInput(input: FasterWhisperInput): void {
  if (input.allowModelDownload) {
    throw new Error('Milestone 7 forbids faster-whisper model downloads.')
  }

  if (input.runMode === 'production_blocked' && !input.modelWeightManifestId) {
    throw new Error('Production transcription requires an approved modelWeightManifestId.')
  }

  if (input.localAudioPath) {
    assertNoSignedUrlOrRawUrl(input.localAudioPath, 'localAudioPath')
    assertNoPathTraversal(input.localAudioPath, 'localAudioPath')
  }
  if (input.localModelPath) {
    assertNoSignedUrlOrRawUrl(input.localModelPath, 'localModelPath')
    assertNoPathTraversal(input.localModelPath, 'localModelPath')
  }
  if (input.outputJsonPath) {
    assertNoSignedUrlOrRawUrl(input.outputJsonPath, 'outputJsonPath')
    assertNoPathTraversal(input.outputJsonPath, 'outputJsonPath')
  }

  if (input.runMode === 'local_dev' && !input.localAudioPath) {
    throw new Error('local_dev faster-whisper requires localAudioPath.')
  }
}

export function buildFasterWhisperCommand(input: FasterWhisperInput): FasterWhisperCommandPlan {
  validateFasterWhisperInput(input)
  const command = input.fasterWhisperCommand ?? input.pythonCommand ?? 'python'
  const args = input.fasterWhisperCommand
    ? buildCliArgs(input)
    : ['-m', 'faster_whisper', ...buildCliArgs(input)]

  return {
    command,
    args,
    outputJsonPath: input.outputJsonPath,
    summary: `faster-whisper ${input.device} ${input.wordTimestamps ? 'word timestamps' : 'segments'} for ${input.localAudioPath ? sanitizePathForLog(input.localAudioPath) : 'audio'}`,
  }
}

export async function runFasterWhisperTranscription(input: FasterWhisperInput): Promise<FasterWhisperTranscriptionResult> {
  validateFasterWhisperInput(input)

  const skipReason = buildFasterWhisperSkipReason(input)
  if (skipReason) {
    return {
      status: 'skipped',
      segments: [],
      confidence: 0,
      modelInfo: {
        toolId: 'faster_whisper',
        modelName: input.modelName,
        modelWeightManifestId: input.modelWeightManifestId,
        localModelReference: input.localModelPath,
      },
      skipReason,
    }
  }

  const plan = buildFasterWhisperCommand(input)
  await execFileAsync(plan.command, plan.args, {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  })

  if (!input.outputJsonPath) {
    throw new Error('faster-whisper local_dev run requires outputJsonPath.')
  }

  const output = await readFile(input.outputJsonPath, 'utf8')
  const parsed = parseFasterWhisperJsonOutput(output)
  const segments = normalizeFasterWhisperSegments(parsed)

  return {
    status: 'completed',
    segments,
    language: typeof parsed.language === 'string' ? parsed.language : input.language,
    confidence: averageSegmentConfidence(segments),
    modelInfo: {
      toolId: 'faster_whisper',
      modelName: input.modelName,
      modelWeightManifestId: input.modelWeightManifestId,
      localModelReference: input.localModelPath,
    },
  }
}

export function parseFasterWhisperJsonOutput(input: string): Record<string, unknown> {
  return JSON.parse(input) as Record<string, unknown>
}

export function normalizeFasterWhisperSegments(input: Record<string, unknown>): TranscriptSegment[] {
  const rawSegments = Array.isArray(input.segments) ? input.segments : []
  const segments = rawSegments.map((item, index) => {
    const record = item as Record<string, unknown>
    const segmentId = typeof record.id === 'string' ? record.id : `fw-segment-${index + 1}`
    const startSeconds = numberValue(record.start) ?? numberValue(record.startSeconds) ?? 0
    const endSeconds = numberValue(record.end) ?? numberValue(record.endSeconds) ?? startSeconds
    const text = typeof record.text === 'string' ? record.text : ''
    const words = Array.isArray(record.words)
      ? record.words.map((word): TranscriptWord => {
        const wordRecord = word as Record<string, unknown>
        return {
          word: typeof wordRecord.word === 'string' ? wordRecord.word : '',
          startSeconds: numberValue(wordRecord.start) ?? numberValue(wordRecord.startSeconds) ?? startSeconds,
          endSeconds: numberValue(wordRecord.end) ?? numberValue(wordRecord.endSeconds) ?? endSeconds,
          confidence: numberValue(wordRecord.probability) ?? numberValue(wordRecord.confidence),
          segmentId,
        }
      })
      : wordsFromText(text, startSeconds, endSeconds, segmentId)

    return {
      segmentId,
      startSeconds,
      endSeconds,
      text,
      words: words.length > 0 ? words : wordsFromText(text, startSeconds, endSeconds, segmentId),
      confidence: numberValue(record.avg_logprob) ?? numberValue(record.confidence),
    }
  })

  return normalizeTranscriptSegments(segments)
}

export function buildFasterWhisperSkipReason(input: FasterWhisperInput): SpeechFoundationSkipReason | undefined {
  if (input.runMode === 'production_blocked') {
    return {
      code: 'production_transcription_blocked',
      message: 'Production faster-whisper execution is blocked until deployment and model-weight approval milestones.',
      tool: 'faster_whisper',
    }
  }

  if (input.runMode !== 'local_dev') return undefined

  if (!input.localAudioPath || !existsSync(input.localAudioPath)) {
    return {
      code: 'local_audio_missing',
      message: 'local_dev faster-whisper skipped because local audio path is missing.',
      tool: 'faster_whisper',
    }
  }

  if (!input.localModelPath || !existsSync(input.localModelPath)) {
    return {
      code: 'local_model_missing',
      message: 'local_dev faster-whisper skipped because no existing local model path/reference was provided. No download was attempted.',
      tool: 'faster_whisper',
    }
  }

  if (input.outputJsonPath) {
    const outputRoot = input.outputJsonPath.split(/[\\/]/).slice(0, -1).join('/') || '.'
    assertOutputPathInsideRoot(input.outputJsonPath, outputRoot)
  }

  return undefined
}

function buildCliArgs(input: FasterWhisperInput): string[] {
  const args = [
    input.localAudioPath ?? '',
    '--model',
    input.localModelPath ?? input.modelName ?? 'local-model-required',
    '--device',
    input.device,
    '--output_format',
    'json',
  ]

  if (input.outputJsonPath) args.push('--output', input.outputJsonPath)
  if (input.language) args.push('--language', input.language)
  if (input.computeType) args.push('--compute_type', input.computeType)
  if (input.wordTimestamps) args.push('--word_timestamps', 'true')
  if (input.vadFilter) args.push('--vad_filter', 'true')
  if (input.beamSize) args.push('--beam_size', String(input.beamSize))
  return args.filter(Boolean)
}

function wordsFromText(text: string, startSeconds: number, endSeconds: number, segmentId: string): TranscriptWord[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []
  const duration = Math.max(0.01, endSeconds - startSeconds)
  return tokens.map((word, index) => ({
    word,
    startSeconds: Number((startSeconds + (duration / tokens.length) * index).toFixed(3)),
    endSeconds: Number((startSeconds + (duration / tokens.length) * (index + 1)).toFixed(3)),
    segmentId,
  }))
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function averageSegmentConfidence(segments: TranscriptSegment[]): number {
  const values = segments
    .map((segment) => segment.confidence)
    .filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return segments.length > 0 ? 0.75 : 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
}
