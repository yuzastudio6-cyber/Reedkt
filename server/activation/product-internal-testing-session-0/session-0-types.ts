export type ProductInternalTestingSession0Decision =
  | 'restricted_internal_testing_session_0_passed'
  | 'blocked_pending_session_0_issue_review'
  | 'blocked_pending_scope_violation_review'
  | 'blocked_pending_stop_condition_review'
  | 'blocked_pending_security_review'
  | 'rejected_due_critical_internal_testing_violation'

export interface ProductInternalTestingSession0Reports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  scopeValidation: Record<string, unknown>
  reviewChecklist: Record<string, unknown>
  trackBReadinessReview: Record<string, unknown>
  issueIntakeReport: Record<string, unknown>
  stopConditionCheck: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
