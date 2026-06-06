import { resolveSystemEvidenceContext } from '../system-readiness-reconciliation'
import type { GoNoGoEvidenceContext, GoNoGoSourceAudit } from './controlled-internal-test-go-no-go-types'
import type { SystemRepoOwnershipAudit } from '../system-readiness-reconciliation'

export function resolveGoNoGoEvidenceContext(repoOwnershipAudit: GoNoGoSourceAudit): GoNoGoEvidenceContext {
  const baseContext = resolveSystemEvidenceContext(repoOwnershipAudit as unknown as SystemRepoOwnershipAudit)
  return {
    evidenceId: 'phase52g_go_no_go_evidence_context',
    phase52FRunId: 'phase52f-20260605T185559',
    phase52FStatus: 'completed',
    phase52FQa: 'passed',
    phase52FSupabaseSync: 'completed',
    phase52GReadinessFromPhase52F: 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch',
    baseContext,
    contextFlags: {
      ...baseContext.contextFlags,
      phase52FCompleted: true,
      phase52GIsCoordinationOnly: true,
    },
    blockers: [...repoOwnershipAudit.blockers, ...baseContext.blockers],
    warnings: [
      ...repoOwnershipAudit.warnings,
      ...baseContext.warnings,
      'Phase 52G uses Phase 52F artifacts and committed evidence only; no runtime probes are executed.',
    ],
  }
}
