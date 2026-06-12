import {
  executeSupabaseStagingResetRetryExecutionVerify,
  readSupabaseStagingResetRetryExecutionSummary,
} from '../activation/supabase-staging-reset-retry-execution'

const result = await executeSupabaseStagingResetRetryExecutionVerify()
console.log(JSON.stringify(await readSupabaseStagingResetRetryExecutionSummary(), null, 2))
process.exit(result.exitCode)
