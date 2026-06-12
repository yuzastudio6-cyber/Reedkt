export type SupabaseStagingResetExecutionStatus = 'passed' | 'blocked' | 'skipped' | 'planned'

export type SupabaseStagingResetExecutionBlocker =
  | 'source_of_truth_ownership_audit_failed'
  | 'pr252_reset_approval_missing'
  | 'pr252_data_impact_not_reviewed'
  | 'pr252_backup_plan_not_acceptable'
  | 'pr252_owner_acceptance_missing'
  | 'approved_staging_target_reference_missing'
  | 'supabase_plugin_staging_target_check_not_confirmed'
  | 'supabase_plugin_target_not_confirmed_as_staging'
  | 'staging_reset_execute_not_confirmed'
  | 'staging_db_reset_not_confirmed'
  | 'staging_owner_data_loss_acceptance_not_confirmed'
  | 'staging_backup_snapshot_packet_not_confirmed'
  | 'staging_schema_mutation_not_confirmed'
  | 'staging_schema_readonly_inspection_not_confirmed'
  | 'temp_cli_exec_not_confirmed'
  | 'staging_backup_export_not_confirmed'
  | 'staging_backup_private_destination_missing'
  | 'staging_db_url_secret_reference_missing'
  | 'staging_db_url_secret_payload_access_denied'
  | 'staging_db_url_secret_payload_invalid'
  | 'staging_db_url_target_ref_missing'
  | 'staging_db_url_target_ref_mismatch'
  | 'staging_db_url_target_unparseable'
  | 'temp_npm_exec_supabase_cli_unavailable'
  | 'reset_command_plan_preview_failed'
  | 'reset_command_plan_missing_no_seed'
  | 'staging_backup_export_failed'
  | 'staging_reset_failed'
  | 'staging_post_reset_migration_history_verify_failed'
  | 'staging_post_reset_schema_rls_verify_failed'
  | 'psql_unavailable_for_post_reset_verify'
  | 'readonly_schema_rls_query_failed'
  | 'trackb_backfill_preflight_after_reset_blocked'
  | 'forbidden_confirmation_set'

export type SupabaseStagingResetExecutionStrategy = 'temp_npm_exec_supabase_cli' | 'blocked'

export interface SupabaseStagingResetCommandSummary {
  status: SupabaseStagingResetExecutionStatus
  command: string
  args: string[]
  cwd: string
  exitCode: number | null
  stdoutSummary: {
    byteLength: number
    lineCount: number
    secretPatternDetected: boolean
  }
  stderrSummary: {
    byteLength: number
    lineCount: number
    secretPatternDetected: boolean
  }
  errorCategory?: string
}
