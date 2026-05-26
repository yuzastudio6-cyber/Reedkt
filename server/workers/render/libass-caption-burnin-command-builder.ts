import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest } from './render-execution-types'

export function buildLibassCaptionBurnInCommandPlan(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
}): RenderCommandPlan {
  const outputPath = input.executionInput.outputDirectory
    ? `${input.executionInput.outputDirectory}/${input.executionInput.renderMode === 'final_export' ? 'm16a-caption-burnin-final.mp4' : 'm16a-caption-burnin-preview.mp4'}`
    : '[worker-temp-libass-output]'
  return {
    planId: `libass-burnin-${input.executionManifest.executionManifestId}`,
    tool: 'libass',
    command: 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.executionInput.proxyLocalPaths?.[0] ?? input.executionInput.sourceLocalPaths?.[0] ?? '[private-video-input]',
      '-vf',
      `subtitles=${input.executionInput.captionLocalPaths?.[0] ?? '[validated-private-caption-file]'}`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      outputPath,
    ],
    expectedOutputPath: outputPath,
    executes: false,
    renderMode: input.executionInput.renderMode,
    summary: 'Allowlisted FFmpeg/libass caption burn-in command plan for already validated captions.',
  }
}
