import type { RealEsrganPolicyCommandPlan } from './real-esrgan-policy-decision-types'

export const realEsrganPolicyDecision = {
  phase: '34E',
  status: 'policy_complete / broader_execution_blocked',
  fullFrameEnhancementAllowed: false,
  fullVideoEnhancementAllowed: false,
  blindFullVideoEnhancementAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
  humanVisualReviewRequired: true,
  humanVisualReviewCompleted: false,
  realEsrganAdditionalBoundedSamplePlanningAllowed: true,
  nextPhase: 'Phase 35A SAM2 model approval workflow',
} as const

export const realEsrganPolicyCommandPlans: RealEsrganPolicyCommandPlan[] = [
  {
    commandId: 'phase34e-human-review-record',
    status: 'text_only',
    description: 'Record human review requirements for the existing private Phase 34D before/after sample.',
    commandString: 'TEXT_ONLY manual review record; no shell command.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: true,
  },
  {
    commandId: 'future-additional-bounded-sample-plan',
    status: 'blocked_future_phase',
    description: 'Future approval packet for one additional bounded Real-ESRGAN sample.',
    commandString: 'TEXT_ONLY future approval packet; no shell command.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    blockedReason: 'Phase 34E is policy/review only and does not execute another sample.',
  },
  {
    commandId: 'future-short-frame-sequence-plan',
    status: 'blocked_future_phase',
    description: 'Future approval packet for a selected short frame-sample sequence with temporal QA.',
    commandString: 'TEXT_ONLY future approval packet; no shell command.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    blockedReason: 'Temporal enhancement testing requires a later explicit approval phase.',
  },
]
