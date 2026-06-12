export type WorkerRuntimeRepoAuditDecision =
  | 'repo_audit_passed_ready_for_worker_dry_run_approval'
  | 'blocked_pending_plan_snapshot_intake_contract'
  | 'blocked_pending_artifact_scope_policy'
  | 'blocked_pending_worker_execution_blocker_policy'
  | 'blocked_pending_observability_cost_contract'
  | 'blocked_pending_source_of_truth_policy'
  | 'rejected_due_execution_safety_risk'

export type WorkerRuntimeRepoAuditReports = {
  sourceAudit: Record<string, unknown>
  plan: Record<string, unknown>
  workerJobQueueInventory: Record<string, unknown>
  approvedPlanSnapshotIntakeReview: Record<string, unknown>
  artifactScopeSourceOfTruthReview: Record<string, unknown>
  workerExecutionBlockerPolicy: Record<string, unknown>
  workerSecretReferenceInventory: Record<string, unknown>
  workerObservabilityCostFailureReview: Record<string, unknown>
  workerRuntimeGapMap: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
