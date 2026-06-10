import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  CLEAN_STAGING_BRANCH_NAME,
  SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_DOCS,
  SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_EXPECTED_REPORTS,
  SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR,
  buildSupabaseCleanStagingBranchExecutionReports,
  scanSupabaseCleanStagingBranchPayloadText,
} from '../activation/supabase-clean-staging-branch-execution'

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
  'activation:supabase-clean-staging-branch-execution:plan',
  'activation:supabase-clean-staging-branch-execution',
  'activation:supabase-clean-staging-branch-execution:verify',
  'activation:supabase-clean-staging-branch-execution:report',
  'activation:supabase-clean-staging-branch-execution:summary',
  'smoke:activation-supabase-clean-staging-branch-execution',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-clean-staging-branch-execution'),
  'Clean staging branch execution activation module missing.',
)
assert(
  !existsSync('server/workers/supabase-clean-staging-branch-execution'),
  'Clean staging branch execution must not add a worker.',
)

for (const report of SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR, report)),
    `Missing clean staging branch execution report: ${report}`,
  )
}
for (const doc of SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_DOCS) {
  assert(existsSync(doc), `Missing clean staging branch execution doc: ${doc}`)
}

const reports = buildSupabaseCleanStagingBranchExecutionReports()
assert(reports.precheckReport.pr280Decision === 'approved_for_future_clean_supabase_staging_branch', 'PR #280 approval evidence missing.')
assert(reports.precheckReport.branchWithData === false, 'Branch must not be created with production data.')
assert(reports.branchCreationReport.withData === false, 'Branch creation report must record withData=false.')
assert(reports.branchCreationReport.productionAffected === false, 'Production must not be affected.')
assert(reports.migrationApplyReport.productionAffected !== true, 'Migration apply must not affect production.')
assert(reports.accessTokenSecretDiscoveryReport.payloadPrinted === false, 'Access-token discovery must not print payloads.')
assert(reports.accessTokenInjectionReport.payloadPrinted === false, 'Access-token injection report must not print payloads.')
assert(reports.accessTokenInjectionReport.payloadCommitted === false, 'Access-token injection report must not commit payloads.')
assert(reports.migrationTransportReport.dbUrlPrinted === false, 'Migration transport report must not print DB URLs.')
assert(reports.secretReferencePlan.payloadsIncluded === false, 'Secret reference plan must not include payloads.')
assert(reports.trackBBackfillPreflightReport.trackBBackfillRowsWritten === false, 'Track B write must remain false.')
assert(reports.readinessReport.withProductionData === false, 'Readiness must record no production data clone.')

const moduleText = readAllFiles('server/activation/supabase-clean-staging-branch-execution')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  '--with-data',
  'supabase db reset',
  'supabase migration repair',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT=true',
]) {
  assert(!moduleText.includes(forbidden), `Forbidden execution path found: ${forbidden}`)
}
assert(moduleText.includes('branches'), 'Branch execution module must include branch command handling.')
assert(moduleText.includes('db') && moduleText.includes('push'), 'Migration apply command class must be represented.')

const reportsAndDocs = readAllFiles(SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR)
  .concat(SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  '--with-data',
  'postgres://',
  'postgresql://',
  'BEGIN PRIVATE KEY',
  'x-goog-signature=',
  'service_role_key=',
  'anon_key=',
  'access_token=',
  'jwt_secret=',
  'sbp_',
  '"secretValue"',
  '"privatePayload"',
]) {
  assert(!reportsAndDocs.includes(forbidden), `Reports/docs contain forbidden payload or data-clone pattern: ${forbidden}`)
}
const sensitivePatterns = scanSupabaseCleanStagingBranchPayloadText(reportsAndDocs)
assert(sensitivePatterns.length === 0, `Reports/docs contain forbidden sensitive pattern: ${sensitivePatterns.join(', ')}`)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-clean-staging-branch-execution',
  reportDir: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_REPORT_DIR,
  branchName: CLEAN_STAGING_BRANCH_NAME,
  reports: SUPABASE_CLEAN_STAGING_BRANCH_EXECUTION_EXPECTED_REPORTS.length,
  supabaseUpdateStatus: reports.readinessReport.supabaseUpdateStatus,
  branchAction: reports.branchCreationReport.branchAction,
  withProductionData: false,
  migrationApply: reports.migrationApplyReport.status,
  schemaRlsVerify: reports.schemaRlsVerifyReport.status,
  trackBBackfillRowsWritten: false,
  productionAffected: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))
