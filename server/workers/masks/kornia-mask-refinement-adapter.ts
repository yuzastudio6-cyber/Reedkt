import type { MaskExecutionInput, MaskTaskPlan, MaskToolExecutionResult } from './mask-execution-types'

export async function runKorniaMaskRefinement(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  return {
    status: 'skipped',
    tool: 'kornia',
    commandPlan: {
      tool: 'kornia',
      command: 'python',
      args: ['-c', 'import kornia; print("kornia-mask-refinement-check")'],
      executes: false,
      summary: 'Kornia refinement import/check plan only; no GPU processing or inference.',
    },
    skipReason: { code: 'kornia_refinement_not_executed', message: 'Kornia refinement is skip-safe and not executed by default.', tool: 'kornia' },
    warnings: input.taskPlan.temporalSmoothingPlan.required ? ['Kornia temporal smoothing planned but not claimed as executed.'] : [],
  }
}
