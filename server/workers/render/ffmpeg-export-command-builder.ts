import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest } from './render-execution-types'

export function buildFfmpegExportCommandPlan(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
}): RenderCommandPlan {
  const outputPath = input.executionInput.outputDirectory
    ? `${input.executionInput.outputDirectory}/${input.executionInput.renderMode === 'final_export' ? 'm16a-final-export.mp4' : 'm16a-preview.mp4'}`
    : '[worker-temp-ffmpeg-output]'
  return {
    planId: `ffmpeg-export-${input.executionManifest.executionManifestId}`,
    tool: 'ffmpeg',
    command: 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.executionInput.proxyLocalPaths?.[0] ?? input.executionInput.sourceLocalPaths?.[0] ?? '[private-video-input]',
      ...(input.executionInput.audioLocalPaths?.[0] ? ['-i', input.executionInput.audioLocalPaths[0]] : []),
      '-map',
      '0:v:0',
      ...(input.executionInput.audioLocalPaths?.[0] ? ['-map', '1:a:0'] : []),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      outputPath,
    ],
    expectedOutputPath: outputPath,
    executes: false,
    renderMode: input.executionInput.renderMode,
    summary: 'Allowlisted FFmpeg preview/export command plan with safe codec/container settings.',
  }
}
