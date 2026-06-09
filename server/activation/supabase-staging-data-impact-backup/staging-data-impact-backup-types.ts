export type StagingDataImpactBackupDecision =
  | 'approved_for_future_staging_reset_and_reapply_migrations'
  | 'blocked_pending_backup_snapshot_plan'
  | 'blocked_pending_staging_data_impact_review'
  | 'blocked_pending_human_review'
  | 'blocked_pending_staging_owner_approval'
  | 'rejected_due_unacceptable_staging_reset_risk'

export type StagingDataImpactBackupBlocker =
  | 'staging_data_impact_review_not_confirmed'
  | 'staging_backup_snapshot_approval_packet_not_confirmed'
  | 'staging_schema_readonly_inspection_not_confirmed'
  | 'staging_db_url_unavailable_for_data_impact_review'
  | 'staging_db_url_unparseable'
  | 'staging_db_url_target_ref_mismatch'
  | 'psql_unavailable_for_data_impact_review'
  | 'readonly_staging_data_impact_inspection_failed'
  | 'staging_data_impact_not_reviewed'
  | 'staging_backup_snapshot_plan_missing'
  | 'staging_owner_data_loss_acceptance_missing'
  | 'unacceptable_staging_reset_risk'
  | 'forbidden_confirmation_set'

export type StagingDataImpactRiskLevel = 'low' | 'medium' | 'high'

export interface StagingDataImpactTableEstimate {
  schema: string
  table: string
  kind: string
  estimatedRows: number | null
}
