import {
  SUPABASE_CLEAN_STAGING_BRANCH_REQUIRED_CONFIRMATIONS,
  executeSupabaseCleanStagingBranchExecution,
  readSupabaseCleanStagingBranchExecutionSummary,
} from '../activation/supabase-clean-staging-branch-execution'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'supabase_clean_staging_branch_execution_requires_execute_flag',
    requiredConfirmations: SUPABASE_CLEAN_STAGING_BRANCH_REQUIRED_CONFIRMATIONS,
    branchOrProjectCreation: false,
    sqlExecuted: false,
    migrationDeployed: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseCleanStagingBranchExecution({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseCleanStagingBranchExecutionSummary(), null, 2))
process.exit(result.exitCode)
