export type SupabaseStagingResetRetryExecutionStatus =
  | 'passed'
  | 'blocked'
  | 'skipped'
  | 'planned'

export type SupabaseStagingResetRetryExecutionBlocker =
  | 'pr265_retry_approval_missing'
  | 'pr265_retry_command_review_not_passed'
  | 'pr265_retry_backup_review_not_passed'
  | 'staging_reset_retry_execute_not_confirmed'
  | 'staging_reset_retry_backup_export_not_confirmed'
  | 'staging_reset_retry_failed'
  | 'staging_reset_retry_post_verify_failed'
  | 'staging_reset_retry_schema_rls_verify_failed'
  | 'staging_reset_retry_trackb_preflight_blocked'
  | 'base_reset_execution_gate_blocked'
  | 'forbidden_confirmation_set'
