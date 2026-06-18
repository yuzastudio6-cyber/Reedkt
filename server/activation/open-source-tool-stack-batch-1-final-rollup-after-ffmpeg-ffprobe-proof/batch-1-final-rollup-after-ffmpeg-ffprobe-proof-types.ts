export type Batch1FinalRollupDecision =
  | 'open_source_tool_stack_batch1_final_rollup_passed_media_processing_still_blocked_ready_for_batch2_planning'
  | 'blocked_pending_batch1_evidence_revalidation'
  | 'blocked_pending_accepted_tools_matrix_review'
  | 'blocked_pending_still_blocked_scope_review'
  | 'blocked_pending_internal_beta_impact_review'
  | 'blocked_pending_batch2_planning_handoff'
  | 'rejected_due_runtime_safety_risk'

export type RollupStatus = 'accepted' | 'blocked' | 'rejected'

export type Batch1FinalRollupReport = {
  schema: string
  generatedAt: string
  status: RollupStatus
  accepted: boolean
  warnings: string[]
  blockers: string[]
  details: Record<string, unknown>
}

export type Batch1FinalRollupReports = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Batch1FinalRollupReport
  acceptedToolsMatrix: Batch1FinalRollupReport
  stillBlockedScopeMatrix: Batch1FinalRollupReport
  internalBetaImpactReview: Batch1FinalRollupReport
  batch2PlanningHandoff: Batch1FinalRollupReport
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
