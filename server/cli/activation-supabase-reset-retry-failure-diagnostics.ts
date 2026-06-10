import {
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_CONFIRMATION,
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_MIGRATION_AUDIT_CONFIRMATION,
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_READONLY_CONFIRMATION,
  executeSupabaseResetRetryFailureDiagnostics,
  readSupabaseResetRetryFailureDiagnosticsSummary,
} from '../activation/supabase-reset-retry-failure-diagnostics'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'supabase_reset_retry_failure_diagnostics_requires_execute_flag',
    safeExecutionModes: ['--readonly'],
    requiredConfirmations: [
      SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_CONFIRMATION,
      SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_READONLY_CONFIRMATION,
      SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_MIGRATION_AUDIT_CONFIRMATION,
    ],
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseResetRetryFailureDiagnostics({
  readonlyMode: process.argv.includes('--readonly'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseResetRetryFailureDiagnosticsSummary(), null, 2))
process.exit(result.exitCode)
