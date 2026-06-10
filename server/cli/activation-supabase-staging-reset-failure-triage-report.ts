import {
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
  buildSupabaseStagingResetFailureTriageReports,
  writeSupabaseStagingResetFailureTriageArtifacts,
} from '../activation/supabase-staging-reset-failure-triage'

const reports = buildSupabaseStagingResetFailureTriageReports()
await writeSupabaseStagingResetFailureTriageArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
  decision: reports.recoveryDecision.decision,
  partialResetRisk: reports.partialResetRisk.riskLevel,
  resetRetryRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
