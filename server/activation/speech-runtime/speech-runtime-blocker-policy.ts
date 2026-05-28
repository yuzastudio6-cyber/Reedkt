import { validateSpeechRuntimeEnv, validateSpeechRuntimeExecutionReport } from './speech-runtime-policy'
import type { SpeechRuntimeExecutionReport } from './speech-runtime-types'

export function buildSpeechRuntimeBlockers(input: {
  executionReport?: SpeechRuntimeExecutionReport
  env?: Parameters<typeof validateSpeechRuntimeEnv>[0]
}) {
  const blockers = [
    ...validateSpeechRuntimeEnv(input.env ?? {}),
    ...validateSpeechRuntimeExecutionReport(input.executionReport),
  ]
  const warnings = [
    'Phase 27A does not approve production, external beta, or broad real user media testing.',
    'Phase 28 still requires an explicit controlled speech/caption real-video execution phase.',
  ]
  return {
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}
