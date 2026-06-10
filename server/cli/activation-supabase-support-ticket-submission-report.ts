import {
  SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR,
  buildSupabaseSupportTicketSubmissionReports,
  writeSupabaseSupportTicketSubmissionArtifacts,
} from '../activation/supabase-support-ticket-submission'

const reports = buildSupabaseSupportTicketSubmissionReports()
await writeSupabaseSupportTicketSubmissionArtifacts(reports)

console.log(JSON.stringify({
  status: reports.readinessReport.status,
  reportDir: SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR,
  decision: reports.submissionReadiness.decision,
  submissionMode: reports.submissionReadiness.submissionMode,
  redactionValidation: reports.redactionValidation.status,
  supportTicketSubmitted: false,
  ticketReference: null,
  cliCreateTicketRun: false,
  debugResetRun: false,
  resetRetryRun: false,
  dbPushRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  blockers: reports.blockerReport.activeBlockers,
}, null, 2))
