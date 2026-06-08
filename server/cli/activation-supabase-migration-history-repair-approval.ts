import {
  SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_CONFIRMATION,
  executeSupabaseMigrationHistoryRepairApproval,
  readSupabaseMigrationHistoryRepairApprovalSummary,
} from '../activation/supabase-migration-history-repair-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'approval_packet_generation_requires_execute_flag_and_current_shell_confirmation',
    requiredConfirmation: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_CONFIRMATION,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseMigrationHistoryRepairApproval({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseMigrationHistoryRepairApprovalSummary(), null, 2))
process.exit(result.exitCode)
