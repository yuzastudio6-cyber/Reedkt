#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1'
const dir = 'docs/external-beta/reeditpro-supabase-main-target-migration-sync-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/migration-history-sync.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/sync-record.json`,
  'docs/activation-phase-rp-external-beta-reeditpro-supabase-main-target-migration-sync-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/production-beta-blocker-inventory.md',
  'supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  'supabase/migrations/20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-external-beta-reeditpro-supabase-main-target-migration-sync-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_reeditpro_main_supabase_target_migration_history_sync',
  'completed_guarded_main_staging_migration_apply_and_readonly_validation',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'fajinbvwhcjnutkaumkm` is historical sandbox evidence only',
  'No schema or data was copied from `fajinbvwhcjnutkaumkm` into `wmyyttnynmteqgcdishd`',
  '20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  'public_production_edit_session_brief_qwen_gates',
  '1e21925ef1dcdbcc7dba2bed22de275df26a76ce05b42e7dca90c6b186498357',
  'Applied pending repo migrations: `18`',
  '20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
  'source_aligned_and_up_to_date_through_20260626224600',
  'Remote database is up to date.',
  'No schema errors found',
  '2026-06-26T22-47-09-777Z-898c9851',
  'Product-ready end-to-end local OSS tools: `0`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1',
  '#577 remains open/draft/blocked/conflicting and excluded',
]

const forbiddenPatterns = [
  /external beta (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /internal beta (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /production (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /data copied from `?fajinbvwhcjnutkaumkm`?:\s*`?(true|yes)/i,
  /isolatedProjectDataCopy"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
]

const allowedSqlFiles = new Set([
  'supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql',
  'supabase/migrations/20260626224600_worker_runtime_fail_retry_count_lint_fix.sql',
])

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${dir}/sync-record.json`))
if (record.decision !== 'completed_reeditpro_main_supabase_target_migration_history_sync') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_main_staging_migration_apply_and_readonly_validation') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.historicalSandbox?.activeProject !== false) fail('historical sandbox must be inactive')
if (record.historicalSandbox?.dataCopiedToMain !== false) fail('historical sandbox data copy must be false')
if (record.sourceMappedRemoteOnlyMigration?.version !== '20260626163138') fail('source-mapped migration version mismatch')
if (record.sourceMappedRemoteOnlyMigration?.repairAsReverted !== false) fail('remote-only migration must not be repaired as reverted')
if (record.appliedPendingMigrationCount !== 18) fail('pending migration count mismatch')
if (record.finalMigrationHistory !== 'source_aligned_and_up_to_date_through_20260626224600') fail('final history mismatch')
if (record.finalDryRun !== 'remote_database_is_up_to_date') fail('final dry-run mismatch')
if (record.supabaseLint !== 'passed_no_schema_errors_found') fail('lint status mismatch')
if (record.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.statuses?.internalBetaUnlock !== false) fail('internal beta unlock changed')
if (record.statuses?.externalBetaUnlock !== false) fail('external beta unlock changed')
if (record.statuses?.productionUnlock !== false) fail('production unlock changed')
if (record.safety?.remoteSupabaseMutation !== 'guarded_staging_migration_apply_only') fail('remote mutation scope mismatch')
if (record.safety?.isolatedProjectDataCopy !== false) fail('isolated project copy mismatch')
if (record.safety?.storageObjectCreation !== false) fail('storage object creation changed')
if (record.safety?.storageObjectRead !== false) fail('storage object read changed')
if (record.safety?.serviceRoleRouteExecution !== false) fail('service-role route execution changed')
if (record.safety?.workerExecution !== false) fail('worker execution changed')
if (record.safety?.providerCall !== false) fail('provider call changed')
if (record.safety?.modelCall !== false) fail('model call changed')
if (record.safety?.mediaProcessing !== false) fail('media processing changed')
if (record.safety?.signedUrlCreation !== false) fail('signed URL creation changed')
if (record.safety?.publicArtifactCreation !== false) fail('public artifact creation changed')
if (record.safety?.packageLockMutation !== false) fail('package-lock mutation changed')
if (record.safety?.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-reeditpro-supabase-main-target-migration-sync-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-reeditpro-supabase-main-target-migration-sync-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file.endsWith('.sql') && !allowedSqlFiles.has(file)) fail(`unexpected SQL file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.includes('node_modules') || file.startsWith('dist')) fail(`generated/dependency path changed: ${file}`)

  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
}

const sourceMapSql = read('supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql')
if (!sourceMapSql.includes('create table if not exists public.edit_briefs')) fail('source-mapped migration missing edit_briefs')
if (!sourceMapSql.includes('create table if not exists public.edit_cues')) fail('source-mapped migration missing edit_cues')
if (!sourceMapSql.includes('qwen_marker_chat_provider_attempts')) fail('source-mapped migration missing qwen provider attempt table')

const lintFixSql = read('supabase/migrations/20260626224600_worker_runtime_fail_retry_count_lint_fix.sql')
if (!lintFixSql.includes('retry_count = v_job.retry_count + 1')) fail('lint fix migration missing qualified retry_count')
if (lintFixSql.includes('retry_count = retry_count + 1')) fail('lint fix still contains ambiguous retry_count')

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_reeditpro_main_supabase_target_migration_history_sync')
console.log('External beta: blocked_pending_runtime_gate_closure')
