#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-EXTERNAL-STAGING-SQL-HISTORY-BLOCKER-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-record.json',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-results.md',
  'docs/implementation-prompts/prompt-supabase-migration-history-reconciliation-1.md',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-diagnostics.mjs',
  'package.json',
]

const migrationHistoryReconciliationFiles = [
  'docs/supabase-worker-runtime/supabase-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-migration-history-reconciliation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-staging-migration-history-owner-decision-1.md',
  'scripts/validation/supabase-migration-history-reconciliation-1-diagnostics.mjs',
]

const stagingMigrationHistoryOwnerDecisionFiles = [
  'docs/supabase-worker-runtime/supabase-staging-migration-history-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-staging-migration-history-owner-decision-1-record.json',
  'docs/activation-phase-supabase-staging-migration-history-owner-decision-1-results.md',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
]

const pendingMigrations = [
  '202605130007_generation_providers_generated_assets.sql',
  '202605130008_render_preview_export_revision_qa.sql',
  '202605180001_reeditpro_core_workspace_projects.sql',
  '202605180002_reeditpro_media_source_sequence.sql',
  '202605180003_reeditpro_intent_plan_versions.sql',
  '202605180004_reeditpro_credits_approval_snapshots.sql',
  '202605180005_reeditpro_generation_assets_jobs.sql',
  '202605180006_reeditpro_qa_exports_audit.sql',
  '202605180007_reeditpro_rls_policies.sql',
  '202605180008_reeditpro_storage_buckets_policies.sql',
  '202605190001_sfx_director_tables.sql',
  '202605190002_storytiming_master_tables.sql',
  '202605200001_storage_upload_pipeline_readiness.sql',
  '202605200002_worker_leases_runtime_transport.sql',
  '202605210001_e2e_runtime_readiness_tables.sql',
  '202606050001_activation_milestone_registry_schema_rls.sql',
  '202606180001_worker_runtime_transactional_rpc.sql',
  '20260625031135_rp_data_03_internal_beta_static_gap_contract.sql',
]

const requiredText = [
  packet,
  'blocked_remote_migration_history_not_aligned_for_rpc_4r_sql_execution',
  'completed_readonly_migration_history_audit_and_dry_run_no_sql_mutation',
  'passed_confirmed_supabase_target_rls_storage_validation',
  'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner',
  'readonly_migration_history_and_db_push_dry_run',
  'SQL mutation: `none`',
  'Migration deployed: `no`',
  'Production touched: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'passed_readonly_migration_history_audit',
  'blocked_dry_run_would_apply_unscoped_pending_migration_set',
  'Dry-run pending migration count: `18`',
  'Remote applied migrations currently align only through:',
  '202605130006',
  'supabase migration list --db-url [redacted]',
  'supabase db push --dry-run --db-url [redacted]',
  'SUPABASE-MIGRATION-HISTORY-RECONCILIATION-1',
  'No Supabase mutation, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled.',
]

const forbidden = [
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /providerModelCall"?\s*:\s*true/i,
  /completed_guarded_staging_sql_execution_readback_passed/i,
  /SQL execution passed/i,
  /migration deployment passed/i,
  /readback verification passed/i,
]

const secretLike = [
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bbearer\s+[A-Za-z0-9._-]{16,}/i,
  /\bpostgres(?:ql)?:\/\/\S+/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function extractSection(text, heading) {
  const marker = `## ${heading}`
  const start = text.indexOf(marker)
  if (start === -1) return ''
  const rest = text.slice(start + marker.length)
  const next = rest.search(/\n## |\n# /)
  return marker + (next === -1 ? rest : rest.slice(0, next))
}

for (const file of requiredFiles) read(file)

const corpus = [
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1.md'),
  read('docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-results.md'),
  read('docs/implementation-prompts/prompt-supabase-migration-history-reconciliation-1.md'),
  extractSection(read('implementation-status-and-next-phase.md'), 'SUPABASE-WORKER-RUNTIME Transactional RPC 4R External Staging SQL History Blocker'),
  extractSection(read('docs/production-beta-blocker-inventory.md'), 'SUPABASE-WORKER-RUNTIME Transactional RPC 4R External Staging SQL History Blocker'),
].join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const migration of pendingMigrations) {
  if (!corpus.includes(migration)) fail(`missing pending migration evidence: ${migration}`)
}

for (const pattern of forbidden) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const expectedLabelValues = new Map([
  ['SQL mutation', 'none'],
  ['Migration deployed', 'no'],
  ['Production touched', 'false'],
  ['Internal beta unlocked', 'false'],
  ['External beta unlocked', 'false'],
])

for (const [label, expected] of expectedLabelValues.entries()) {
  const labelPattern = new RegExp(`(^|\\n)${label}:\\s*([^\\n]+)`, 'gi')
  for (const match of corpus.matchAll(labelPattern)) {
    const value = match[2].trim().replaceAll('`', '').replace(/[.;]$/, '')
    if (value !== expected) fail(`forbidden ${label} value: ${value}`)
  }
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-record.json'))
if (record.decision !== 'blocked_remote_migration_history_not_aligned_for_rpc_4r_sql_execution') fail('record decision mismatch')
if (record.execution !== 'completed_readonly_migration_history_audit_and_dry_run_no_sql_mutation') fail('record execution mismatch')
if (record.targetValidationDependency !== 'passed_confirmed_supabase_target_rls_storage_validation') fail('record target dependency mismatch')
if (record.remoteSupabaseCommandClass !== 'readonly_migration_history_and_db_push_dry_run') fail('record command class mismatch')
if (record.sqlMutation !== 'none') fail('record SQL mutation mismatch')
if (record.migrationDeployed !== 'no') fail('record migration deployment mismatch')
if (record.dryRunPendingMigrationCount !== 18) fail('record pending migration count mismatch')
if (record.dryRunResult !== 'blocked_dry_run_would_apply_unscoped_pending_migration_set') fail('record dry-run result mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('record package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('record generated artifact mismatch')
for (const migration of pendingMigrations) {
  if (!record.pendingMigrations?.includes(migration)) fail(`record missing pending migration: ${migration}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-4r-external-staging-sql-history-blocker-1:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
for (const blocked of ['supabase/migrations', 'supabase/functions', 'server', 'src', 'docker', 'database', '.github/workflows', '.dockerignore']) {
  execFileSync('git', ['diff', '--quiet', '--', blocked], { env: gitEnv, stdio: 'pipe' })
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const allowed = new Set([
  ...requiredFiles,
  ...migrationHistoryReconciliationFiles,
  ...stagingMigrationHistoryOwnerDecisionFiles,
])

for (const file of changed) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  for (const pattern of secretLike) {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))) {
      if (!match[0].startsWith('postgresql://[redacted]')) fail(`secret-like text in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_remote_migration_history_not_aligned_for_rpc_4r_sql_execution')
console.log('SQL mutation: none')
console.log('Migration deployed: no')
