import {
  SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR,
  buildSupabaseStagingResetApprovalReports,
  writeSupabaseStagingResetApprovalArtifacts,
} from '../activation/supabase-staging-reset-approval'

const reports = buildSupabaseStagingResetApprovalReports()
await writeSupabaseStagingResetApprovalArtifacts(reports)

console.log(JSON.stringify({
  status: 'passed',
  reportDir: SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR,
  reportsWritten: true,
  decision: reports.approvalDecision.decision,
  dataImpact: reports.dataImpactReview.status,
  backupSnapshot: reports.backupSnapshotPlan.status,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
