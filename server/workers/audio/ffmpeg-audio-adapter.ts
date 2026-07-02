import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import { resolveAudioOutputPath, sanitizeAudioPathForLog } from './audio-storage-policy'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

const execFileAsync = promisify(execFile)

export type FFmpegAudioOperation = 'loudness_probe' | 'normalize_audio' | 'waveform_summary' | 'trim_audio'

export interface FFmpegAudioInput {
  sourceAudioLocalPath?: string
  outputAudioLocalPath?: string
  safeOutputRoot?: string
  ffmpegBin: string
  timeoutMs: number
  operation: FFmpegAudioOperation
  targetLoudnessLufs?: number
  truePeakDb?: number
  sampleRate?: number
  channels?: number
  trimStartSeconds?: number
  trimDurationSeconds?: number
  runMode: AudioFoundationRunMode
  arbitraryArgs?: string[]
}

export interface FFmpegAudioCommandPlan {
  command: string
  args: string[]
  operation: FFmpegAudioOperation
  expectedOutputPath?: string
  summary: string
}

export function buildFFmpegAudioLoudnessCommand(input: FFmpegAudioInput): FFmpegAudioCommandPlan {
  validateFFmpegAudioInput({ ...input, operation: 'loudness_probe' })
  return {
    command: input.ffmpegBin,
    operation: 'loudness_probe',
    args: [
      '-hide_banner',
      '-nostdin',
      '-i',
      input.sourceAudioLocalPath as string,
      '-af',
      'loudnorm=I=-16:TP=-1:LRA=11:print_format=json',
      '-f',
      'null',
      '-',
    ],
    summary: `FFmpeg loudness probe for ${sanitizeAudioPathForLog(input.sourceAudioLocalPath ?? 'audio')}`,
  }
}

export function buildFFmpegAudioNormalizeCommand(input: FFmpegAudioInput): FFmpegAudioCommandPlan {
  validateFFmpegAudioInput({ ...input, operation: 'normalize_audio' })
  const outputPath = resolveAudioOutput(input)
  return {
    command: input.ffmpegBin,
    operation: 'normalize_audio',
    expectedOutputPath: outputPath,
    args: [
      '-hide_banner',
      '-nostdin',
      '-n',
      '-i',
      input.sourceAudioLocalPath as string,
      '-af',
      `loudnorm=I=${input.targetLoudnessLufs ?? -16}:TP=${input.truePeakDb ?? -1}:LRA=11`,
      '-ar',
      String(input.sampleRate ?? 48000),
      '-ac',
      String(input.channels ?? 2),
      outputPath,
    ],
    summary: 'FFmpeg loudness normalization plan with allowlisted loudnorm filter.',
  }
}

export function buildFFmpegAudioWaveformSummaryCommand(input: FFmpegAudioInput): FFmpegAudioCommandPlan {
  validateFFmpegAudioInput({ ...input, operation: 'waveform_summary' })
  return {
    command: input.ffmpegBin,
    operation: 'waveform_summary',
    args: [
      '-hide_banner',
      '-nostdin',
      '-i',
      input.sourceAudioLocalPath as string,
      '-af',
      'astats=metadata=1:reset=1',
      '-f',
      'null',
      '-',
    ],
    summary: 'FFmpeg waveform/astats summary command with allowlisted parameters.',
  }
}

export function buildFFmpegAudioTrimCommand(input: FFmpegAudioInput): FFmpegAudioCommandPlan {
  validateFFmpegAudioInput({ ...input, operation: 'trim_audio' })
  const outputPath = resolveAudioOutput(input)
  return {
    command: input.ffmpegBin,
    operation: 'trim_audio',
    expectedOutputPath: outputPath,
    args: [
      '-hide_banner',
      '-nostdin',
      '-n',
      '-ss',
      String(Math.max(0, input.trimStartSeconds ?? 0)),
      '-i',
      input.sourceAudioLocalPath as string,
      '-t',
      String(Math.max(0.01, input.trimDurationSeconds ?? 1)),
      '-c:a',
      'pcm_s16le',
      outputPath,
    ],
    summary: 'FFmpeg audio trim command for local-dev metadata/fixture validation only.',
  }
}

