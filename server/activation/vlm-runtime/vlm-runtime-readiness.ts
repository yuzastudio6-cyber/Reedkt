import type { ApprovedVlmRuntimeEvidence } from './vlm-runtime-types'

export function buildVlmRuntimeReadiness(evidence: ApprovedVlmRuntimeEvidence) {
  const ready = evidence.status === 'verified' && evidence.blockers.length === 0
  return {
    phase39CStatus: ready ? 'passed_generated_vlm_runtime_verification' : 'blocked_generated_vlm_runtime_incomplete',
    phase39DReadyForControlledRealFrameVlm: ready,
    vlmToolFamilyBetaStatus: evidence.vlmToolFamilyBetaStatus,
    reason: ready
      ? 'Phase 39C verified generated synthetic Qwen3-VL/vLLM runtime from private Phase 39B assets only.'
      : `Phase 39C generated VLM runtime verification is incomplete: ${evidence.blockers.join('; ') || 'no verified runtime evidence yet'}.`,
    blockers: ready ? [] : evidence.blockers,
    stillBlocked: [
      'Controlled real-frame VLM remains blocked until Phase 39D.',
      'VLM planning integration remains blocked until Phase 39E.',
      'Provider calls, raw prompts, public output, beta, production, broad media, arbitrary media, unapproved GPU types, Docker push outside the guarded staging path, Cloud Run deploy outside the staging job, and Track A remain blocked.',
    ],
  }
}
