import { runColorExecution } from '../color/color-execution-runner'
import type { ColorExecutionInput, ColorExecutionResult } from './color-execution-pipeline-types'

export function runColorExecutionPipeline(input: ColorExecutionInput): Promise<ColorExecutionResult> {
  return runColorExecution(input)
}
