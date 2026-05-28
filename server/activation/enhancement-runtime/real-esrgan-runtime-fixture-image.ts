import type { RealEsrganRuntimeFixturePlan } from './real-esrgan-runtime-types'

export function buildRealEsrganRuntimeFixturePlan(): RealEsrganRuntimeFixturePlan {
  return {
    generatedOnly: true,
    width: 128,
    height: 128,
    expectedOutputWidth: 512,
    expectedOutputHeight: 512,
    scale: 4,
    format: 'png',
    description: 'Synthetic 128x128 PNG generated in-container with gradients, edges, small default-font text, shapes, and detail patterns.',
    blockers: [],
    warnings: ['The fixture is synthetic; Phase 34C makes no quality claim for real video or real frames.'],
  }
}
