export type StagingResetApprovalDecision =
  | 'approved_for_future_staging_reset_and_reapply_migrations'
  | 'blocked_pending_human_review'
  | 'blocked_pending_staging_data_impact_review'
  | 'blocked_pending_backup_snapshot_plan'
  | 'blocked_pending_dependency_review'
  | 'blocked_pending_migration_order_review'
  | 'rejected_due_unacceptable_staging_reset_risk'

export type StagingResetApprovalBlocker =
  | 'staging_reset_approval_packet_not_confirmed'
  | 'staging_reset_risk_review_not_confirmed'
  | 'staging_data_impact_not_reviewed'
  | 'staging_backup_snapshot_plan_missing'
  | 'staging_reset_dependency_review_required'
  | 'staging_reset_execution_not_approved'
  | 'migration_order_dry_run_required'
  | 'forbidden_confirmation_set'

export type StagingResetRiskLevel = 'low' | 'medium' | 'high'
