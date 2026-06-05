import {
  SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
  writeSupabaseTrackBBackfillArtifacts,
} from '../activation/supabase-trackb-backfill'

await writeSupabaseTrackBBackfillArtifacts()

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_TRACKB_BACKFILL_REPORT_DIR,
  reportsWritten: true,
}, null, 2))
