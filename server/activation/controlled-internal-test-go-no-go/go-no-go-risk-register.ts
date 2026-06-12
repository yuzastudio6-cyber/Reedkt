import { buildSystemRiskRegister } from '../system-readiness-reconciliation'
import type { GoNoGoExposureRecord } from './controlled-internal-test-go-no-go-types'

export function buildGoNoGoExposureRegister(): GoNoGoExposureRecord[] {
  return [
    ...buildSystemRiskRegister().map((risk) => ({ ...risk, phase52GOwnerDispatchRequired: true })),
    {
      riskId: 'owner_response_intake_drift',
      category: 'ownership_conflict',
      severity: 'medium',
      currentStatus: 'Owner prompts are generated but owner responses have not yet been collected.',
      mitigation: 'Phase 52H should track owner responses or pause for owners.',
      owner: 'shared system readiness owner',
      nextAction: 'Phase 52H cross-workstream handoff tracking.',
      phase52GOwnerDispatchRequired: true,
    },
  ]
}
