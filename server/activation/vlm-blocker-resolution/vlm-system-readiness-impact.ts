import type { VlmExclusionPolicy, VlmSystemReadinessImpact } from './vlm-blocker-resolution-types'

export function buildVlmSystemReadinessImpact(exclusionPolicy: VlmExclusionPolicy): VlmSystemReadinessImpact {
  return {
    phase47CReadiness: 'ready_for_system_level_internal_testing_gate_preparation_without_vlm',
    systemLevelInternalTestingMayProceedWithoutVlm: true,
    trackAStatus: 'ready',
    trackBStatus: 'partial_without_vlm',
    remainingBlockers: [
      'VLM remains excluded from initial internal testing and cannot be enabled until a later approved VLM model/runtime/hardware path passes generated-fixture QA.',
      'Demucs remains separately blocked pending approved pretrained-model license/provenance evidence.',
    ],
    notes: [
      'Track A readiness from Phase 45F and Phase 47A is preserved.',
      'Completed Track B audio/OCR evidence is preserved.',
      `VLM user-facing and runtime enablement remain ${exclusionPolicy.vlmUserFacingEnabled ? 'enabled' : 'disabled'}.`,
      'Phase 47C may prepare a system-level internal testing gate only with VLM out of scope.',
    ],
  }
}
