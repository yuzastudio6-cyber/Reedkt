import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_DOCS,
  SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_EXPECTED_REPORTS,
  SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR,
  buildSupabaseRemoteSchemaEquivalenceReports,
} from '../activation/supabase-remote-schema-equivalence'

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
  'activation:supabase-remote-schema-equivalence:plan',
  'activation:supabase-remote-schema-equivalence',
  'activation:supabase-remote-schema-equivalence:report',
  'activation:supabase-remote-schema-equivalence:summary',
  'smoke:activation-supabase-remote-schema-equivalence',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-remote-schema-equivalence'),
  'Remote schema equivalence module is missing.',
)
assert(
  !existsSync('server/workers/supabase-remote-schema-equivalence'),
  'Remote schema equivalence review must not add a worker.',
)

for (const report of SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR, report)),
    `Missing remote schema equivalence report: ${report}`,
  )
}
for (const doc of SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_DOCS) {
  assert(existsSync(doc), `Missing remote schema equivalence doc: ${doc}`)
}

const reports = buildSupabaseRemoteSchemaEquivalenceReports()
assert(
  reports.localMissingMigrationIntentInventory.missingMigrationCount === 12,
  'Local migration intent inventory must cover the 12 missing history entries.',
)
assert(
  reports.remoteStagingSchemaIntrospectionReport.status === 'passed' ||
    reports.remoteStagingSchemaIntrospectionReport.status === 'blocked',
  'Remote introspection report must pass or emit a blocker.',
)
assert(
  reports.remoteSchemaEquivalenceComparisonReport.status === 'passed' ||
    reports.remoteSchemaEquivalenceComparisonReport.status === 'blocked',
  'Comparison report must exist with a stable status.',
)
assert(
  [
    'approved_for_future_staging_migration_history_repair',
    'blocked_pending_remote_history_evidence',
    'blocked_pending_local_migration_review',
  ].includes(reports.migrationHistoryRepairApprovalAfterEquivalenceReview.decision),
  'Post-review repair approval decision is missing.',
)
assert(
  reports.migrationHistoryRepairApprovalAfterEquivalenceReview.migrationRepairRun === false &&
    reports.migrationHistoryRepairApprovalAfterEquivalenceReview.schemaDeployRun === false &&
    reports.migrationHistoryRepairApprovalAfterEquivalenceReview.trackBBackfillRun === false &&
    reports.migrationHistoryRepairApprovalAfterEquivalenceReview.productionAffected === false &&
    reports.migrationHistoryRepairApprovalAfterEquivalenceReview.directDdlDmlRun === false,
  'Equivalence review must not run repair, deploy, backfill, production, or DDL/DML.',
)

const moduleText = readAllFiles('server/activation/supabase-remote-schema-equivalence')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'supabase db push',
  'gcloud secrets versions access',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
]) {
  assert(!moduleText.includes(forbidden), `Equivalence module must not include forbidden execution path: ${forbidden}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR)
  .concat(SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
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
  phase: 'supabase-remote-schema-equivalence-review',
  reportDir: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_REPORT_DIR,
  reports: SUPABASE_REMOTE_SCHEMA_EQUIVALENCE_EXPECTED_REPORTS.length,
  missingHistoryEntries: reports.localMissingMigrationIntentInventory.missingMigrationCount,
  remoteIntrospectionStatus: reports.remoteStagingSchemaIntrospectionReport.status,
  overallEquivalence: reports.remoteSchemaEquivalenceComparisonReport.overallEquivalence,
  decision: reports.migrationHistoryRepairApprovalAfterEquivalenceReview.decision,
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRun: false,
  productionAffected: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))
