import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH,
  SUPABASE_MILESTONE_REGISTRY_SCHEMA_EXPECTED_REPORTS,
  SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
  SUPABASE_MILESTONE_REGISTRY_SEED_PATH,
  SUPABASE_MILESTONE_REGISTRY_TABLES,
  buildSupabaseMilestoneRegistrySchemaReports,
} from '../activation/supabase-milestone-registry-schema'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-milestone-registry-schema:plan',
  'activation:supabase-milestone-registry-schema:local-validate',
  'activation:supabase-milestone-registry-schema:rls-test',
  'activation:supabase-milestone-registry-schema:staging-preflight',
  'activation:supabase-milestone-registry-schema:staging-deploy',
  'activation:supabase-milestone-registry-schema:staging-verify',
  'activation:supabase-milestone-registry-schema:report',
  'activation:supabase-milestone-registry-schema:summary',
  'smoke:activation-supabase-milestone-registry-schema',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/supabase-milestone-registry-schema'), 'Schema activation module missing.')
assert(!existsSync('server/workers/supabase-milestone-registry-schema'), 'Schema phase must not add a worker.')
assert(existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH), 'Registry migration missing.')
assert(existsSync(SUPABASE_MILESTONE_REGISTRY_SEED_PATH), 'Registry local seed fixture missing.')
assert(existsSync(SUPABASE_MILESTONE_REGISTRY_RLS_TEST_PATH), 'Registry local RLS assertions missing.')

const migrationText = readFileSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH, 'utf8')
for (const table of SUPABASE_MILESTONE_REGISTRY_TABLES) {
  assert(migrationText.includes(`public.${table}`), `Migration missing table reference: ${table}`)
  assert(migrationText.toLowerCase().includes(`alter table public.${table} enable row level security`), `Migration missing RLS enablement: ${table}`)
  assert(migrationText.toLowerCase().includes(`revoke all on table public.${table} from public, anon, authenticated`), `Migration missing anon/auth revoke: ${table}`)
  assert(migrationText.toLowerCase().includes(`grant select, insert, update, delete on table public.${table} to service_role`), `Migration missing service_role grant: ${table}`)
}

for (const snippet of [
  'production_allowed boolean not null default false',
  'external_beta_allowed boolean not null default false',
  'paid_production_allowed boolean not null default false',
  'broad_media_allowed boolean not null default false',
  'public_output_allowed boolean not null default false',
  'provider_calls_allowed boolean not null default false',
]) {
  assert(migrationText.toLowerCase().includes(snippet), `Migration missing hard safety default: ${snippet}`)
}

for (const forbidden of [
  'secret_value',
  'service_role_key',
  'provider_key',
  'signed_url',
  'raw_prompt',
  'raw_payload',
  'private_artifact_contents',
  'user_pii',
  'create view public',
  'to authenticated',
  'to anon',
]) {
  assert(!migrationText.toLowerCase().includes(forbidden), `Migration must not include forbidden token: ${forbidden}`)
}

const backfillModuleText = readFileSync('server/activation/supabase-trackb-backfill/index.ts', 'utf8')
assert(backfillModuleText.includes(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH), 'Backfill checker must reference the new registry migration path.')
for (const table of SUPABASE_MILESTONE_REGISTRY_TABLES) {
  assert(backfillModuleText.includes(`'${table}'`), `Backfill checker must recognize registry table: ${table}`)
}
for (const oldTable of ['activation_runs', 'activation_artifacts', 'activation_qa_gates', 'readiness_snapshots', 'tool_capabilities', 'feature_gates']) {
  assert(!backfillModuleText.includes(`'${oldTable}'`), `Backfill checker must not require old registry placeholder table: ${oldTable}`)
}

for (const { file, text } of readAllFiles('server/activation/supabase-milestone-registry-schema')) {
  assert(!text.includes("from 'node:child_process'"), `Schema module must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Schema module must not spawn processes: ${file}`)
  assert(!text.includes('execFile'), `Schema module must not execute subprocesses: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Schema module must not import Track A: ${file}`)
  assert(!text.includes('OPENAI_API_KEY'), `Schema module must not reference provider env vars: ${file}`)
  assert(!text.includes('ANTHROPIC_API_KEY'), `Schema module must not reference provider env vars: ${file}`)
  assert(!text.includes('console.log(process.env'), `Schema module must not print environment payloads: ${file}`)
  assert(!text.includes('activation:supabase-trackb-backfill -- --execute'), `Schema phase must not trigger backfill execution: ${file}`)
}

const reports = buildSupabaseMilestoneRegistrySchemaReports()
assert(reports.migrationReport.status === 'passed', 'Migration report must pass static validation.')
assert(reports.rlsPolicyReport.status === 'passed', 'RLS policy report must pass static validation.')
assert(reports.seedFixtureReport.status === 'passed', 'Seed fixture report must pass static validation.')

const stagingDeploy = reports.stagingDeployReport as { deployPerformed?: boolean; remoteSqlRun?: boolean; productionAffected?: boolean }
assert(stagingDeploy.deployPerformed === false, 'Smoke must not perform staging deployment.')
assert(stagingDeploy.remoteSqlRun === false, 'Smoke must not run remote SQL.')
assert(stagingDeploy.productionAffected === false, 'Smoke must not affect production.')

for (const report of SUPABASE_MILESTONE_REGISTRY_SCHEMA_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR, report)), `Missing report: ${report}`)
}

const reportText = JSON.stringify(reports)
for (const forbidden of ['BEGIN PRIVATE KEY', 'postgres://', 'postgresql://', 'private-user-images.githubusercontent.com', '"signedUrl"', '"secretValue"']) {
  assert(!reportText.includes(forbidden), `Reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-milestone-registry-schema-rls',
  reportDir: SUPABASE_MILESTONE_REGISTRY_SCHEMA_REPORT_DIR,
  registryTables: SUPABASE_MILESTONE_REGISTRY_TABLES.length,
  migrationPath: SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
  backfillSchemaCheckerUpdated: true,
  backfillRowsWritten: false,
  remoteSql: 'not_run',
  productionAffected: false,
  trackA: 'not_touched',
}, null, 2))
