import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_DOCS,
  SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_EXPECTED_REPORTS,
  SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR,
  buildSupabaseCleanStagingTargetApprovalReports,
  scanSupabaseCleanStagingApprovalPayloadText,
} from '../activation/supabase-clean-staging-target-approval'

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
  'activation:supabase-clean-staging-target-approval:plan',
  'activation:supabase-clean-staging-target-approval',
  'activation:supabase-clean-staging-target-approval:report',
  'activation:supabase-clean-staging-target-approval:summary',
  'smoke:activation-supabase-clean-staging-target-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-clean-staging-target-approval'),
  'Clean staging target approval activation module missing.',
)
assert(
  !existsSync('server/workers/supabase-clean-staging-target-approval'),
  'Clean staging target approval phase must not add a worker.',
)

for (const report of SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR, report)),
    `Missing clean staging target approval report: ${report}`,
  )
}
for (const doc of SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_DOCS) {
  assert(existsSync(doc), `Missing clean staging target approval doc: ${doc}`)
}

const reports = buildSupabaseCleanStagingTargetApprovalReports()
assert(reports.evidenceInventory.status === 'passed', 'Clean staging evidence inventory must pass.')
assert(
  asRecord(reports.evidenceInventory.pr276).decision === 'support_ticket_ready_for_manual_operator_submission',
  'PR #276 support ticket submission evidence missing.',
)
assert(
  asRecord(reports.evidenceInventory.pr252).decision === 'approved_for_future_staging_reset_and_reapply_migrations',
  'PR #252 owner/data-loss acceptance evidence missing.',
)
assert(
  asRecord(reports.evidenceInventory.pr241).overallEquivalence === 'not_equivalent',
  'PR #241 non-equivalence evidence missing.',
)
assert(
  reports.approvalDecision.decision === 'approved_for_future_clean_supabase_staging_branch' ||
    reports.approvalDecision.decision === 'blocked_pending_human_review',
  'Decision must be approved for future clean staging branch or pre-confirmation blocked.',
)
assert(reports.approvalDecision.branchOrProjectCreated === false, 'Clean branch/project must not be created here.')
assert(reports.approvalDecision.sqlExecuted === false, 'SQL must not run in approval packet.')
assert(reports.approvalDecision.migrationDeployed === false, 'Migration deploy must not run in approval packet.')
assert(reports.approvalDecision.migrationRepairRun === false, 'Migration repair must remain blocked.')
assert(reports.approvalDecision.trackBBackfillRowsWritten === false, 'Track B backfill must remain blocked.')
assert(reports.approvalDecision.supportTicketSubmitted === false, 'Support ticket must not be submitted here.')
assert(reports.approvalDecision.productionAffected === false, 'Production must remain blocked.')
assert(reports.approvalDecision.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const moduleText = readAllFiles('server/activation/supabase-clean-staging-target-approval')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'node:child_process',
  'gcloud secrets versions access',
  'supabase db reset',
  'supabase db push',
  'supabase migration repair',
  'supabase branches create',
  'supabase projects create',
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
  'REEDITPRO_CONFIRM_SUPABASE_BRANCH_CREATE=true',
  'REEDITPRO_CONFIRM_SUPABASE_PROJECT_CREATE=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_CREATE_TICKET=true',
]) {
  assert(!moduleText.includes(forbiddenConfirmation), `Forbidden confirmation unlock found: ${forbiddenConfirmation}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR)
  .concat(SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
const sensitivePatterns = scanSupabaseCleanStagingApprovalPayloadText(reportsAndDocs)
assert(sensitivePatterns.length === 0, `Reports/docs contain forbidden payload pattern: ${sensitivePatterns.join(', ')}`)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-clean-staging-target-approval',
  reportDir: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_REPORT_DIR,
  reports: SUPABASE_CLEAN_STAGING_TARGET_APPROVAL_EXPECTED_REPORTS.length,
  decision: reports.approvalDecision.decision,
  recommendedTarget: reports.approvalDecision.recommendedTarget,
  branchOrProjectCreated: false,
  sqlExecuted: false,
  migrationDeployed: false,
  migrationRepairRun: false,
  trackBBackfillRowsWritten: false,
  supportTicketSubmitted: false,
  productionAffected: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
