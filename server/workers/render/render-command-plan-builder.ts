import { buildFfmpegExportCommandPlan } from './ffmpeg-export-command-builder'
import { buildLibassCaptionBurnInCommandPlan } from './libass-caption-burnin-command-builder'
import { buildRemotionRenderCommandPlan } from './remotion-render-command-builder'
import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest } from './render-execution-types'

export function buildRenderCommandPlans(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
}): RenderCommandPlan[] {
  const plans: RenderCommandPlan[] = []
  if (input.executionManifest.renderEngine === 'remotion' || input.executionManifest.renderEngine === 'hybrid') {
    plans.push(buildRemotionRenderCommandPlan(input))
  }
  if (input.executionManifest.renderEngine === 'ffmpeg' || input.executionManifest.renderEngine === 'hybrid') {
    plans.push(buildFfmpegExportCommandPlan(input))
  }
  if (input.executionManifest.renderEngine === 'libass' || input.executionManifest.renderEngine === 'hybrid' || input.executionInput.enableCaptionBurnIn === true) {
    plans.push(buildLibassCaptionBurnInCommandPlan(input))
  }
  if (plans.length === 0) plans.push(buildFfmpegExportCommandPlan(input))
  return plans
}
