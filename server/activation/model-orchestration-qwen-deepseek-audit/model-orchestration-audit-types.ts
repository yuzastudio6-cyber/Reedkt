export type ModelOrchestrationAuditDecision =
  | 'repo_audit_passed_ready_for_dry_run_approval'
  | 'blocked_pending_official_model_verification'
  | 'blocked_pending_provider_gateway_contract'
  | 'blocked_pending_secret_policy_review'
  | 'blocked_pending_cost_review'
  | 'blocked_pending_plan_snapshot_contract'

export interface ModelOrchestrationAuditReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  auditPlan: Record<string, unknown>
  providerOfficialEvidenceInventory: Record<string, unknown>
  secretReferenceInventory: Record<string, unknown>
  providerContractInventory: Record<string, unknown>
  agentBrainArchitectureRecommendation: Record<string, unknown>
  rawPromptWorkerExecutionBlockerPolicy: Record<string, unknown>
  riskBlockerInventory: Record<string, unknown>
  nextPhaseRecommendation: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
