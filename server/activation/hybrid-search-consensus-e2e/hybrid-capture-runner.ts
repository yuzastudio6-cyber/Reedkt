import { runAllowlistedPageCapture } from '../controlled-live-search-capture-e2e'
import type { HybridCaptureTarget } from './hybrid-search-consensus-types'

export async function runHybridAllowlistedCapture(input: {
  target: HybridCaptureTarget
  outputRoot: string
}) {
  return runAllowlistedPageCapture({ target: input.target, outputRoot: input.outputRoot })
}
