import { readSupabaseStagingResetExecutionSummary } from '../activation/supabase-staging-reset-execution'

console.log(JSON.stringify(await readSupabaseStagingResetExecutionSummary(), null, 2))
