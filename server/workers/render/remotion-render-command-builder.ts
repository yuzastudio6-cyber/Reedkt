import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest } from './render-execution-types'

export function buildRemotionRenderCommandPlan(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
}): RenderCommandPlan {
  const outputPath = input.executionInput.outputDirectory
    ? `${input.executionInput.outputDirectory}/${input.executionInput.renderMode === 'final_export' ? 'm16a-remotion-final.mp4' : 'm16a-remotion-preview.mp4'}`
    : '[worker-temp-remotion-output]'
  return {
    planId: `remotion-render-${input.executionManifest.executionManifestId}`,
    tool: 'remotion',
    command: 'npx',
    args: [
      'remotion',
      'render',
      'src/remotion/Root.tsx',
      'ReeditProComposition',
      outputPath,
      '--props',
      '[private-render-manifest-json]',
      '--codec',
      'h264',
      '--pixel-format',
      'yuv420p',
    ],
    expectedOutputPath: outputPath,
    executes: false,
    renderMode: input.executionInput.renderMode,
    summary: 'Allowlisted Remotion render command plan; no user JS/code injection and no Revideo.',
  }
}
