import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_DOCS,
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS,
  SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
  buildSupabaseResetRetryFailureDiagnosticsReports,
} from '../activation/supabase-reset-retry-failure-diagnostics'

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
  'activation:supabase-reset-retry-failure-diagnostics:plan',
  'activation:supabase-reset-retry-failure-diagnostics',
  'activation:supabase-reset-retry-failure-diagnostics:report',
  'activation:supabase-reset-retry-failure-diagnostics:summary',
  'smoke:activation-supabase-reset-retry-failure-diagnostics',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-reset-retry-failure-diagnostics'),
  'Reset retry failure diagnostics activation module missing.',
)
assert(
  !existsSync('server/workers/supabase-reset-retry-failure-diagnostics'),
  'Diagnostics phase must not add a worker.',
)

for (const report of SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR, report)),
    `Missing reset retry failure diagnostics report: ${report}`,
  )
}
for (const doc of SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_DOCS) {
  assert(existsSync(doc), `Missing reset retry failure diagnostics doc: ${doc}`)
}

const reports = buildSupabaseResetRetryFailureDiagnosticsReports()
assert(
  asRecord(reports.evidenceInventory.pr269).resetAttempted === true,
  'PR #269 reset retry attempt evidence missing.',
)
assert(
  asRecord(reports.evidenceInventory.pr269).stagingSqlMayHaveRun === true,
  'PR #269 stagingSqlMayHaveRun evidence missing.',
)
assert(
  reports.cliFailureAnalysis.exactFailureCauseProven === false,
  'Diagnostics must not overclaim an exact failure cause.',
)
assert(reports.recoveryDecision.resetRetryExecutionAllowedInThisPhase === false, 'Reset retry must remain blocked.')
assert(reports.recoveryDecision.dbPushAllowedInThisPhase === false, 'db push must remain blocked.')
assert(reports.recoveryDecision.migrationRepairAllowedInThisPhase === false, 'Migration repair must remain blocked.')
assert(reports.recoveryDecision.schemaDeployAllowedInThisPhase === false, 'Schema deploy must remain blocked.')
assert(reports.recoveryDecision.trackBBackfillAllowedInThisPhase === false, 'Track B backfill must remain blocked.')
assert(reports.recoveryDecision.productionAllowed === false, 'Production must remain blocked.')
assert(reports.supabaseSupportPacket.dbUrlPrinted === false, 'Support packet must not print DB URL.')
assert(reports.supabaseSupportPacket.payloadCommitted === false, 'Support packet must not commit payloads.')

const moduleFiles = readAllFiles('server/activation/supabase-reset-retry-failure-diagnostics')
const moduleText = moduleFiles.map(({ text }) => text).join('\n')
for (const forbidden of [
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
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_RESET_RETRY_EXECUTE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
]) {
  assert(!moduleText.includes(forbiddenConfirmation), `Forbidden confirmation unlock found: ${forbiddenConfirmation}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR)
  .concat(SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
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
  '"privatePayload"',
]) {
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs contain forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-reset-retry-failure-diagnostics',
  reportDir: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_REPORT_DIR,
  reports: SUPABASE_RESET_RETRY_FAILURE_DIAGNOSTICS_EXPECTED_REPORTS.length,
  decision: reports.recoveryDecision.decision,
  resetRetryRun: false,
  dbPushRun: false,
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
