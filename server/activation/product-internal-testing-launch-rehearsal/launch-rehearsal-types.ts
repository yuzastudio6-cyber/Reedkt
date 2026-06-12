export type ProductInternalTestingLaunchRehearsalDecision =
  | 'restricted_internal_testing_launch_rehearsal_passed'
  | 'blocked_pending_rehearsal_scope_review'
  | 'blocked_pending_issue_intake_review'
  | 'blocked_pending_stop_condition_review'
  | 'blocked_pending_support_runbook_review'
  | 'blocked_pending_security_review'
  | 'rejected_due_unresolved_critical_blockers'

export interface ProductInternalTestingLaunchRehearsalReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  scopeSignoffValidation: Record<string, unknown>
  testerFlow: Record<string, unknown>
  issueIntake: Record<string, unknown>
  stopConditions: Record<string, unknown>
  checklist: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
