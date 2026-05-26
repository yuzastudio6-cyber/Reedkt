import { existsSync } from 'node:fs'
import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest, RenderToolExecutionResult } from './render-execution-types'

export async function runLibassCaptionBurnIn(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  commandPlan: RenderCommandPlan
}): Promise<RenderToolExecutionResult> {
  if (input.commandPlan.tool !== 'libass') {
    return skipped(input.commandPlan, 'libass_not_selected', 'libass command plan was not selected.')
  }
  if (input.executionInput.mode !== 'local_dev' || input.executionInput.enableCaptionBurnIn !== true) {
    return skipped(input.commandPlan, 'libass_burnin_disabled_or_not_local_dev', 'Caption burn-in runs only when explicitly enabled in local-dev.')
  }
  const captionPath = input.executionInput.captionLocalPaths?.[0]
  if (!captionPath || !existsSync(captionPath)) {
    return skipped(input.commandPlan, 'libass_caption_missing', 'Safe local caption artifact is unavailable.')
  }
  return {
    status: 'skipped',
    tool: 'libass',
    commandPlan: input.commandPlan,
    skipReason: { code: 'libass_burnin_not_executed_by_default', message: 'M16A keeps libass burn-in execution skip-safe by default.', tool: 'libass' },
    warnings: [],
  }
}

function skipped(commandPlan: RenderCommandPlan, code: string, message: string): RenderToolExecutionResult {
  return { status: 'skipped', tool: 'libass', commandPlan, skipReason: { code, message, tool: 'libass' }, warnings: [] }
}
