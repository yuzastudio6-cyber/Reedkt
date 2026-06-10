import {
  SUPABASE_STAGING_RESET_RETRY_APPROVAL_CONFIRMATION,
  SUPABASE_STAGING_RESET_RETRY_OPERATOR_REVIEW_CONFIRMATION,
  executeSupabaseStagingResetRetryApproval,
  readSupabaseStagingResetRetryApprovalSummary,
} from '../activation/supabase-staging-reset-retry-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_reset_retry_approval_packet_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_STAGING_RESET_RETRY_APPROVAL_CONFIRMATION,
      SUPABASE_STAGING_RESET_RETRY_OPERATOR_REVIEW_CONFIRMATION,
    ],
    resetRetryRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingResetRetryApproval({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseStagingResetRetryApprovalSummary(), null, 2))
process.exit(result.exitCode)