export async function runFFmpegAudioCommand(input: FFmpegAudioCommandPlan & { timeoutMs: number }): Promise<string> {
  for (const arg of input.args) {
    assertNoSignedUrlOrRawUrl(arg, 'ffmpegAudioArg')
  }
  const result = await execFileAsync(input.command, input.args, {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  })
  if (input.expectedOutputPath) {
    await validateAudioOutputFile({ outputAudioLocalPath: input.expectedOutputPath })
  }
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`
}

export function parseLoudnessOutput(input: string): {
  integratedLufs?: number
  truePeakDb?: number
} {
  const jsonMatch = input.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return {}
  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
  return {
    integratedLufs: numberFrom(parsed.input_i),
    truePeakDb: numberFrom(parsed.input_tp),
  }
}

export async function validateAudioOutputFile(input: { outputAudioLocalPath: string }): Promise<void> {
  const outputStat = await stat(input.outputAudioLocalPath)
  if (outputStat.size <= 0) throw new Error('FFmpeg audio output is empty.')
}

export function buildFFmpegAudioSkipReason(input: FFmpegAudioInput): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') {
    return { code: 'production_ffmpeg_audio_blocked', message: 'Production FFmpeg audio execution is blocked in Milestone 9.', tool: 'ffmpeg' }
  }
  if (input.runMode !== 'local_dev') return undefined
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) {
    return { code: 'local_audio_missing', message: 'local_dev FFmpeg audio skipped because the source audio path is unavailable.', tool: 'ffmpeg' }
  }
  return undefined
}

export function validateFFmpegAudioInput(input: FFmpegAudioInput): void {
  if (input.arbitraryArgs && input.arbitraryArgs.length > 0) {
    throw new Error('Milestone 9 rejects arbitrary FFmpeg audio args.')
  }
  if (input.sourceAudioLocalPath) {
    assertNoSignedUrlOrRawUrl(input.sourceAudioLocalPath, 'sourceAudioLocalPath')
    assertNoPathTraversal(input.sourceAudioLocalPath, 'sourceAudioLocalPath')
  }
  if (input.outputAudioLocalPath) {
    assertNoSignedUrlOrRawUrl(input.outputAudioLocalPath, 'outputAudioLocalPath')
    assertNoPathTraversal(input.outputAudioLocalPath, 'outputAudioLocalPath')
  }
  if (input.runMode === 'local_dev' && !input.sourceAudioLocalPath) {
    throw new Error('local_dev FFmpeg audio requires sourceAudioLocalPath.')
  }
  if ((input.operation === 'normalize_audio' || input.operation === 'trim_audio') && (!input.outputAudioLocalPath || !input.safeOutputRoot)) {
    throw new Error(`${input.operation} requires outputAudioLocalPath and safeOutputRoot.`)
  }
}

function resolveAudioOutput(input: FFmpegAudioInput): string {
  const output = resolveAudioOutputPath({
    sourceAudioLocalPath: input.sourceAudioLocalPath as string,
    outputAudioLocalPath: input.outputAudioLocalPath as string,
    safeOutputRoot: input.safeOutputRoot as string,
  })
  assertSourceNotOverwritten(input.sourceAudioLocalPath as string, output)
  const root = input.safeOutputRoot as string
  assertOutputPathInsideRoot(output, root)
  return output
}

export async function ensureAudioOutputDir(outputPath: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true })
}

function numberFrom(value: unknown): number | undefined {
  const numberValue = typeof value === 'string' ? Number(value) : value
  return typeof numberValue === 'number' && Number.isFinite(numberValue) ? numberValue : undefined
}
