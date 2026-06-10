import { readSupabaseStagingResetRetryExecutionSummary } from '../activation/supabase-staging-reset-retry-execution'

console.log(JSON.stringify(await readSupabaseStagingResetRetryExecutionSummary(), null, 2))
