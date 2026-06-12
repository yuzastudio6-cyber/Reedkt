import {
  SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
  buildSupabaseStagingResetExecutionReports,
  writeSupabaseStagingResetExecutionArtifacts,
} from '../activation/supabase-staging-reset-execution'

const reports = await buildSupabaseStagingResetExecutionReports()
await writeSupabaseStagingResetExecutionArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
  resetRun: reports.executionReport.resetPerformed === true,
  migrationHistoryVerified: reports.postVerifyReport.migrationHistoryVerified === true,
  schemaRlsVerified: reports.schemaRlsVerifyReport.schemaRlsVerified === true,
  blockers: reports.blockerReport.activeBlockers ?? [],
  productionAffected: false,
  trackBBackfillRowsWritten: false,
}, null, 2))
