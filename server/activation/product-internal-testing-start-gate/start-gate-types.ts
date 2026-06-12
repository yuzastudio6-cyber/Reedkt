export type ProductInternalTestingStartGateDecision =
  | 'approved_for_restricted_internal_testing_start'
  | 'blocked_pending_rehearsal_evidence'
  | 'blocked_pending_scope_review'
  | 'blocked_pending_issue_intake_review'
  | 'blocked_pending_stop_condition_review'
  | 'blocked_pending_support_runbook_review'
  | 'blocked_pending_security_review'
  | 'rejected_due_unresolved_critical_blockers'

export interface ProductInternalTestingStartGateReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  evidenceValidation: Record<string, unknown>
  startPacket: Record<string, unknown>
  blockedScopeAssertion: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
