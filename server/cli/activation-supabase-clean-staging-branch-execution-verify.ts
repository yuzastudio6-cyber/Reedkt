import {
  executeSupabaseCleanStagingBranchExecutionVerify,
  readSupabaseCleanStagingBranchExecutionSummary,
} from '../activation/supabase-clean-staging-branch-execution'

const result = await executeSupabaseCleanStagingBranchExecutionVerify()
console.log(JSON.stringify(readSupabaseCleanStagingBranchExecutionSummary(), null, 2))
process.exit(result.exitCode)
