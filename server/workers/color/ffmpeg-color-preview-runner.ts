import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { promisify } from 'node:util'
import { buildFFmpegColorPreviewCommandPlan } from './ffmpeg-color-command-builder'
import { buildColorArtifactRecord } from './color-artifact-writer'
import type { ColorExecutionInput, ColorExecutionPlan, ColorPreviewExecutionResult, ColorToolSkipReason } from './color-execution-types'

const execFileAsync = promisify(execFile)

export async function runFFmpegColorPreview(input: {
  executionInput: ColorExecutionInput
  executionPlan: ColorExecutionPlan
}): Promise<ColorPreviewExecutionResult> {
  const commandPlan = buildFFmpegColorPreviewCommandPlan(input)
  const skipReason = buildFFmpegColorPreviewSkipReason(input.executionInput, commandPlan.expectedOutputPath)
  if (skipReason) return { status: input.executionInput.mode === 'dry_run' || input.executionInput.mode === 'container_ready' ? 'planned' : 'skipped', commandPlan, skipReason }

  try {
    await execFileAsync(commandPlan.command, commandPlan.args, {
      timeout: input.executionInput.timeoutMs ?? 20_000,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    })
    if (commandPlan.expectedOutputPath) {
      const outputStat = await stat(commandPlan.expectedOutputPath)
      if (outputStat.size <= 0) throw new Error('FFmpeg color preview output is empty.')
    }
    return {
      status: 'completed',
      commandPlan,
      outputVideoLocalPath: commandPlan.expectedOutputPath,
      gradedPreviewArtifact: buildColorArtifactRecord({
        workspaceId: input.executionInput.workspaceId,
        projectId: input.executionInput.projectId,
        mediaAssetId: input.executionInput.mediaAssetId,
        artifactType: 'graded_preview',
        fileName: 'graded-preview.mp4',
        contentType: 'video/mp4',
        previewAllowed: true,
        sourceOfTruth: false,
        metadata: { executionPlanId: input.executionPlan.executionPlanId, ffmpegColorPreview: true },
      }),
    }
  } catch (error) {
    return {
      status: 'failed',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : 'FFmpeg color preview failed.',
    }
  }
}

export function buildFFmpegColorPreviewSkipReason(input: ColorExecutionInput, expectedOutputPath?: string): ColorToolSkipReason | undefined {
  if (input.mode !== 'local_dev') return { code: 'ffmpeg_color_preview_not_executed_in_mode', message: `${input.mode} builds color preview command metadata only.`, tool: 'ffmpeg' }
  if (!input.enableFfmpegColorPreview) return { code: 'ffmpeg_color_preview_disabled', message: 'FFmpeg color preview execution is disabled.', tool: 'ffmpeg' }
  const sourcePath = input.proxyVideoLocalPath ?? input.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) return { code: 'local_video_missing', message: 'FFmpeg color preview skipped because safe local source/proxy media is missing.', tool: 'ffmpeg' }
  if (!input.outputDirectory || !expectedOutputPath) return { code: 'output_directory_missing', message: 'FFmpeg color preview skipped because outputDirectory is missing.', tool: 'ffmpeg' }
  return undefined
}
