import { buildSystemSourceAudit } from '../system-readiness-reconciliation'
import type { GoNoGoSourceAudit } from './controlled-internal-test-go-no-go-types'

export function buildGoNoGoSourceAudit(createdAt = new Date()): GoNoGoSourceAudit {
  const base = buildSystemSourceAudit(createdAt)
  return {
    ...base,
    auditId: 'phase52g_repo_ownership_audit',
    duplicateGoNoGoImplementationDetected: false,
    findings: [
      'Phase 52G is owned by the shared system readiness / cross-workstream coordination layer.',
      'Phase 52G dispatches go/no-go and owner prompts only; it does not execute workstream runtimes.',
      'Absent foundation/cross-chat docs are carried forward as audit gaps and are not inferred.',
    ],
  }
}
