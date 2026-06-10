import {
  SUPABASE_STAGING_RESET_RETRY_EXECUTION_REQUIRED_CONFIRMATIONS,
  executeSupabaseStagingResetRetryExecution,
  readSupabaseStagingResetRetryExecutionSummary,
} from '../activation/supabase-staging-reset-retry-execution'
import { SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION } from '../activation/supabase-staging-reset-execution'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_reset_retry_execution_requires_execute_flag',
    requiredConfirmations: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REQUIRED_CONFIRMATIONS,
    backupExportConfirmation: SUPABASE_STAGING_RESET_BACKUP_EXPORT_CONFIRMATION,
    resetRetryRun: false,
    migrationRepairRun: false,
    supabaseDbPushRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingResetRetryExecution()
console.log(JSON.stringify(await readSupabaseStagingResetRetryExecutionSummary(), null, 2))
process.exit(result.exitCode)
