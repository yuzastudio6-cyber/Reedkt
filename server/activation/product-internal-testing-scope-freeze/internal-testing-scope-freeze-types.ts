export type ProductInternalTestingScopeFreezeDecision =
  | 'approved_for_future_restricted_internal_testing_launch_rehearsal'
  | 'blocked_pending_operator_signoff'
  | 'blocked_pending_scope_review'
  | 'blocked_pending_support_runbook'
  | 'blocked_pending_security_review'
  | 'rejected_due_unresolved_critical_blockers'

export interface ProductInternalTestingScopeFreezeReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  allowedScopeFreeze: Record<string, unknown>
  blockedScopeFreeze: Record<string, unknown>
  operatorSignoffPacket: Record<string, unknown>
  runbookChecklist: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
