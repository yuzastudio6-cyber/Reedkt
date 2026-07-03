export type Batch2PlanningDecision =
  | 'open_source_tool_stack_batch2_planning_passed_ready_for_batch2_install_proof_approval'
  | 'open_source_tool_stack_batch2_planning_passed_ready_for_owner_lane_reconciliation'
  | 'open_source_tool_stack_batch2_planning_passed_ready_for_internal_beta_readiness_aggregation'
  | 'open_source_tool_stack_batch2_planning_passed_ready_for_e2e_validation_blocker_resolution'
  | 'open_source_tool_stack_batch2_planning_passed_ready_for_ai_graphics_worker_reconciliation'
  | 'open_source_tool_stack_batch2_planning_passed_ready_for_sound_oss_reconciliation'
  | 'blocked_pending_candidate_inventory_integrity'
  | 'blocked_pending_owner_lane_source_review'
  | 'blocked_pending_e2e_validation_queue_review'
  | 'rejected_due_runtime_safety_risk'

export type Batch2CandidateStatus =
  | 'include'
  | 'owner_reconcile'
  | 'defer'
  | 'blocked'
  | 'provider_lane'
  | 'runtime_lane'

export type Batch2PlanningReport = {
  schema: string
  generatedAt: string
  status: 'accepted' | 'blocked' | 'rejected'
  accepted: boolean
  warnings: string[]
  blockers: string[]
  details: Record<string, unknown>
}

export type Batch2PlanningArtifacts = {
  sourceOfTruthAudit: Record<string, unknown>
  batch1ClosureSnapshot: Batch2PlanningReport
  batch2CandidateInventory: Batch2PlanningReport
  ownerLaneReconciliationMap: Batch2PlanningReport
  recommendedCandidateSet: Batch2PlanningReport
  internalBetaReadinessImplication: Batch2PlanningReport
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
