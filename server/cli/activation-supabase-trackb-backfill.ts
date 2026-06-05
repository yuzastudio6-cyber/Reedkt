import {
  SUPABASE_TRACKB_BACKFILL_REQUIRED_CONFIRMATIONS,
  executeSupabaseTrackBBackfill,
  readSupabaseTrackBBackfillSummary,
} from '../activation/supabase-trackb-backfill'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_current_shell_confirmations',
    requiredConfirmations: SUPABASE_TRACKB_BACKFILL_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseTrackBBackfill({
  staging: process.argv.includes('--staging'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseTrackBBackfillSummary(), null, 2))
process.exit(result.exitCode)
