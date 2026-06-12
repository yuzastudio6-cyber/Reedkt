import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_RESET_RETRY_APPROVAL_DOCS,
  SUPABASE_STAGING_RESET_RETRY_APPROVAL_EXPECTED_REPORTS,
  SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
  buildSupabaseStagingResetRetryApprovalReports,
  assertNoSecretPatternsInText,
} from '../activation/supabase-staging-reset-retry-approval'

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
  'activation:supabase-staging-reset-retry-approval:plan',
  'activation:supabase-staging-reset-retry-approval',
  'activation:supabase-staging-reset-retry-approval:report',
  'activation:supabase-staging-reset-retry-approval:summary',
  'smoke:activation-supabase-staging-reset-retry-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-staging-reset-retry-approval'),
  'Staging reset retry approval module missing.',
)
assert(
  !existsSync('server/workers/supabase-staging-reset-retry-approval'),
  'Staging reset retry approval must not add a worker.',
)

for (const report of SUPABASE_STAGING_RESET_RETRY_APPROVAL_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR, report)),
    `Missing staging reset retry approval report: ${report}`,
  )
}
for (const doc of SUPABASE_STAGING_RESET_RETRY_APPROVAL_DOCS) {
  assert(existsSync(doc), `Missing staging reset retry approval doc: ${doc}`)
}

const reports = buildSupabaseStagingResetRetryApprovalReports()
const pr262Evidence = asRecord(reports.evidenceInventory.pr262)
assert(pr262Evidence.stateClassifier === 'unchanged_failed_state', 'PR #262 unchanged state evidence missing.')
assert(reports.commandReview.status === 'passed', 'Retry command review must pass.')
assert(reports.backupReview.status === 'passed', 'Backup review must pass.')
assert(reports.approvalDecision.resetRetryRun === false, 'Reset retry must not run.')
assert(reports.approvalDecision.schemaDeployRun === false, 'Schema deploy must not run.')
assert(reports.approvalDecision.migrationRepairRun === false, 'Migration repair must not run.')
assert(reports.approvalDecision.trackBBackfillRowsWritten === false, 'Track B backfill must not run.')
assert(reports.approvalDecision.productionAffected === false, 'Production must not be affected.')
assert(reports.approvalDecision.directDdlDmlRun === false, 'Direct DDL/DML must not run.')
assert(reports.approvalDecision.secretRefUsed === 'none', 'Approval packet must not use secret refs.')
assert(reports.approvalDecision.payloadPrinted === false, 'Payload printing must be false.')
assert(
  Array.isArray(reports.commandReview.futureRetryOperation) &&
    !reports.commandReview.futureRetryOperation.includes('--yes'),
  'Future retry command operation must not include --yes.',
)

const moduleText = readAllFiles('server/activation/supabase-staging-reset-retry-approval')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'execFileSync',
  'spawn(',
  'gcloud secrets versions access',
  'supabase migration repair',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
]) {
  assert(!moduleText.includes(forbidden), `Forbidden execution path found: ${forbidden}`)
}
for (const forbiddenExecutionShape of [
  "['db', 'push'",
  '["db", "push"',
  "['migration', 'repair'",
  '["migration", "repair"',
]) {
  assert(
    !moduleText.includes(forbiddenExecutionShape),
    `Forbidden executable command shape found: ${forbiddenExecutionShape}`,
  )
}

const reportsAndDocs = readAllFiles(SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR)
  .concat(SUPABASE_STAGING_RESET_RETRY_APPROVAL_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
assert(assertNoSecretPatternsInText(reportsAndDocs), 'Reports/docs contain forbidden secret-shaped payloads.')

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-reset-retry-approval',
  reportDir: SUPABASE_STAGING_RESET_RETRY_APPROVAL_REPORT_DIR,
  reports: SUPABASE_STAGING_RESET_RETRY_APPROVAL_EXPECTED_REPORTS.length,
  decision: reports.approvalDecision.decision,
  resetRetryRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
