import type { EnhancementExecutionInput, EnhancementTaskPlan, EnhancementToolExecutionResult } from './enhancement-execution-types'

export async function runOpenCvEnhancementQA(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): Promise<EnhancementToolExecutionResult> {
  return {
    status: 'skipped',
    tool: 'opencv',
    commandPlan: {
      tool: 'opencv',
      command: 'python',
      args: ['-c', 'import cv2; print("opencv-enhancement-qa-check")'],
      executes: false,
      summary: 'OpenCV enhancement QA import/check plan only; no media processing by default.',
    },
    skipReason: { code: 'opencv_enhancement_qa_not_executed', message: 'OpenCV enhancement QA is planned metadata unless available and explicitly enabled later.', tool: 'opencv' },
    warnings: input.taskPlan.sampleFirstPolicy.rejectConditions.includes('flicker_risk') ? ['OpenCV flicker/artifact QA planned but not claimed as executed.'] : [],
  }
}
