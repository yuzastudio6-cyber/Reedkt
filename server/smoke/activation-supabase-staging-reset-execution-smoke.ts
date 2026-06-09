import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_RESET_EXECUTION_DOCS,
  SUPABASE_STAGING_RESET_EXECUTION_EXPECTED_REPORTS,
  SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
  buildSupabaseStagingResetExecutionReports,
} from '../activation/supabase-staging-reset-execution'

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
  'activation:supabase-staging-reset-execution:plan',
  'activation:supabase-staging-reset-execution',
  'activation:supabase-staging-reset-execution:verify',
  'activation:supabase-staging-reset-execution:report',
  'activation:supabase-staging-reset-execution:summary',
  'smoke:activation-supabase-staging-reset-execution',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/supabase-staging-reset-execution'), 'Reset execution module missing.')
assert(!existsSync('server/workers/supabase-staging-reset-execution'), 'Reset execution must not add a worker.')

for (const report of SUPABASE_STAGING_RESET_EXECUTION_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR, report)),
    `Missing reset execution report: ${report}`,
  )
}
for (const doc of SUPABASE_STAGING_RESET_EXECUTION_DOCS) {
  assert(existsSync(doc), `Missing reset execution doc: ${doc}`)
}

const reports = await buildSupabaseStagingResetExecutionReports()
const sourceDecision = reports.precheckReport.sourceDecision as { decision?: string } | undefined
const resetCommand = reports.previewReport.resetCommand as { operation?: string[] } | undefined
assert(sourceDecision?.decision === 'approved_for_future_staging_reset_and_reapply_migrations', 'PR #252 approval evidence missing.')
assert(reports.backupExportExecutionReport.backupRequiredBeforeReset === true, 'Backup/export gate must be required before reset.')
assert(reports.previewReport.resetDryRunSupported === false, 'Reset dry-run support must be explicitly false for current CLI behavior.')
assert(resetCommand?.operation?.includes('--no-seed'), 'Reset command preview must include --no-seed.')
assert(reports.executionReport.migrationRepairRun === false, 'Migration repair must remain false.')
assert(reports.executionReport.trackBBackfillWrite === false, 'Track B writes must remain false.')
assert(reports.executionReport.productionAffected === false, 'Production must remain false.')
assert(reports.trackBBackfillPreflightReport.writePathRun === false, 'Backfill preflight wrapper must not write.')

const moduleText = readAllFiles('server/activation/supabase-staging-reset-execution')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'supabase migration repair',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
]) {
  assert(!moduleText.includes(forbidden), `Forbidden execution path found: ${forbidden}`)
}
assert(moduleText.includes('db') && moduleText.includes('reset'), 'Reset execution module must include the guarded db reset path.')
assert(moduleText.includes('--no-seed'), 'Reset execution module must force --no-seed.')

const reportAndDocText = readAllFiles(SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR)
  .concat(SUPABASE_STAGING_RESET_EXECUTION_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  ['x-goog-signature', '='].join(''),
  ['service_role_key', '='].join(''),
  ['access_token', '='].join(''),
  '"secretValue"',
]) {
  assert(!reportAndDocText.includes(forbidden), `Reports/docs contain forbidden secret-like pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-reset-reapply-execution',
  reportDir: SUPABASE_STAGING_RESET_EXECUTION_REPORT_DIR,
  reports: SUPABASE_STAGING_RESET_EXECUTION_EXPECTED_REPORTS.length,
  resetRun: reports.executionReport.resetPerformed === true,
  productionAffected: false,
  trackBBackfillRowsWritten: false,
  migrationRepairRun: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
