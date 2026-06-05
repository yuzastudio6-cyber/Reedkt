import { buildSupabaseTrackBBackfillReports } from '../activation/supabase-trackb-backfill'

const reports = buildSupabaseTrackBBackfillReports()
console.log(JSON.stringify(reports.diffReport, null, 2))
