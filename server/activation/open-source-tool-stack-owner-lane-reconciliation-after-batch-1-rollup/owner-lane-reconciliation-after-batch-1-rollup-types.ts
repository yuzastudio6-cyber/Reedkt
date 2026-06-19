export type OwnerLaneReconciliationDecision =
  | 'owner_lane_reconciliation_passed_ready_for_ai_graphics_worker_reconciliation'
  | 'owner_lane_reconciliation_passed_ready_for_sound_oss_reconciliation'
  | 'owner_lane_reconciliation_passed_ready_for_tracka_private_e2e_reconciliation'
  | 'owner_lane_reconciliation_passed_ready_for_e2e_validation_blocker_resolution'
  | 'owner_lane_reconciliation_passed_ready_for_batch2_install_proof_approval'
  | 'owner_lane_reconciliation_passed_ready_for_product_internal_beta_readiness_aggregation'
  | 'owner_lane_reconciliation_passed_ready_for_staged_owner_merge_plan'
  | 'blocked_pending_owner_lane_source_review'
  | 'blocked_pending_ai_graphics_draft_chain_resolution'
  | 'blocked_pending_e2e_validation_queue_resolution'
  | 'blocked_pending_tracka_runtime_gate_source_review'
  | 'rejected_due_runtime_safety_risk'

export type OwnerLaneReport = {
  schema: string
  generatedAt: string
  status: 'accepted' | 'blocked' | 'rejected'
  accepted: boolean
  warnings: string[]
  blockers: string[]
  details: Record<string, unknown>
}

export type OwnerLaneArtifacts = {
  sourceOfTruthAudit: Record<string, unknown>
  ownerLaneStatusMatrix: OwnerLaneReport
  aiGraphicsWorkerReview: OwnerLaneReport
  soundOssReview: OwnerLaneReport
  trackaPrivateE2eReview: OwnerLaneReport
  e2eValidationReview: OwnerLaneReport
  reconciledToolCountSummary: OwnerLaneReport
  recommendedNextPath: OwnerLaneReport
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
