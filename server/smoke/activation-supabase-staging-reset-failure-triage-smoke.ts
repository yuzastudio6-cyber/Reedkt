import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_DOCS,
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS,
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
  buildSupabaseStagingResetFailureTriageReports,
} from '../activation/supabase-staging-reset-failure-triage'

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
  'activation:supabase-staging-reset-failure-triage:plan',
  'activation:supabase-staging-reset-failure-triage',
  'activation:supabase-staging-reset-failure-triage:report',
  'activation:supabase-staging-reset-failure-triage:summary',
  'smoke:activation-supabase-staging-reset-failure-triage',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-staging-reset-failure-triage'),
  'Staging reset failure triage module missing.',
)
assert(
  !existsSync('server/workers/supabase-staging-reset-failure-triage'),
  'Staging reset failure triage must not add a worker.',
)

for (const report of SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR, report)),
    `Missing staging reset failure triage report: ${report}`,
  )
}
for (const doc of SUPABASE_STAGING_RESET_FAILURE_TRIAGE_DOCS) {
  assert(existsSync(doc), `Missing staging reset failure triage doc: ${doc}`)
}

const reports = buildSupabaseStagingResetFailureTriageReports()
const pr259Evidence = asRecord(reports.evidenceInventory.pr259)
const backupArtifacts = asRecord(reports.privateArtifactManifest.backupArtifacts)
assert(pr259Evidence.resetAttempted === true, 'PR #259 reset attempt evidence missing.')
assert(pr259Evidence.stagingSqlMayHaveRun === true, 'PR #259 stagingSqlMayHaveRun evidence missing.')
assert(reports.migrationHistoryDelta.registryMigrationApplied === false, 'Registry migration should remain unapplied in PR #259 evidence.')
assert(reports.registrySchemaRlsState.tableCountFound === 0, 'Registry table absence evidence missing.')
assert(
  reports.recoveryDecision.decision === 'recovery_path_manual_operator_review_required',
  'Default recovery decision must require manual operator review.',
)
assert(reports.recoveryDecision.recoveryExecutionAllowedInThisPhase === false, 'Recovery execution must remain blocked.')
assert(reports.recoveryDecision.resetRetryApproved === false, 'Reset retry must not be approved.')
assert(reports.recoveryDecision.schemaDeployApproved === false, 'Schema deploy must not be approved.')
assert(reports.recoveryDecision.migrationRepairApproved === false, 'Migration repair must not be approved.')
assert(reports.recoveryDecision.trackBBackfillApproved === false, 'Track B backfill must not be approved.')
assert(reports.recoveryDecision.productionAffected === false, 'Production must not be affected.')
assert(backupArtifacts.backupPayloadCommitted === false, 'Backup payload must not be committed.')
assert(
  ['unknown', 'unchanged_failed_state', 'partially_mutated'].includes(String(reports.postFailureStagingState.stateClassifier)),
  'Post-failure state classifier must use the supported vocabulary.',
)
assert('secretRefUsed' in asRecord(reports.readonlyInspection), 'Readonly inspection must record redacted secret ref metadata.')
assert(
  ['succeeded', 'failed', 'not_attempted'].includes(String(reports.readonlyInspection.payloadAccessStatus)),
  'Readonly inspection must record safe payload access status.',
)
assert(reports.readonlyInspection.payloadPrinted === false, 'Readonly inspection must state payloadPrinted=false.')
assert(reports.readonlyInspection.payloadCommitted === false, 'Readonly inspection must state payloadCommitted=false.')

for (const alias of [
  'staging_reset_post_failure_state_report.json',
  'staging_reset_failure_classification_report.json',
  'staging_reset_recovery_decision.json',
  'staging_reset_failure_blocker_report.json',
]) {
  assert(
    SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS.includes(alias as never),
    `Alias report missing from expected report manifest: ${alias}`,
  )
  assert(
    existsSync(path.join(SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR, alias)),
    `Missing prompt-compatible alias report: ${alias}`,
  )
}

const committedReadonlyReportPath = path.join(
  SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
  'readonly_staging_failure_triage_inspection.json',
)
if (existsSync(committedReadonlyReportPath)) {
  const committedReadonly = JSON.parse(readFileSync(committedReadonlyReportPath, 'utf8')) as Record<string, unknown>
  if (committedReadonly.status === 'passed') {
    assert(
      reports.readonlyInspection.status === 'passed',
      'Default report generation must preserve the latest passed readonly inspection report.',
    )
    assert(
      reports.readonlyInspection.preservedFromLatestReport === true,
      'Preserved readonly inspection must be marked as preservedFromLatestReport.',
    )
  }
}

const moduleText = readAllFiles('server/activation/supabase-staging-reset-failure-triage')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'gcloud secrets versions access',
  'supabase db reset',
  'supabase db push',
  'supabase migration repair',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
]) {
  assert(!moduleText.includes(forbidden), `Forbidden execution path found: ${forbidden}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR)
  .concat(SUPABASE_STAGING_RESET_FAILURE_TRIAGE_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  ['"secret', 'Value"'].join(''),
  ['"signed', 'Url"'].join(''),
  ['x-goog-signature', '='].join(''),
  ['service', '_role_key', '='].join(''),
  ['access', '_token', '='].join(''),
]) {
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs contain forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-reset-failure-triage',
  reportDir: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_REPORT_DIR,
  reports: SUPABASE_STAGING_RESET_FAILURE_TRIAGE_EXPECTED_REPORTS.length,
  decision: reports.recoveryDecision.decision,
  partialResetRisk: reports.partialResetRisk.riskLevel,
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
