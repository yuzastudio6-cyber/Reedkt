import { runBiRefNetMask } from './birefnet-execution-runner'
import { runSam31Tracking } from './sam3_1-execution-runner'
import { runTransparentBackgroundFallback } from './transparent-background-adapter'
import { runRembgFallback } from './rembg-adapter'
import { runOpenCvMaskRefinement } from './opencv-mask-refinement-adapter'
import { runKorniaMaskRefinement } from './kornia-mask-refinement-adapter'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolExecutionResult } from './mask-execution-types'

export async function runBackgroundRemovalExecution(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult[]> {
  const results: MaskToolExecutionResult[] = []
  if (input.taskPlan.primaryTool === 'sam3_1' || input.taskPlan.fallbackTools.includes('sam3_1') || input.taskPlan.temporalSmoothingPlan.trackingRequired) {
    results.push(await runSam31Tracking(input))
  }
  if (input.taskPlan.primaryTool === 'birefnet' || input.taskPlan.fallbackTools.includes('birefnet')) {
    results.push(await runBiRefNetMask(input))
  }
  if (input.taskPlan.fallbackTools.includes('transparent_background')) {
    results.push(await runTransparentBackgroundFallback(input))
  }
  if (input.taskPlan.fallbackTools.includes('rembg')) {
    results.push(await runRembgFallback(input))
  }
  if (input.taskPlan.refinementPlan.opencv) {
    results.push(await runOpenCvMaskRefinement(input))
  }
  if (input.taskPlan.refinementPlan.kornia) {
    results.push(await runKorniaMaskRefinement(input))
  }
  return results
}
