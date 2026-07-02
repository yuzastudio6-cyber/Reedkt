import type { EnhancementExecutionInput, EnhancementTaskPlan, EnhancementToolExecutionResult } from './enhancement-execution-types'

export async function runSharpEnhancementAdapter(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): Promise<EnhancementToolExecutionResult> {
  return {
    status: 'skipped',
    tool: 'sharp',
    commandPlan: {
      tool: 'sharp',
      args: ['package-metadata-check', 'resize-thumbnail-sample-plan'],
      executes: false,
      summary: 'Sharp/libvips still-image enhancement planning only; no final video processing.',
    },
    skipReason: { code: 'sharp_enhancement_not_executed', message: 'Sharp enhancement remains skip-safe and does not process images by default in M15D.', tool: 'sharp' },
    warnings: input.taskPlan.enhancementIntent === 'enhance_thumbnail' ? ['Sharp thumbnail enhancement fallback is planned but not executed.'] : [],
  }
}
