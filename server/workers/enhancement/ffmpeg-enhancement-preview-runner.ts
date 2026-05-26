import { existsSync } from 'node:fs'
import type { EnhancementExecutionInput, EnhancementTaskPlan, EnhancementToolCommandPlan, EnhancementToolExecutionResult } from './enhancement-execution-types'

export function buildFfmpegEnhancementPreviewPlan(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): EnhancementToolCommandPlan {
  return {
    tool: 'ffmpeg',
    command: input.executionInput.ffmpegBin ?? 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? input.executionInput.sourceImageLocalPath ?? '[private-source-ref]',
      '-vf',
      `scale=iw*${Math.min(input.taskPlan.targetScale, 2)}:ih*${Math.min(input.taskPlan.targetScale, 2)}:flags=lanczos`,
      '-t',
      '3',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/m15d-enhancement-preview.mp4` : '[worker-temp-preview]',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/m15d-enhancement-preview.mp4` : undefined,
    executes: false,
    summary: 'FFmpeg fallback enhancement preview plan using allowlisted scale filter; preview/sample only.',
  }
}

export async function runFfmpegEnhancementPreview(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): Promise<EnhancementToolExecutionResult> {
  const commandPlan = buildFfmpegEnhancementPreviewPlan(input)
  if (input.executionInput.mode !== 'local_dev' || input.executionInput.enableFfmpegFallbackPreview !== true) {
    return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code: 'ffmpeg_enhancement_preview_disabled_or_not_local_dev', message: 'FFmpeg enhancement preview runs only when explicitly enabled in local-dev.', tool: 'ffmpeg' }, warnings: [] }
  }
  const sourcePath = input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? input.executionInput.sourceImageLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code: 'ffmpeg_enhancement_source_missing', message: 'Safe local enhancement source is missing.', tool: 'ffmpeg' }, warnings: [] }
  }
  return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code: 'ffmpeg_enhancement_preview_not_executed', message: 'M15D smoke paths do not execute enhancement previews by default.', tool: 'ffmpeg' }, warnings: [] }
}
