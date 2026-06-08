import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_DOCS,
  SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS,
  SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR,
  buildSupabaseMigrationHistoryRepairApprovalReports,
} from '../activation/supabase-migration-history-repair-approval'

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
  'activation:supabase-migration-history-repair-approval:plan',
  'activation:supabase-migration-history-repair-approval',
  'activation:supabase-migration-history-repair-approval:report',
  'activation:supabase-migration-history-repair-approval:summary',
  'smoke:activation-supabase-migration-history-repair-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-migration-history-repair-approval'),
  'Migration-history repair approval module is missing.',
)
assert(
  !existsSync('server/workers/supabase-migration-history-repair-approval'),
  'Approval packet must not add a worker.',
)

for (const report of SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR, report)),
    `Missing repair approval report: ${report}`,
  )
}
for (const doc of SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_DOCS) {
  assert(existsSync(doc), `Missing repair approval doc: ${doc}`)
}

const reports = buildSupabaseMigrationHistoryRepairApprovalReports({ executeConfirmed: true })
assert(
  reports.evidenceInventory.status === 'passed',
  'Evidence inventory must load committed PR #223 migration-history evidence.',
)
assert(
  reports.localRemoteComparison.olderLocalMigrationsAbsentRemotelyCount === 12,
  'Comparison must identify the 12 older local migrations absent remotely.',
)
assert(
  reports.repairCandidatePlan.repairVersions.length === 12 &&
    reports.repairCandidatePlan.repairStatus === 'applied',
  'Repair candidate must be exact and mark the 12 older missing versions as applied.',
)
assert(
  reports.approvalDecision.decision === 'blocked_pending_remote_history_evidence',
  'Decision must block pending remote schema evidence.',
)
assert(
  reports.approvalDecision.migrationRepairRun === false &&
    reports.approvalDecision.schemaDeployRun === false &&
    reports.approvalDecision.trackBBackfillRun === false &&
    reports.approvalDecision.productionAffected === false,
  'Approval packet must not run repair, deploy, backfill, or production.',
)

const moduleText = readAllFiles('server/activation/supabase-migration-history-repair-approval')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  "from 'node:child_process'",
  'execFile',
  'spawn(',
  'gcloud secrets versions access',
  'supabase db push',
  'execute_sql',
  'supabase.from(',
  'from "../track-a',
  'from "../../track-a',
]) {
  assert(!moduleText.includes(forbidden), `Approval module must not include forbidden execution path: ${forbidden}`)
}

const reportAndDocText = readAllFiles(SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR)
  .concat(SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  '"secretValue"',
  '"signedUrl"',
  ['x-goog-signature', '='].join(''),
  'service_role_key=',
  'access_token=',
]) {
  assert(!reportAndDocText.includes(forbidden), `Reports/docs must not include forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-migration-history-repair-approval',
  reportDir: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_REPORT_DIR,
  reports: SUPABASE_MIGRATION_HISTORY_REPAIR_APPROVAL_EXPECTED_REPORTS.length,
  repairCandidateVersions: reports.repairCandidatePlan.repairVersions.length,
  decision: reports.approvalDecision.decision,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRun: false,
  productionAffected: false,
  directSqlRun: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))
