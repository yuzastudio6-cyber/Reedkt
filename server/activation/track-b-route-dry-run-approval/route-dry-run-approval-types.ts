export type RouteDryRunApprovalDecision =
  | 'approved_for_future_noop_route_dry_run'
  | 'approved_for_future_metadata_only_route_dry_run'
  | 'blocked_pending_human_review'
  | 'blocked_pending_artifact_scope_approval'
  | 'blocked_pending_security_review'
  | 'rejected_for_current_scope'

export interface TrackBRouteDryRunApprovalReports {
  plan: Record<string, unknown>
  priorEvidenceInventory: Record<string, unknown>
  inputManifest: Record<string, unknown>
  candidateRegistry: Record<string, unknown>
  approvalCriteria: Record<string, unknown>
  planSnapshot: Record<string, unknown>
  artifactScope: Record<string, unknown>
  securityReview: Record<string, unknown>
  operatorChecklist: Record<string, unknown>
  rollbackPolicy: Record<string, unknown>
  approvalDecision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
