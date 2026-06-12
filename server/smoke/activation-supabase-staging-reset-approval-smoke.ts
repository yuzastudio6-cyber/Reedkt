import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_RESET_APPROVAL_DOCS,
  SUPABASE_STAGING_RESET_APPROVAL_EXPECTED_REPORTS,
  SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR,
  buildSupabaseStagingResetApprovalReports,
} from '../activation/supabase-staging-reset-approval'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-staging-reset-approval:plan',
  'activation:supabase-staging-reset-approval',
  'activation:supabase-staging-reset-approval:report',
  'activation:supabase-staging-reset-approval:summary',
  'smoke:activation-supabase-staging-reset-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-staging-reset-approval'),
  'Staging reset approval module is missing.',
)
assert(
  !existsSync('server/workers/supabase-staging-reset-approval'),
  'Staging reset approval packet must not add a worker.',
)

for (const report of SUPABASE_STAGING_RESET_APPROVAL_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR, report)),
    `Missing staging reset approval report: ${report}`,
  )
}
for (const doc of SUPABASE_STAGING_RESET_APPROVAL_DOCS) {
  assert(existsSync(doc), `Missing staging reset approval doc: ${doc}`)
}

const reports = buildSupabaseStagingResetApprovalReports()
assert(reports.evidenceInventory.schemaParityStrategy === 'staging_reset_and_reapply_migrations', 'PR #247 strategy evidence is missing.')
assert(reports.dataImpactReview.status === 'blocked', 'Data impact review must block until reviewed.')
assert(reports.backupSnapshotPlan.status === 'blocked', 'Backup/snapshot plan must block until completed.')
assert(reports.migrationOrderReview.status === 'reviewed_for_planning_future_dry_run_required', 'Migration order review must be present.')
assert(reports.targetProofReview.status === 'passed_for_metadata_only', 'Target proof metadata review must be present.')
assert(reports.postResetVerificationPlan.status === 'planned_not_run', 'Post-reset verification plan must be present.')
assert(reports.approvalDecision.decision === 'blocked_pending_staging_data_impact_review', 'Reset approval decision must block on data impact review.')
assert(
  reports.approvalDecision.stagingResetRun === false &&
    reports.approvalDecision.migrationRepairRun === false &&
    reports.approvalDecision.schemaDeployRun === false &&
    reports.approvalDecision.trackBBackfillRun === false &&
    reports.approvalDecision.productionAffected === false &&
    reports.approvalDecision.directDdlDmlRun === false,
  'Approval packet must not run reset, repair, deploy, backfill, production, or DDL/DML.',
)

const moduleText = readAllFiles('server/activation/supabase-staging-reset-approval')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'gcloud secrets versions access',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
]) {
  assert(!moduleText.includes(forbidden), `Staging reset module must not include forbidden path: ${forbidden}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR)
  .concat(SUPABASE_STAGING_RESET_APPROVAL_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  '"secretValue"',
  '"signedUrl"',
  ['x-goog-signature', '='].join(''),
  ['service_role_key', '='].join(''),
  ['access_token', '='].join(''),
]) {
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs must not include forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-reset-approval-packet',
  reportDir: SUPABASE_STAGING_RESET_APPROVAL_REPORT_DIR,
  reports: SUPABASE_STAGING_RESET_APPROVAL_EXPECTED_REPORTS.length,
  decision: reports.approvalDecision.decision,
  dataImpact: reports.dataImpactReview.status,
  backupSnapshot: reports.backupSnapshotPlan.status,
  migrationOrder: reports.migrationOrderReview.status,
  targetProof: reports.targetProofReview.status,
  stagingResetRun: false,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRun: false,
  productionAffected: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))
