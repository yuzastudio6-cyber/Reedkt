import {
  SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW_CONFIRMATION,
  SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_CONFIRMATION,
  executeSupabaseCleanStagingTargetApproval,
  readSupabaseCleanStagingTargetApprovalSummary,
} from '../activation/supabase-clean-staging-target-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'supabase_clean_staging_target_approval_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_CONFIRMATION,
      SUPABASE_CLEAN_STAGING_REPLACEMENT_REVIEW_CONFIRMATION,
    ],
    branchOrProjectCreated: false,
    sqlExecuted: false,
    migrationDeployed: false,
    migrationRepairRun: false,
    trackBBackfillRowsWritten: false,
    supportTicketSubmitted: false,
    productionAffected: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseCleanStagingTargetApproval({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseCleanStagingTargetApprovalSummary(), null, 2))
process.exit(result.exitCode)
