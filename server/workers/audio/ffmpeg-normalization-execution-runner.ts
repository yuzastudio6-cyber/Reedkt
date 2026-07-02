import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  buildFFmpegAudioNormalizeCommand,
  runFFmpegAudioCommand,
  type FFmpegAudioCommandPlan,
} from './ffmpeg-audio-adapter'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import { buildAudioExecutionArtifactRecord } from './audio-execution-artifact-writer'
import type { AudioExecutionInput, AudioExecutionPlan, AudioNormalizationExecutionResult } from './audio-execution-types'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export function buildFFmpegNormalizationExecutionCommand(input: {
  executionInput: AudioExecutionInput
  executionPlan: AudioExecutionPlan
}): FFmpegAudioCommandPlan {
  const outputPath = resolveNormalizedOutputPath(input.executionInput)
  if (
    input.executionInput.mode === 'local_dev' &&
    input.executionInput.sourceAudioLocalPath &&
    existsSync(input.executionInput.sourceAudioLocalPath) &&
    outputPath
  ) {
    return buildFFmpegAudioNormalizeCommand({
      sourceAudioLocalPath: input.executionInput.sourceAudioLocalPath,
      outputAudioLocalPath: outputPath,
      safeOutputRoot: input.executionInput.outputDirectory,
      ffmpegBin: input.executionInput.ffmpegBin ?? 'ffmpeg',
      timeoutMs: input.executionInput.timeoutMs ?? 20_000,
      operation: 'normalize_audio',
      targetLoudnessLufs: input.executionPlan.loudnessOperationPlan.targetLufs,
      truePeakDb: input.executionPlan.loudnessOperationPlan.truePeakDb,
      runMode: toAudioFoundationMode(input.executionInput.mode),
      arbitraryArgs: input.executionInput.arbitraryFfmpegArgs,
    })
  }

  return {
    command: input.executionInput.ffmpegBin ?? 'ffmpeg',
    operation: 'normalize_audio',
    expectedOutputPath: outputPath ?? '__SAFE_OUTPUT_ROOT_REQUIRED__/normalized-audio.wav',
    args: [
      '-hide_banner',
      '-nostdin',
      '-n',
      '-i',
      input.executionInput.sourceAudioLocalPath ?? '__SOURCE_AUDIO_LOCAL_PATH_REQUIRED__',
      '-af',
      `loudnorm=I=${input.executionPlan.loudnessOperationPlan.targetLufs}:TP=${input.executionPlan.loudnessOperationPlan.truePeakDb}:LRA=11`,
      '-ar',
      '48000',
      '-ac',
      '2',
      outputPath ?? '__SAFE_OUTPUT_ROOT_REQUIRED__/normalized-audio.wav',
    ],
    summary: 'FFmpeg loudness normalization command metadata with allowlisted loudnorm filter.',
  }
}

export async function runFFmpegNormalizationExecution(input: {
  executionInput: AudioExecutionInput
  executionPlan: AudioExecutionPlan
}): Promise<AudioNormalizationExecutionResult> {
  const commandPlan = buildFFmpegNormalizationExecutionCommand(input)
  const skipReason = buildFFmpegNormalizationExecutionSkipReason(input.executionInput)
  if (skipReason) return { status: input.executionInput.mode === 'dry_run' || input.executionInput.mode === 'container_ready' ? 'planned' : 'skipped', commandPlan, skipReason }

  try {
    await runFFmpegAudioCommand({ ...commandPlan, timeoutMs: input.executionInput.timeoutMs ?? 20_000 })
    return {
      status: 'completed',
      commandPlan,
      outputAudioLocalPath: commandPlan.expectedOutputPath,
      cleanedAudioArtifact: buildAudioExecutionArtifactRecord({
        workspaceId: input.executionInput.workspaceId,
        projectId: input.executionInput.projectId,
        mediaAssetId: input.executionInput.mediaAssetId,
        artifactType: 'cleaned_audio',
        fileName: 'normalized-audio.wav',
        contentType: 'audio/wav',
        metadata: { executionPlanId: input.executionPlan.executionPlanId, ffmpegNormalized: true },
        sourceOfTruth: true,
      }),
    }
  } catch (error) {
    return {
      status: 'failed',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : 'FFmpeg normalization failed.',
    }
  }
}

export function buildFFmpegNormalizationExecutionSkipReason(input: AudioExecutionInput): AudioToolSkipReason | undefined {
  if (input.mode !== 'local_dev') return { code: 'ffmpeg_normalization_not_executed_in_mode', message: `${input.mode} builds normalization command metadata only.`, tool: 'ffmpeg' }
  if (!input.enableFfmpegAudioExecution) return { code: 'ffmpeg_audio_execution_disabled', message: 'FFmpeg audio execution is disabled.', tool: 'ffmpeg' }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) return { code: 'local_audio_missing', message: 'FFmpeg normalization skipped because local source audio is missing.', tool: 'ffmpeg' }
  if (!input.outputDirectory) return { code: 'output_directory_missing', message: 'FFmpeg normalization skipped because outputDirectory is missing.', tool: 'ffmpeg' }
  return undefined
}

function resolveNormalizedOutputPath(input: AudioExecutionInput): string | undefined {
  if (!input.outputDirectory) return undefined
  assertNoSignedUrlOrRawUrl(input.outputDirectory, 'outputDirectory')
  assertNoPathTraversal(input.outputDirectory, 'outputDirectory')
  const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'normalized-audio.wav'), input.outputDirectory)
  if (input.sourceAudioLocalPath) assertSourceNotOverwritten(input.sourceAudioLocalPath, outputPath)
  return outputPath
}

function toAudioFoundationMode(mode: AudioExecutionInput['mode']): AudioFoundationRunMode {
  if (mode === 'local_dev') return 'local_dev'
  if (mode === 'production_blocked' || mode === 'production_ready') return 'production_blocked'
  return 'dry_run'
}
