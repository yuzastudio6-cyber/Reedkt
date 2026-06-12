import { buildSupabaseTrackBCleanStagingBackfillReports } from '../activation/supabase-trackb-backfill'

const reports = buildSupabaseTrackBCleanStagingBackfillReports()
console.log(JSON.stringify({
  exportValidationReport: reports.exportValidationReport,
  targetPreflightReport: reports.targetPreflightReport,
  mappingReport: reports.mappingReport,
  blockerReport: reports.blockerReport,
}, null, 2))
