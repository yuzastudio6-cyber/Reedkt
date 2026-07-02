import { existsSync } from 'node:fs'
import { buildRenderArtifactRecord } from './render-artifact-writer'
import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest, RenderToolExecutionResult } from './render-execution-types'

export async function runFfmpegExport(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  commandPlan: RenderCommandPlan
}): Promise<RenderToolExecutionResult> {
  if (input.commandPlan.tool !== 'ffmpeg') {
    return skipped(input.commandPlan, 'ffmpeg_not_selected', 'FFmpeg command plan was not selected.')
  }
  if (input.executionInput.mode !== 'local_dev' || input.executionInput.enableLocalDevRender !== true) {
    return skipped(input.commandPlan, 'ffmpeg_render_disabled_or_not_local_dev', 'FFmpeg preview/export runs only when explicitly enabled in local-dev.')
  }
  const sourcePath = input.executionInput.proxyLocalPaths?.[0] ?? input.executionInput.sourceLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return skipped(input.commandPlan, 'ffmpeg_render_source_missing', 'Safe local source/proxy media is unavailable.')
  }
  if (!input.executionInput.outputDirectory || !existsSync(input.executionInput.outputDirectory)) {
    return skipped(input.commandPlan, 'ffmpeg_render_output_root_missing', 'Safe local output directory is unavailable.')
  }
  return {
    status: 'skipped',
    tool: 'ffmpeg',
    commandPlan: input.commandPlan,
    skipReason: { code: 'ffmpeg_render_not_executed_by_default', message: 'M16A keeps FFmpeg export execution skip-safe unless reviewed fixture execution is added.', tool: 'ffmpeg' },
    warnings: [],
  }
}

function skipped(commandPlan: RenderCommandPlan, code: string, message: string): RenderToolExecutionResult {
  return { status: 'skipped', tool: 'ffmpeg', commandPlan, skipReason: { code, message, tool: 'ffmpeg' }, warnings: [] }
}

export function buildFfmpegOutputArtifact(input: {
  executionInput: FinalRenderExecutionInput
}): ReturnType<typeof buildRenderArtifactRecord> {
  return buildRenderArtifactRecord({
    workspaceId: input.executionInput.workspaceId,
    projectId: input.executionInput.projectId,
    mediaAssetId: input.executionInput.mediaAssetId,
    artifactType: input.executionInput.renderMode === 'final_export' ? 'final_export' : 'preview_video',
    fileName: input.executionInput.renderMode === 'final_export' ? 'ffmpeg-final-export.mp4' : 'ffmpeg-preview.mp4',
    sourceOfTruth: input.executionInput.renderMode === 'final_export',
    previewAllowed: input.executionInput.renderMode !== 'final_export',
    metadata: { tool: 'ffmpeg', plannedOnly: true },
  })
}
