#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-STAGING-MIGRATION-HISTORY-OWNER-DECISION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-staging-migration-history-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-staging-migration-history-owner-decision-1-record.json',
  'docs/activation-phase-supabase-staging-migration-history-owner-decision-1-results.md',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/supabase-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'package.json',
]

const inheritedFiles = [
  'docs/supabase-worker-runtime/supabase-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-migration-history-reconciliation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-staging-migration-history-owner-decision-1.md',
  'scripts/validation/supabase-migration-history-reconciliation-1-diagnostics.mjs',
]

const followOnExternalProductBetaCurrentReadinessRollup1Files = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingTargetOwnerApproval1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1-record.json',
  'docs/activation-phase-supabase-clean-staging-target-owner-approval-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-execution-current-target-revalidation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingBranchCurrentTargetRevalidation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-revalidation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-db-url-secret-handoff-1-results.md',
  'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports/clean_staging_branch_db_url_secret_handoff_report.json',
  'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports/clean_staging_branch_db_url_secret_handoff_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-current-target-guarded-validation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'blocked_no_owner_approval_for_staging_migration_apply_or_clean_target',
  'completed_docs_only_staging_migration_history_owner_decision_no_sql_mutation',
  'blocked_pending_owner_decision_for_staging_migration_history_reconciliation',
  'passed_confirmed_supabase_target_rls_storage_validation',
  'Full pending-set staging apply approval: `not_approved`',
  'Clean staging target or branch/project approval: `not_approved`',
  'Continued block selected: `true`',
  'Remote Supabase command class: `none_in_this_phase`',
  'SQL mutation: `none`',
  'Migration deployed: `no`',
  'Migration history table edited: `no`',
  'Production touched: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_explicit_staging_migration_path_approval`',
  'OWNER ACTION REQUIRED - approve full reviewed staging migration set or clean staging target before RPC 4R SQL execution',
  'No Supabase mutation, SQL mutation, migration apply, migration history table edit, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled.',
]

const pendingMigrations = [
  '202605130007_generation_providers_generated_assets.sql',
  '202606180001_worker_runtime_transactional_rpc.sql',
  '20260625031135_rp_data_03_internal_beta_static_gap_contract.sql',
]

const forbidden = [
  /fullPendingSetStagingApplyApproval"?\s*:\s*"approved"/i,
  /cleanStagingTargetApproval"?\s*:\s*"approved"/i,
  /continuedBlockSelected"?\s*:\s*false/i,
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationHistoryTableEdited"?\s*:\s*true/i,
  /completed_guarded_staging_sql_execution_readback_passed/i,
  /SQL execution passed/i,
  /migration deployment passed/i,
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
  read('docs/supabase-worker-runtime/supabase-staging-migration-history-owner-decision-1.md'),
  read('docs/activation-phase-supabase-staging-migration-history-owner-decision-1-results.md'),
  extractSection(read('implementation-status-and-next-phase.md'), 'SUPABASE Staging Migration History Owner Decision 1'),
  extractSection(read('docs/production-beta-blocker-inventory.md'), 'SUPABASE Staging Migration History Owner Decision 1'),
].join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const migration of pendingMigrations) {
  if (!corpus.includes(migration)) fail(`missing carry-forward migration evidence: ${migration}`)
}
for (const pattern of forbidden) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const labels = new Map([
  ['Full pending-set staging apply approval', 'not_approved'],
  ['Clean staging target or branch/project approval', 'not_approved'],
  ['Continued block selected', 'true'],
  ['SQL mutation', 'none'],
  ['Migration deployed', 'no'],
  ['Migration history table edited', 'no'],
  ['Production touched', 'false'],
  ['Internal beta unlocked', 'false'],
  ['External beta unlocked', 'false'],
])
for (const [label, expected] of labels.entries()) {
  const pattern = new RegExp(`(^|\\n)${label}:\\s*([^\\n]+)`, 'gi')
  for (const match of corpus.matchAll(pattern)) {
    const value = match[2].trim().replaceAll('`', '').replace(/[.;]$/, '')
    if (value !== expected) fail(`forbidden ${label} value: ${value}`)
  }
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-staging-migration-history-owner-decision-1-record.json'))
if (record.decision !== 'blocked_no_owner_approval_for_staging_migration_apply_or_clean_target') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_staging_migration_history_owner_decision_no_sql_mutation') fail('record execution mismatch')
if (record.fullPendingSetStagingApplyApproval !== 'not_approved') fail('full pending set approval mismatch')
if (record.cleanStagingTargetApproval !== 'not_approved') fail('clean target approval mismatch')
if (record.continuedBlockSelected !== true) fail('continued block mismatch')
if (record.sqlMutation !== 'none') fail('SQL mutation mismatch')
if (record.migrationDeployed !== 'no') fail('migration deployed mismatch')
if (record.migrationHistoryTableEdited !== 'no') fail('migration history edit mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-staging-migration-history-owner-decision-1:diagnostics'] !==
  'node scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs'
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
  ...inheritedFiles,
  ...followOnExternalProductBetaCurrentReadinessRollup1Files,
  ...followOnSupabaseCleanStagingTargetOwnerApproval1Files,
  ...followOnSupabaseCleanStagingBranchCurrentTargetRevalidation1Files,
])
for (const file of changed) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(text.replaceAll('postgresql://[redacted]', ''))) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_no_owner_approval_for_staging_migration_apply_or_clean_target')
console.log('SQL mutation: none')
console.log('Migration deployed: no')
