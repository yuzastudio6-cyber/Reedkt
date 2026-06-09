import {
  SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
  SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS,
  executeSupabaseStagingResetExecution,
  readSupabaseStagingResetExecutionSummary,
} from '../activation/supabase-staging-reset-execution'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_reset_execution_requires_execute_flag',
    requiredConfirmations: SUPABASE_STAGING_RESET_EXECUTION_REQUIRED_CONFIRMATIONS,
    backupExportConfirmation: SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
    resetRun: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingResetExecution({
  keepTemp: process.argv.includes('--keep-temp'),
})
console.log(JSON.stringify(await readSupabaseStagingResetExecutionSummary(), null, 2))
process.exit(result.exitCode)
