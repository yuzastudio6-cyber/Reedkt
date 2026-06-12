export type ModelOrchestrationDryRunApprovalDecision =
  | 'approved_for_future_qwen_deepseek_provider_dry_run'
  | 'blocked_pending_model_alias_review'
  | 'blocked_pending_provider_gateway_contract'
  | 'blocked_pending_secret_policy_review'
  | 'blocked_pending_cost_review'
  | 'blocked_pending_schema_contract_review'
  | 'blocked_pending_raw_prompt_safety_review'
  | 'rejected_due_provider_execution_risk'

export interface ModelOrchestrationDryRunApprovalReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  approvalPlan: Record<string, unknown>
  providerCandidateReview: Record<string, unknown>
  syntheticCases: Record<string, unknown>
  outputSchemaContracts: Record<string, unknown>
  costGuardrails: Record<string, unknown>
  auditRedactionPolicy: Record<string, unknown>
  failClosedPolicy: Record<string, unknown>
  approvalDecision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
