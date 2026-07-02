import { runMaskExecution } from '../masks/mask-execution-runner'
import type { MaskExecutionInput, MaskExecutionResult } from './mask-composition-pipeline-types'

export function runMaskCompositionPipeline(input: MaskExecutionInput): Promise<MaskExecutionResult> {
  return runMaskExecution(input)
}
