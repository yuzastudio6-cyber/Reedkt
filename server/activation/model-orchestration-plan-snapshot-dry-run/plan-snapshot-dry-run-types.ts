export type ModelOrchestrationPlanSnapshotDryRunDecision =
  | 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit'
  | 'blocked_pending_fixture_validation'
  | 'blocked_pending_schema_contract_fix'
  | 'blocked_pending_approval_gate_fix'
  | 'blocked_pending_raw_prompt_safety_review'
  | 'blocked_pending_worker_handoff_policy'
  | 'rejected_due_execution_safety_risk'

export interface ModelOrchestrationPlanSnapshotDryRunReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  dryRunPlan: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  syntheticFixtures: Record<string, unknown>
  findingsToIntentsValidation: Record<string, unknown>
  intentsToCandidateValidation: Record<string, unknown>
  approvalGateValidation: Record<string, unknown>
  failClosedReport: Record<string, unknown>
  summaryReport: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
