export type ModelOrchestrationPlanSnapshotContractDecision =
  | 'plan_snapshot_contract_passed_ready_for_dry_run_validation'
  | 'blocked_pending_provider_dry_run_evidence'
  | 'blocked_pending_schema_contract_fix'
  | 'blocked_pending_worker_handoff_policy'
  | 'blocked_pending_raw_prompt_safety_review'
  | 'blocked_pending_artifact_scope_policy'
  | 'blocked_pending_supabase_source_of_truth_policy'
  | 'rejected_due_execution_safety_risk'

export interface ModelOrchestrationPlanSnapshotContractReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  contractPlan: Record<string, unknown>
  providerEvidenceReconciliation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  agentFindingsSchema: Record<string, unknown>
  editIntentsSchema: Record<string, unknown>
  planSnapshotCandidateSchema: Record<string, unknown>
  approvedPlanSnapshotSchema: Record<string, unknown>
  approvalHandoffPolicy: Record<string, unknown>
  fixtures: Record<string, unknown>
  validationReport: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
