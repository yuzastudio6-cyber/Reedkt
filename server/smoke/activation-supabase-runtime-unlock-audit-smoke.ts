import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_RUNTIME_UNLOCK_AUDIT_DOCS,
  SUPABASE_RUNTIME_UNLOCK_AUDIT_EXPECTED_REPORTS,
  SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
  buildSupabaseRuntimeUnlockAuditReports,
} from '../activation/supabase-runtime-unlock-audit'

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
  'activation:supabase-runtime-unlock-audit:plan',
  'activation:supabase-runtime-unlock-audit:report',
  'activation:supabase-runtime-unlock-audit:summary',
  'smoke:activation-supabase-runtime-unlock-audit',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/supabase-runtime-unlock-audit'), 'Runtime unlock audit module is missing.')
assert(!existsSync('server/workers/supabase-runtime-unlock-audit'), 'Runtime unlock audit must not add a worker.')
for (const report of SUPABASE_RUNTIME_UNLOCK_AUDIT_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR, report)), `Missing report: ${report}`)
}
for (const doc of SUPABASE_RUNTIME_UNLOCK_AUDIT_DOCS) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildSupabaseRuntimeUnlockAuditReports()
assert(reports.repoAudit.status === 'passed', 'Repo audit should pass as source-of-truth metadata.')
assert(reports.repoAudit.ownerAccepted === true, 'Owner acceptance must be recorded.')
assert(reports.repoAudit.currentUnlockStage === 'repo_audit_passed', 'Audit should advance metadata stage to repo_audit_passed.')
assert(
  reports.nextUnlockStageRecommendation.nextRecommendedUnlockStage ===
    'fix_exact_missing_deploy_transport_blocker_before_dry_run',
  'Next stage must be exact deploy transport repair.',
)
assert(
  reports.duplicateWorkRiskReport.recommendation === 'continue_pr_223_deploy_transport_after_exact_transport_repair',
  'Audit must recommend continuing PR #223, not duplicate work.',
)
assert(reports.deployTransportBlockerInventory.sqlExecuted === false, 'Audit must not execute SQL.')
assert(reports.deployTransportBlockerInventory.migrationDeployed === false, 'Audit must not deploy migrations.')
assert(reports.deployTransportBlockerInventory.dataBackfill === false, 'Audit must not backfill data.')
assert(reports.deployTransportBlockerInventory.productionAffected === false, 'Audit must not affect production.')
assert(
  reports.deployTransportBlockerInventory.selectedStrategy.startsWith('blocked_'),
  'Transport strategy should remain blocked until target, credential, and CLI transport gates pass.',
)
assert(
  reports.deployTransportBlockerInventory.activeBlockers.length > 0,
  'Transport blockers must remain present.',
)

for (const { file, text } of readAllFiles('server/activation/supabase-runtime-unlock-audit')) {
  assert(!text.includes("from 'node:child_process'"), `Audit module must not import child_process: ${file}`)
  assert(!text.includes('execFile'), `Audit module must not execute subprocesses: ${file}`)
  assert(!text.includes('spawn('), `Audit module must not spawn subprocesses: ${file}`)
  assert(!text.includes('gcloud secrets versions access'), `Audit module must not access secret payloads: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Audit module must not import Track A: ${file}`)
}

const reportText = readAllFiles(SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR)
  .concat(SUPABASE_RUNTIME_UNLOCK_AUDIT_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'postgres://',
  'postgresql://',
  'BEGIN PRIVATE KEY',
  '"secretValue"',
  '"signedUrl"',
  'x-goog-signature',
  'service_role_key=',
  'access_token=',
]) {
  assert(!reportText.includes(forbidden), `Audit reports/docs must not include forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'SUPABASE_RLS_STORAGE_DATABASE-0',
  reportDir: SUPABASE_RUNTIME_UNLOCK_AUDIT_REPORT_DIR,
  reports: SUPABASE_RUNTIME_UNLOCK_AUDIT_EXPECTED_REPORTS.length,
  ownerAccepted: true,
  currentUnlockStage: 'repo_audit_passed',
  recommendedNextUnlockStage: 'fix_exact_missing_deploy_transport_blocker_before_dry_run',
  sqlExecuted: false,
  migrationDeployed: false,
  dataBackfill: false,
  secretPayloadAccess: false,
  productionAffected: false,
  trackA: 'not_touched',
}, null, 2))
