import {
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
  buildSupabaseResetRetryFailureDiagnosticsReports,
  writeSupabaseResetRetryFailureDiagnosticsArtifacts,
} from '../activation/supabase-reset-retry-failure-diagnostics'

const reports = buildSupabaseResetRetryFailureDiagnosticsReports()
await writeSupabaseResetRetryFailureDiagnosticsArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
  decision: reports.recoveryDecision.decision,
  postFailureStateClassifier: reports.postFailureState.stateClassifier,
  cliFailureClassification: reports.cliFailureAnalysis.failureClassification,
  resetRetryRun: false,
  dbPushRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
