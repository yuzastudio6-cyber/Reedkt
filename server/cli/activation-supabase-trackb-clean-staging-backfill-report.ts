import {
  SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
  writeSupabaseTrackBCleanStagingBackfillArtifacts,
} from '../activation/supabase-trackb-backfill'

await writeSupabaseTrackBCleanStagingBackfillArtifacts()

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL_REPORT_DIR,
  reportsWritten: true,
}, null, 2))
