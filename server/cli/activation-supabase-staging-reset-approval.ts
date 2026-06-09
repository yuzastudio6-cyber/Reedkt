import {
  SUPABASE_STAGING_RESET_APPROVAL_CONFIRMATION,
  SUPABASE_STAGING_RESET_RISK_REVIEW_CONFIRMATION,
  executeSupabaseStagingResetApproval,
  readSupabaseStagingResetApprovalSummary,
} from '../activation/supabase-staging-reset-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'staging_reset_approval_packet_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_STAGING_RESET_APPROVAL_CONFIRMATION,
      SUPABASE_STAGING_RESET_RISK_REVIEW_CONFIRMATION,
    ],
    stagingResetRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRun: false,
    productionAffected: false,
    directDdlDmlRun: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseStagingResetApproval({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseStagingResetApprovalSummary(), null, 2))
process.exit(result.exitCode)
