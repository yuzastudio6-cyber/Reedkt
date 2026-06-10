import {
  SUPABASE_SUPPORT_ESCALATION_APPROVAL_CONFIRMATION,
  SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW_CONFIRMATION,
  executeSupabaseSupportEscalationApproval,
  readSupabaseSupportEscalationApprovalSummary,
} from '../activation/supabase-support-escalation-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'supabase_support_escalation_approval_requires_execute_flag',
    requiredConfirmations: [
      SUPABASE_SUPPORT_ESCALATION_APPROVAL_CONFIRMATION,
      SUPABASE_SUPPORT_PACKET_REDACTION_REVIEW_CONFIRMATION,
    ],
    supportTicketSubmitted: false,
    cliCreateTicketRun: false,
    resetRetryRun: false,
    dbPushRun: false,
    migrationRepairRun: false,
    schemaDeployRun: false,
    trackBBackfillRowsWritten: false,
    productionAffected: false,
    sqlExecuted: false,
    migrationDeployed: false,
  }, null, 2))
  process.exit(0)
}

const result = await executeSupabaseSupportEscalationApproval({
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readSupabaseSupportEscalationApprovalSummary(), null, 2))
process.exit(result.exitCode)
