import type { BiRefNetRuntimeFixturePlan } from './birefnet-runtime-types'

export function buildBiRefNetRuntimeFixturePlan(): BiRefNetRuntimeFixturePlan {
  return {
    generatedOnly: true,
    width: 512,
    height: 512,
    format: 'png',
    description: 'A synthetic generated image with a contrasting foreground silhouette on a clean background; no real user media or real video frames.',
    blockers: [],
    warnings: ['Single-frame fixture cannot validate temporal stability; temporal QA remains not_applicable.'],
  }
}
