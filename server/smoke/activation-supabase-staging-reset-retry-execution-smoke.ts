import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_RESET_RETRY_EXECUTION_DOCS,
  SUPABASE_STAGING_RESET_RETRY_EXECUTION_EXPECTED_REPORTS,
  SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR,
  buildSupabaseStagingResetRetryExecutionReports,
} from '../activation/supabase-staging-reset-retry-execution'

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
  'activation:supabase-staging-reset-retry-execution:plan',
  'activation:supabase-staging-reset-retry-execution',
  'activation:supabase-staging-reset-retry-execution:verify',
  'activation:supabase-staging-reset-retry-execution:report',
  'activation:supabase-staging-reset-retry-execution:summary',
  'smoke:activation-supabase-staging-reset-retry-execution',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-staging-reset-retry-execution'),
  'Staging reset retry execution module missing.',
)
assert(
  !existsSync('server/workers/supabase-staging-reset-retry-execution'),
  'Staging reset retry execution must not add a worker.',
)

for (const report of SUPABASE_STAGING_RESET_RETRY_EXECUTION_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR, report)),
    `Missing staging reset retry execution report: ${report}`,
  )
}
for (const doc of SUPABASE_STAGING_RESET_RETRY_EXECUTION_DOCS) {
  assert(existsSync(doc), `Missing staging reset retry execution doc: ${doc}`)
}

const reports = await buildSupabaseStagingResetRetryExecutionReports()
const precheck = reports.precheckReport as { pr265Approval?: { decision?: string }; pr265CommandReview?: { futureRetryOperation?: string[] } }
const operation = precheck.pr265CommandReview?.futureRetryOperation ?? []
assert(
  precheck.pr265Approval?.decision === 'approved_for_future_retry_reset_after_cli_command_fix',
  'PR #265 approval evidence missing.',
)
assert(operation.includes('--no-seed'), 'Future retry operation must include --no-seed.')
assert(!operation.includes('--yes'), 'Future retry operation must not include --yes.')
assert(reports.backupExportExecutionReport.backupRequiredBeforeReset === true, 'Backup/export gate must be required.')
assert(reports.commandPreviewReport.resetDryRunSupported === false, 'Reset dry-run support must be explicitly false.')
assert(reports.commandPreviewReport.seedFilesIncluded === false, 'Seed files must not be included.')
assert(reports.executionReport.resetCommandIncludesYesOperationFlag === false, 'Reset retry must omit the --yes operation flag.')
assert(reports.executionReport.migrationRepairRun === false, 'Migration repair must remain false.')
assert(reports.executionReport.supabaseDbPushRun === false, 'supabase db push must remain false.')
assert(reports.executionReport.trackBBackfillWrite === false, 'Track B writes must remain false.')
assert(reports.executionReport.productionAffected === false, 'Production must remain false.')
assert(reports.trackBBackfillPreflightReport.writePathRun === false, 'Backfill preflight wrapper must not write.')

const moduleText = readAllFiles('server/activation/supabase-staging-reset-retry-execution')
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
assert(moduleText.includes('executeSupabaseStagingResetExecution'), 'Retry module must reuse the approved reset execution path.')
assert(moduleText.includes('REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE'), 'Retry confirmation gate missing.')

const reportsAndDocs = readAllFiles(SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR)
  .concat(SUPABASE_STAGING_RESET_RETRY_EXECUTION_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
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
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs contain forbidden secret-like pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-reset-retry-execution',
  reportDir: SUPABASE_STAGING_RESET_RETRY_EXECUTION_REPORT_DIR,
  reports: SUPABASE_STAGING_RESET_RETRY_EXECUTION_EXPECTED_REPORTS.length,
  resetRetryRun: reports.executionReport.resetPerformed === true,
  productionAffected: false,
  trackBBackfillRowsWritten: false,
  migrationRepairRun: false,
  supabaseDbPushRun: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
