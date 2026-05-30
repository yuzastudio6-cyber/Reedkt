import type { AudioSystemRisk } from './audio-system-readiness-types'

export const audioSystemRiskRegister: AudioSystemRisk[] = [
  {
    riskId: 'subjective_listening_review',
    severity: 'warning',
    mitigation: 'Require human listening review before broader internal audio review.',
    currentStatus: 'warning_only_after_private_metrics_pass',
  },
  {
    riskId: 'arbitrary_media_scope',
    severity: 'blocker',
    mitigation: 'Keep Phase 36F locked to the approved Phase 32 chain only.',
    currentStatus: 'blocked_outside_approved_chain',
  },
  {
    riskId: 'fallback_overreach',
    severity: 'blocker',
    mitigation: 'Fallback may use FFmpeg loudness-only normalization when safe, never RNNoise, Demucs, or providers automatically.',
    currentStatus: 'blocked_for_unapproved_fallback_tools',
  },
  {
    riskId: 'external_beta_confusion',
    severity: 'blocker',
    mitigation: 'Expose Phase 36F readiness as internal audio feature testing only.',
    currentStatus: 'external_beta_and_paid_production_blocked',
  },
]
