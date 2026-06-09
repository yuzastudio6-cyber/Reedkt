import {
  executeSupabaseStagingResetExecutionVerify,
  readSupabaseStagingResetExecutionSummary,
} from '../activation/supabase-staging-reset-execution'

const result = await executeSupabaseStagingResetExecutionVerify()
console.log(JSON.stringify(await readSupabaseStagingResetExecutionSummary(), null, 2))
process.exit(result.exitCode)
