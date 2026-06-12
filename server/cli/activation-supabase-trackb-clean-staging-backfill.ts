import {
  SUPABASE_TRACKB_CLEAN_STAGING_REQUIRED_CONFIRMATIONS,
  executeSupabaseTrackBCleanStagingBackfill,
  readSupabaseTrackBCleanStagingBackfillSummary,
} from '../activation/supabase-trackb-backfill'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_current_shell_confirmations',
    requiredConfirmations: SUPABASE_TRACKB_CLEAN_STAGING_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseTrackBCleanStagingBackfill({
  cleanStaging: process.argv.includes('--clean-staging'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseTrackBCleanStagingBackfillSummary(), null, 2))
process.exit(result.exitCode)
