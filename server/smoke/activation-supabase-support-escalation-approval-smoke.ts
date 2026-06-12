import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_SUPPORT_ESCALATION_APPROVAL_DOCS,
  SUPABASE_SUPPORT_ESCALATION_APPROVAL_EXPECTED_REPORTS,
  SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
  buildSupabaseSupportEscalationApprovalReports,
} from '../activation/supabase-support-escalation-approval'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) files.push(...readAllFiles(full))
    else files.push({ file: full, text: readFileSync(full, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-support-escalation-approval:plan',
  'activation:supabase-support-escalation-approval',
  'activation:supabase-support-escalation-approval:report',
  'activation:supabase-support-escalation-approval:summary',
  'smoke:activation-supabase-support-escalation-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-support-escalation-approval'),
  'Support escalation approval activation module missing.',
)
assert(
  !existsSync('server/workers/supabase-support-escalation-approval'),
  'Support escalation approval phase must not add a worker.',
)

for (const report of SUPABASE_SUPPORT_ESCALATION_APPROVAL_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR, report)),
    `Missing support escalation approval report: ${report}`,
  )
}
for (const doc of SUPABASE_SUPPORT_ESCALATION_APPROVAL_DOCS) {
  assert(existsSync(doc), `Missing support escalation approval doc: ${doc}`)
}

const reports = buildSupabaseSupportEscalationApprovalReports()
assert(
  asRecord(reports.evidenceInventory.pr271).recoveryDecision === 'recovery_path_supabase_support_packet',
  'PR #271 support packet recommendation evidence missing.',
)
assert(reports.redactionReview.status === 'passed', 'Support escalation redaction review must pass.')
assert(
  reports.submissionOptionMatrix.recommendedOption === 'manual_supabase_dashboard_support_ticket',
  'Manual Supabase dashboard support ticket must be the recommended future option.',
)
assert(reports.approvalDecision.decision !== 'approved_for_future_cli_create_ticket', 'CLI create-ticket must not be approved.')
assert(reports.approvalDecision.cliCreateTicketRun === false, 'CLI create-ticket must not run.')
assert(reports.approvalDecision.supportTicketSubmitted === false, 'Support ticket must not be submitted.')
assert(reports.approvalDecision.resetRetryRun === false, 'Reset retry must remain blocked.')
assert(reports.approvalDecision.dbPushRun === false, 'db push must remain blocked.')
assert(reports.approvalDecision.migrationRepairRun === false, 'Migration repair must remain blocked.')
assert(reports.approvalDecision.schemaDeployRun === false, 'Schema deploy must remain blocked.')
assert(reports.approvalDecision.trackBBackfillRowsWritten === false, 'Track B backfill must remain blocked.')
assert(reports.approvalDecision.productionAffected === false, 'Production must remain blocked.')
assert(reports.approvalDecision.sqlExecuted === false, 'SQL must not execute in this packet.')
assert(reports.approvalDecision.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const moduleText = readAllFiles('server/activation/supabase-support-escalation-approval')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'node:child_process',
  'gcloud secrets versions access',
  'supabase db push',
  'supabase migration repair',
  'executeSupabaseStagingResetExecution',
  'executeSupabaseStagingResetRetryExecution',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
]) {
  assert(!moduleText.includes(forbidden), `Forbidden execution path found: ${forbidden}`)
}
for (const forbiddenConfirmation of [
  'REEDITPRO_CONFIRM_SUPABASE_SUPPORT_TICKET_SUBMISSION=true',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_CREATE_TICKET=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
]) {
  assert(!moduleText.includes(forbiddenConfirmation), `Forbidden confirmation unlock found: ${forbiddenConfirmation}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR)
  .concat(SUPABASE_SUPPORT_ESCALATION_APPROVAL_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  ['x-goog-signature', '='].join(''),
  ['service_role_key', '='].join(''),
  ['anon_key', '='].join(''),
  ['access_token', '='].join(''),
  ['"', 'secret', 'Value', '"'].join(''),
  ['"', 'private', 'Payload', '"'].join(''),
  'sbp_',
]) {
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs contain forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-support-escalation-approval',
  reportDir: SUPABASE_SUPPORT_ESCALATION_APPROVAL_REPORT_DIR,
  reports: SUPABASE_SUPPORT_ESCALATION_APPROVAL_EXPECTED_REPORTS.length,
  decision: reports.approvalDecision.decision,
  redactionReview: reports.redactionReview.status,
  recommendedSubmissionOption: reports.submissionOptionMatrix.recommendedOption,
  supportTicketSubmitted: false,
  cliCreateTicketRun: false,
  resetRetryRun: false,
  dbPushRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
