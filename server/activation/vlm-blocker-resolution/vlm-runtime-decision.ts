import type { VlmRuntimeDecision } from './vlm-blocker-resolution-types'

export function buildVlmRuntimeDecision(): VlmRuntimeDecision {
  return {
    decision: 'vlm_excluded_from_initial_internal_testing',
    runtimeFixAttempted: false,
    runtimeFixResult: 'not_attempted_out_of_scope',
    reason:
      'Phase 47B formally excludes VLM from initial internal system testing instead of retrying runtime because Phase 39C already exhausted safe approved L4/vLLM profiles for the approved Qwen3-VL 8B artifact and failed before generated fixture inference.',
    forbiddenRequiredChanges: [
      'new smaller or quantized VLM model download/approval',
      'larger or different GPU class approval',
      'provider API fallback',
      'broad or arbitrary media processing',
      'unsafe runtime setting that bypasses no-download/no-provider/no-public-output policy',
      'claiming VLM ready without actual generated-fixture QA',
    ],
  }
}
