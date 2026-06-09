import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_SCHEMA_PARITY_REMEDIATION_DOCS,
  SUPABASE_SCHEMA_PARITY_REMEDIATION_EXPECTED_REPORTS,
  SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR,
  buildSupabaseSchemaParityRemediationReports,
} from '../activation/supabase-schema-parity-remediation'

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
  'activation:supabase-schema-parity-remediation:plan',
  'activation:supabase-schema-parity-remediation',
  'activation:supabase-schema-parity-remediation:report',
  'activation:supabase-schema-parity-remediation:summary',
  'smoke:activation-supabase-schema-parity-remediation',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(
  existsSync('server/activation/supabase-schema-parity-remediation'),
  'Schema parity remediation module is missing.',
)
assert(
  !existsSync('server/workers/supabase-schema-parity-remediation'),
  'Schema parity remediation packet must not add a worker.',
)

for (const report of SUPABASE_SCHEMA_PARITY_REMEDIATION_EXPECTED_REPORTS) {
  assert(
    existsSync(path.join(SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR, report)),
    `Missing schema parity remediation report: ${report}`,
  )
}
for (const doc of SUPABASE_SCHEMA_PARITY_REMEDIATION_DOCS) {
  assert(existsSync(doc), `Missing schema parity remediation doc: ${doc}`)
}

const reports = buildSupabaseSchemaParityRemediationReports()
assert(
  reports.missingEffectInventory.nonEquivalentMigrationCount === 11,
  'Missing effect inventory must cover the 11 non-equivalent migrations.',
)
assert(
  reports.remediationOptionMatrix.options.some(
    (option) => option.optionId === 'migration_history_repair_only' && option.status === 'rejected',
  ),
  'Repair-only option must be rejected when effects are absent.',
)
assert(
  reports.decision.decision === 'blocked_pending_staging_reset_approval',
  'Schema parity decision must require staging reset approval.',
)
assert(
  reports.decision.migrationRepairRun === false &&
    reports.decision.schemaDeployRun === false &&
    reports.decision.trackBBackfillRun === false &&
    reports.decision.productionAffected === false &&
    reports.decision.directDdlDmlRun === false,
  'Strategy packet must not run repair, deploy, backfill, production, or DDL/DML.',
)

const moduleText = readAllFiles('server/activation/supabase-schema-parity-remediation')
  .map(({ text }) => text)
  .join('\n')
for (const forbidden of [
  'gcloud secrets versions access',
  'execute_sql',
  'supabase.from(',
  "from '../track-a",
  "from '../../track-a",
]) {
  assert(!moduleText.includes(forbidden), `Schema parity module must not include forbidden path: ${forbidden}`)
}

const reportsAndDocs = readAllFiles(SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR)
  .concat(SUPABASE_SCHEMA_PARITY_REMEDIATION_DOCS.map((file) => ({ file, text: readFileSync(file, 'utf8') })))
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
  phase: 'supabase-schema-parity-remediation-strategy',
  reportDir: SUPABASE_SCHEMA_PARITY_REMEDIATION_REPORT_DIR,
  reports: SUPABASE_SCHEMA_PARITY_REMEDIATION_EXPECTED_REPORTS.length,
  missingEffects: reports.missingEffectInventory.nonEquivalentMigrationCount,
  selectedStrategy: reports.recommendedStrategy.selectedStrategy,
  decision: reports.decision.decision,
  repairOnlyStatus: 'rejected',
  migrationRepairRun: false,
  schemaDeployRun: false,
  trackBBackfillRun: false,
  productionAffected: false,
  directDdlDmlRun: false,
  secretsPrintedOrCommitted: false,
  trackA: 'not_touched',
}, null, 2))
