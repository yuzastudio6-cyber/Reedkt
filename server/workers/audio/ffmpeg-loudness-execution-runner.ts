import { existsSync } from 'node:fs'
import {
  buildFFmpegAudioLoudnessCommand,
  parseLoudnessOutput,
  runFFmpegAudioCommand,
  type FFmpegAudioCommandPlan,
} from './ffmpeg-audio-adapter'
import type { AudioExecutionInput, AudioLoudnessExecutionResult } from './audio-execution-types'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export function buildFFmpegLoudnessExecutionCommand(input: AudioExecutionInput): FFmpegAudioCommandPlan {
  return buildFFmpegAudioLoudnessCommand({
    sourceAudioLocalPath: input.sourceAudioLocalPath ?? '__SOURCE_AUDIO_LOCAL_PATH_REQUIRED__',
    ffmpegBin: input.ffmpegBin ?? 'ffmpeg',
    timeoutMs: input.timeoutMs ?? 15_000,
    operation: 'loudness_probe',
    runMode: toAudioFoundationMode(input.mode),
    arbitraryArgs: input.arbitraryFfmpegArgs,
  })
}

export async function runFFmpegLoudnessExecution(input: AudioExecutionInput): Promise<AudioLoudnessExecutionResult> {
  const commandPlan = buildFFmpegLoudnessExecutionCommand(input)
  const skipReason = buildFFmpegLoudnessExecutionSkipReason(input)
  if (skipReason) return { status: input.mode === 'dry_run' || input.mode === 'container_ready' ? 'planned' : 'skipped', commandPlan, skipReason }

  try {
    const output = await runFFmpegAudioCommand({ ...commandPlan, timeoutMs: input.timeoutMs ?? 15_000 })
    const parsed = parseLoudnessOutput(output)
    return {
      status: 'completed',
      commandPlan,
      integratedLufs: parsed.integratedLufs,
      truePeakDb: parsed.truePeakDb,
    }
  } catch (error) {
    return {
      status: 'failed',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : 'FFmpeg loudness analysis failed.',
    }
  }
}

export function buildFFmpegLoudnessExecutionSkipReason(input: AudioExecutionInput): AudioToolSkipReason | undefined {
  if (input.mode !== 'local_dev') {
    return { code: 'ffmpeg_loudness_not_executed_in_mode', message: `${input.mode} builds loudness command metadata only.`, tool: 'ffmpeg' }
  }
  if (!input.enableFfmpegAudioExecution) {
    return { code: 'ffmpeg_audio_execution_disabled', message: 'FFmpeg audio execution is disabled.', tool: 'ffmpeg' }
  }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) {
    return { code: 'local_audio_missing', message: 'FFmpeg loudness skipped because local source audio is missing.', tool: 'ffmpeg' }
  }
  return undefined
}

function toAudioFoundationMode(mode: AudioExecutionInput['mode']): AudioFoundationRunMode {
  if (mode === 'local_dev') return 'local_dev'
  if (mode === 'production_blocked' || mode === 'production_ready') return 'production_blocked'
  return 'dry_run'
}
