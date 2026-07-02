import { runFinalRenderExecution } from '../render'
import type { FinalRenderExecutionInput, FinalRenderExecutionResult } from './final-render-pipeline-types'
import { buildFinalRenderPipelineResult } from './final-render-result-builder'

export async function runFinalRenderExecutionPipeline(input: FinalRenderExecutionInput): Promise<FinalRenderExecutionResult> {
  return buildFinalRenderPipelineResult(await runFinalRenderExecution(input))
}
