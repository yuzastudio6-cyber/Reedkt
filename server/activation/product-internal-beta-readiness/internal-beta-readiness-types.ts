export type ProductInternalBetaReadinessDecision =
  | 'restricted_internal_testing_candidate'
  | 'blocked_pending_scope_freeze'
  | 'blocked_pending_owner_review'
  | 'blocked_pending_support_runbook'
  | 'blocked_pending_security_review'
  | 'rejected_due_unresolved_critical_blockers'

export interface ProductInternalBetaReadinessReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  trackBCleanStagingSyncVerification: Record<string, unknown>
  workstreamInventory: Record<string, unknown>
  restrictedInternalTestingScope: Record<string, unknown>
  blockerInventory: Record<string, unknown>
  ownerMap: Record<string, unknown>
  goNoGoDecision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  summary: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
