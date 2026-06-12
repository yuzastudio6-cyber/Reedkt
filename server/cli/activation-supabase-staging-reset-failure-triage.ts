import {
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_CONFIRMATION,
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_MIGRATION_AUDIT_CONFIRMATION,
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_READONLY_CONFIRMATION,
  executeSupabaseStagingResetFailureTriage,
  readSupabaseStagingResetFailureTriageSummary,
} from '../activation/supabase-staging-reset-failure-triage'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_reset_failure_triage_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_STAGING_RESET_FAILURE_TRIAGE_CONFIRMATION,
      SUPABASE_STAGING_RESET_FAILURE_TRIAGE_READONLY_CONFIRMATION,
      SUPABASE_STAGING_RESET_FAILURE_TRIAGE_MIGRATION_AUDIT_CONFIRMATION,
    ],
    safeExecutionModes: ['--readonly'],
    resetRetryRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingResetFailureTriage({
  readonlyMode: process.argv.includes('--readonly'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseStagingResetFailureTriageSummary(), null, 2))
process.exit(result.exitCode)
