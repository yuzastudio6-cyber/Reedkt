import {
  SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
  buildSupabaseStagingResetRetryApprovalReports,
  writeSupabaseStagingResetRetryApprovalArtifacts,
} from '../activation/supabase-staging-reset-retry-approval'

const reports = buildSupabaseStagingResetRetryApprovalReports()
await writeSupabaseStagingResetRetryApprovalArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
  reportsWritten: true,
  decision: reports.approvalDecision.decision,
  commandReview: reports.commandReview.status,
  backupReview: reports.backupReview.status,
  resetRetryRun: false,
  schemaDeployRun: false,
  migrationRepairRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
