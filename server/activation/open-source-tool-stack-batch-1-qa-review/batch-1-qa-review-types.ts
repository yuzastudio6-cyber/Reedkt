export type Batch1QaDecision =
  | 'open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review'
  | 'open_source_tool_stack_batch_1_qa_passed_ready_for_batch_2_approval'
  | 'blocked_pending_batch_1_execution_evidence_review'
  | 'blocked_pending_missing_optional_tool_install_review'
  | 'blocked_pending_package_lock_integrity_review'
  | 'blocked_pending_internal_beta_relevance_review'
  | 'rejected_due_runtime_safety_risk'

export type Batch1QaReviewReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  pr435ExecutionEvidenceReview: Record<string, unknown>
  passedTargetQualityReview: Record<string, unknown>
  missingOptionalToolImpactReview: Record<string, unknown>
  packageLockIntegrityReview: Record<string, unknown>
  internalBetaRelevanceReview: Record<string, unknown>
  blockedScopeVerification: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
