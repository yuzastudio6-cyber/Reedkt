export type StagedOwnerMergePlanDecision =
  | 'staged_owner_merge_plan_passed_ready_for_ai_graphics_worker_source_review'
  | 'staged_owner_merge_plan_passed_ready_for_e2e_validation_pr305_hydration_blocker_resolution'
  | 'staged_owner_merge_plan_passed_ready_for_tracka_private_e2e_source_reconciliation'
  | 'staged_owner_merge_plan_passed_ready_for_sound_oss_source_reconciliation'
  | 'staged_owner_merge_plan_passed_ready_for_product_internal_beta_readiness_aggregation'
  | 'staged_owner_merge_plan_passed_ready_for_batch2_install_proof_approval_after_owner_reconciliation'
  | 'staged_owner_merge_plan_passed_ready_for_merge_hygiene_execution'
  | 'blocked_pending_owner_lane_pr_state_review'
  | 'blocked_pending_duplicate_pr_risk_review'
  | 'blocked_pending_e2e_validation_queue_resolution'
  | 'rejected_due_runtime_safety_risk'

export type StagedOwnerMergeReport = {
  schema: string
  generatedAt: string
  status: 'accepted' | 'blocked' | 'rejected'
  accepted: boolean
  warnings: string[]
  blockers: string[]
  details: Record<string, unknown>
}

export type StagedOwnerMergeArtifacts = {
  sourceAudit: Record<string, unknown>
  stagedOwnerMergePlan: StagedOwnerMergeReport
  ownerPrStackOrder: StagedOwnerMergeReport
  mergeReadinessBlockerMatrix: StagedOwnerMergeReport
  toolCountAndClaimPolicy: StagedOwnerMergeReport
  internalBetaDependencyMap: StagedOwnerMergeReport
  recommendedNextPath: StagedOwnerMergeReport
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
