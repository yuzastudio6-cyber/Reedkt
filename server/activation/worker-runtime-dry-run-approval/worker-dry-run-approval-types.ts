export type WorkerRuntimeDryRunApprovalDecision =
  | 'approved_for_future_worker_noop_dry_run_execution'
  | 'blocked_pending_plan_snapshot_fixture_review'
  | 'blocked_pending_artifact_scope_guardrails'
  | 'blocked_pending_queue_job_policy'
  | 'blocked_pending_observability_cost_guardrails'
  | 'blocked_pending_execution_blocker_policy'
  | 'rejected_due_worker_execution_safety_risk'

export type WorkerRuntimeDryRunApprovalReports = {
  sourceAudit: Record<string, unknown>
  plan: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  approvedPlanSnapshotFixtures: Record<string, unknown>
  scopePolicy: Record<string, unknown>
  artifactScopeGuardrails: Record<string, unknown>
  queueJobSidecarPolicy: Record<string, unknown>
  observabilityCostFailureGuardrails: Record<string, unknown>
  failClosedPolicy: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
