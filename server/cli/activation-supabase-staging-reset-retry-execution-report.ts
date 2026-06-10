import {
  SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR,
  buildSupabaseStagingResetRetryExecutionReports,
  writeSupabaseStagingResetRetryExecutionArtifacts,
} from '../activation/supabase-staging-reset-retry-execution'

const reports = await buildSupabaseStagingResetRetryExecutionReports()
await writeSupabaseStagingResetRetryExecutionArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR,
  resetRetryRun: reports.executionReport.resetPerformed === true,
  migrationHistoryVerified: reports.postVerifyReport.migrationHistoryVerified === true,
  schemaRlsVerified: reports.schemaRlsVerifyReport.schemaRlsVerified === true,
  blockers: reports.blockerReport.activeBlockers ?? [],
  productionAffected: false,
  trackBBackfillRowsWritten: false,
}, null, 2))
