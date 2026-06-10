import {
  SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
  buildSupabaseSupportEscalationApprovalReports,
  writeSupabaseSupportEscalationApprovalArtifacts,
} from '../activation/supabase-support-escalation-approval'

const reports = buildSupabaseSupportEscalationApprovalReports()
await writeSupabaseSupportEscalationApprovalArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
  decision: reports.approvalDecision.decision,
  approvalStatus: reports.approvalDecision.approvalStatus,
  redactionReviewStatus: reports.redactionReview.status,
  recommendedSubmissionOption: reports.submissionOptionMatrix.recommendedOption,
  supportTicketSubmitted: false,
  cliCreateTicketRun: false,
  resetRetryRun: false,
  dbPushRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
