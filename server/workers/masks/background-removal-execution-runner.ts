import { runBiRefNetMask } from './birefnet-execution-runner'
import { runSam2Tracking } from './sam2-execution-runner'
import { runTransparentBackgroundFallback } from './transparent-background-adapter'
import { runRembgFallback } from './rembg-adapter'
import { runOpenCvMaskRefinement } from './opencv-mask-refinement-adapter'
import { runKorniaMaskRefinement } from './kornia-mask-refinement-adapter'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolExecutionResult } from './mask-execution-types'

export async function runBackgroundRemovalExecution(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult[]> {
  const results = [await runBiRefNetMask(input)]
  if (input.taskPlan.fallbackTools.includes('sam2') || input.taskPlan.temporalSmoothingPlan.trackingRequired) {
    results.push(await runSam2Tracking(input))
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
