import { buildSupabaseTrackBCleanStagingBackfillReports } from '../activation/supabase-trackb-backfill'

const reports = buildSupabaseTrackBCleanStagingBackfillReports()
console.log(JSON.stringify(reports.verificationReport, null, 2))
