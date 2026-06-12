import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_SUPPORT_TICKET_SUBMISSION_DOCS,
  SUPABASE_SUPPORT_TICKET_SUBMISSION_EXPECTED_REPORTS,
  SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR,
  buildSupabaseSupportTicketSubmissionReports,
} from '../activation/supabase-support-ticket-submission'

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
  'activation:supabase-support-ticket-submission:plan',
  'activation:supabase-support-ticket-submission',
  'activation:supabase-support-ticket-submission:report',
  'activation:supabase-support-ticket-submission:summary',
  'smoke:activation-supabase-support-ticket-submission',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-support-ticket-submission'),
  'Support ticket submission activation module missing.',
)
assert(
  !existsSync('server/workers/supabase-support-ticket-submission'),
  'Support ticket submission phase must not add a worker.',
)

for (const report of SUPABASE_SUPPORT_TICKET_SUBMISSION_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR, report)),
    `Missing support ticket submission report: ${report}`,
  )
}
for (const doc of SUPABASE_SUPPORT_TICKET_SUBMISSION_DOCS) {
  assert(existsSync(doc), `Missing support ticket submission doc: ${doc}`)
}

const reports = buildSupabaseSupportTicketSubmissionReports()
assert(
  asRecord(reports.evidenceInventory.pr274).decision === 'approved_for_future_manual_supabase_support_ticket',
  'PR #274 approval decision evidence missing.',
)
assert(reports.redactionValidation.status === 'passed', 'Support ticket redaction validation must pass.')
assert(
  reports.manualSubmissionPacket.status === 'ready_for_operator_manual_submission',
  'Manual submission packet must be ready.',
)
assert(
  [
    'blocked_pending_redaction_review',
    'blocked_pending_support_owner_approval',
    'support_ticket_ready_for_manual_operator_submission',
  ].includes(String(reports.submissionReadiness.decision)),
  'Decision must be pre-confirmation blocked or operator-ready manual submission.',
)
assert(reports.submissionAudit.supportTicketSubmitted === false, 'Support ticket must not be submitted here.')
assert(reports.submissionAudit.cliCreateTicketRun === false, 'CLI create-ticket must not run.')
assert(reports.submissionAudit.debugResetRun === false, 'Debug reset must not run.')
assert(reports.submissionAudit.resetRetryRun === false, 'Reset retry must remain blocked.')
assert(reports.submissionAudit.dbPushRun === false, 'db push must remain blocked.')
assert(reports.submissionAudit.migrationRepairRun === false, 'Migration repair must remain blocked.')
assert(reports.submissionAudit.schemaDeployRun === false, 'Schema deploy must remain blocked.')
assert(reports.submissionAudit.trackBBackfillRowsWritten === false, 'Track B backfill must remain blocked.')
assert(reports.submissionAudit.productionAffected === false, 'Production must remain blocked.')
assert(reports.submissionAudit.sqlExecuted === false, 'SQL must not execute in this packet.')
assert(reports.submissionAudit.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const moduleText = readAllFiles('server/activation/supabase-support-ticket-submission')
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
  'REEDITPRO_CONFIRM_SUPABASE_CLI_CREATE_TICKET=true',
  'REEDITPRO_CONFIRM_SUPABASE_DEBUG_LOG_COLLECTION=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
]) {
  assert(!moduleText.includes(forbiddenConfirmation), `Forbidden confirmation unlock found: ${forbiddenConfirmation}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR)
  .concat(SUPABASE_SUPPORT_TICKET_SUBMISSION_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
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
  phase: 'supabase-support-ticket-submission',
  reportDir: SUPABASE_SUPPORT_TICKET_SUBMISSION_REPORT_DIR,
  reports: SUPABASE_SUPPORT_TICKET_SUBMISSION_EXPECTED_REPORTS.length,
  decision: reports.submissionReadiness.decision,
  redactionValidation: reports.redactionValidation.status,
  supportTicketSubmitted: false,
  cliCreateTicketRun: false,
  debugResetRun: false,
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
