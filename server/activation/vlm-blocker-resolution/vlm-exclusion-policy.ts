import type { VlmBlockerEvidence, VlmExclusionPolicy } from './vlm-blocker-resolution-types'

export function buildVlmExclusionPolicy(blockerEvidence: VlmBlockerEvidence): VlmExclusionPolicy {
  return {
    vlmIncludedInInitialInternalTesting: false,
    vlmUserFacingEnabled: false,
    vlmRuntimeEnabled: false,
    vlmFutureScoped: true,
    exclusionReason: blockerEvidence.exactBlocker,
    requiredFutureAction: [
      'Approve and privately stage a smaller or quantized VLM artifact, then run a new generated-fixture runtime gate.',
      'Or approve a larger/different GPU class and rerun generated-fixture runtime with bounded no-download/no-provider controls.',
      'Or redesign vLLM/Qwen structured-output/runtime settings in a later explicit VLM follow-up without weakening safety gates.',
    ],
    providerFallbackAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}
