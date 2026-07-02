import type { MaskExecutionInput, MaskTaskPlan, MaskToolExecutionResult } from './mask-execution-types'

export async function runOpenCvMaskRefinement(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  return {
    status: 'skipped',
    tool: 'opencv',
    commandPlan: {
      tool: 'opencv',
      command: 'python',
      args: ['-c', 'import cv2; print("opencv-mask-refinement-check")'],
      executes: false,
      summary: 'OpenCV mask refinement import/check plan only; no mask processing by default.',
    },
    skipReason: { code: 'opencv_refinement_not_executed', message: 'OpenCV refinement is planned metadata unless available and explicitly enabled in a future controlled path.', tool: 'opencv' },
    warnings: input.taskPlan.refinementPlan.operations.includes('edge_cleanup') ? ['OpenCV edge cleanup planned but not claimed as executed.'] : [],
  }
}
