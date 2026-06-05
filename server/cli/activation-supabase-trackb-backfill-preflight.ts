import { buildSupabaseTrackBBackfillReports } from '../activation/supabase-trackb-backfill'

const reports = buildSupabaseTrackBBackfillReports()
console.log(JSON.stringify({
  exportValidationReport: reports.exportValidationReport,
  stagingSupabaseBackfillPreflightReport: reports.stagingSupabaseBackfillPreflightReport,
  registrySchemaCheck: reports.registrySchemaCheck,
  registryRlsCheck: reports.registryRlsCheck,
  blockerReport: reports.blockerReport,
}, null, 2))
