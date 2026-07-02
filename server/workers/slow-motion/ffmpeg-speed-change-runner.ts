import { existsSync } from 'node:fs'
import type { SlowMotionExecutionInput, SlowMotionTaskPlan, SlowMotionToolCommandPlan, SlowMotionToolExecutionResult } from './slow-motion-execution-types'

export function buildFfmpegSpeedChangePlan(input: {
  executionInput: SlowMotionExecutionInput
  taskPlan: SlowMotionTaskPlan
}): SlowMotionToolCommandPlan {
  const speed = Number((1 / input.taskPlan.slowMotionFactor).toFixed(4))
  return {
    tool: 'ffmpeg',
    command: input.executionInput.ffmpegBin ?? 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? '[private-source-ref]',
      '-filter:v',
      `setpts=${input.taskPlan.slowMotionFactor}*PTS`,
      '-an',
      '-metadata',
      `reeditpro_speed=${speed}`,
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/m15d-slow-motion-preview.mp4` : '[worker-temp-preview]',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/m15d-slow-motion-preview.mp4` : undefined,
    executes: false,
    summary: 'FFmpeg native speed-change preview plan using allowlisted setpts; preview/sample only.',
  }
}

export async function runFfmpegSpeedChange(input: {
  executionInput: SlowMotionExecutionInput
  taskPlan: SlowMotionTaskPlan
}): Promise<SlowMotionToolExecutionResult> {
  const commandPlan = buildFfmpegSpeedChangePlan(input)
  if (input.executionInput.mode !== 'local_dev' || input.executionInput.enableFfmpegFallbackPreview !== true) {
    return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code: 'ffmpeg_speed_preview_disabled_or_not_local_dev', message: 'FFmpeg speed preview runs only when explicitly enabled in local-dev.', tool: 'ffmpeg' }, warnings: [] }
  }
  const sourcePath = input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code: 'ffmpeg_speed_source_missing', message: 'Safe local selected clip/proxy source is missing.', tool: 'ffmpeg' }, warnings: [] }
  }
  return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code: 'ffmpeg_speed_preview_not_executed', message: 'M15D smoke paths do not execute slow-motion previews by default.', tool: 'ffmpeg' }, warnings: [] }
}
