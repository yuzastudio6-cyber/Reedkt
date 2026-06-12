import {
  SUPABASE_MANUAL_SUPPORT_TICKET_SUBMISSION_CONFIRMATION,
  SUPABASE_SUPPORT_PORTAL_ACCESS_CONFIRMATION,
  SUPABASE_SUPPORT_TICKET_REDACTION_REVIEW_CONFIRMATION,
  executeSupabaseSupportTicketSubmission,
  readSupabaseSupportTicketSubmissionSummary,
} from '../activation/supabase-support-ticket-submission'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'supabase_support_ticket_submission_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_MANUAL_SUPPORT_TICKET_SUBMISSION_CONFIRMATION,
      SUPABASE_SUPPORT_TICKET_REDACTION_REVIEW_CONFIRMATION,
    ],
    optionalPortalConfirmation: SUPABASE_SUPPORT_PORTAL_ACCESS_CONFIRMATION,
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    debugResetRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseSupportTicketSubmission({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseSupportTicketSubmissionSummary(), null, 2))
process.exit(result.exitCode)
