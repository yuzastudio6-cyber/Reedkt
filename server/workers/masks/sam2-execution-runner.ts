import type { MaskExecutionInput, MaskTaskPlan, MaskToolCommandPlan, MaskToolExecutionResult } from './mask-execution-types'

/** @deprecated Immutable historical-evidence compatibility only. */
type HistoricalSam2ExecutionInput = MaskExecutionInput

export function buildSam2CommandPlan(input: {
  executionInput: HistoricalSam2ExecutionInput
  taskPlan: MaskTaskPlan
}): MaskToolCommandPlan {
  return {
    tool: 'sam2',
    command: 'python',
    args: [
      '-m',
      'sam2',
      '--video',
      input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? '[private-video-ref]',
      '--subject',
      input.executionInput.subjectSelection?.approvedSubjectLabel ?? 'approved_subject',
      '--output',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/sam2-mask-sequence` : '[worker-temp-mask-sequence]',
      '--no-download',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/sam2-mask-sequence` : undefined,
    executes: false,
    summary: 'SAM2 segmentation/tracking command plan; no checkpoint download and no execution by builder.',
  }
}

export async function runSam2Tracking(input: {
  executionInput: HistoricalSam2ExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = buildSam2CommandPlan(input)
  return {
    status: 'skipped',
    tool: 'sam2',
    commandPlan,
    skipReason: {
      code: 'sam2_historical_only',
      message: 'SAM 2 execution is disabled. Immutable historical evidence may be reread, but every new plan, fallback, and repair must use the canonical SAM 3.1 path.',
      tool: 'sam2',
    },
    warnings: ['No SAM 2 checkpoint or inference path is available from the active mask worker barrel.'],
  }
}
