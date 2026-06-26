#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-runner.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-readiness-gate.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-safety-boundary.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-confirmed-results.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-confirmed.md',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-diagnostics.mjs',
  'package.json',
]

const externalStagingSqlGateFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-readiness-gate.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-safety-boundary.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-results.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-diagnostics.mjs',
]

const credentialContextHardeningFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-record.json',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-safety-boundary.md',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-results.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-credential-context-hardening-1-diagnostics.mjs',
]

const externalSqlHistoryBlockerFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-results.md',
  'docs/implementation-prompts/prompt-supabase-migration-history-reconciliation-1.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-history-blocker-1-diagnostics.mjs',
]

const migrationHistoryReconciliationFiles = [
  'docs/supabase-worker-runtime/supabase-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-migration-history-reconciliation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-staging-migration-history-owner-decision-1.md',
  'scripts/validation/supabase-migration-history-reconciliation-1-diagnostics.mjs',
]

const requiredText = [
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED',
  'completed_rpc_4r_confirmed_runner_fail_closed_without_sql_execution',
  'completed_guard_scaffold_no_remote_execution',
  'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner',
  'blocked_confirmed_target_validation_present_but_no_sql_execution_in_codex_session',
  'passed_confirmed_supabase_target_rls_storage_validation',
  'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access',
  '2026-06-26T14-39-42-178Z-ec258ac5',
  '2026-06-26T15-20-14-905Z-577a0b5f',
  '0397747bef9c0adb48b445de69e28685ff5a25b71aa0e22c3bd8cb0b1ec72c86',
  '9d0fda2f43cb26cea7343224dafd4a9a72d9cbf765773ce293d82a23ea47aa23',
  'manifest_file_checksum_recorded_outside_self_referential_manifest',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED',
  'REEDITPRO_SUPABASE_TARGET_RLS_STORAGE_VALIDATION_REPORT',
  'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TARGET_IS_STAGING=true',
  'REEDITPRO_CONFIRM_NO_PRODUCTION_SUPABASE=true',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_BACKEND_CREDENTIAL_RESOLUTION=true',
  'Supabase update status: blocked_sql_not_executed',
  'Supabase environment touched: none',
  'SQL executed: none',
  'Migration deployed: no',
  'readbackStatus: not_run',
  'Secret Manager payload printed: false',
  'production touched: false',
  'Internal beta unlocked: false',
  'trackAInternalBetaUnlocked: false',
  'Product-ready end-to-end local OSS tools: 0',
  'Package-lock: unchanged',
  'Generated artifacts committed: none',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_guarded_staging_sql_execution',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_guarded_staging_sql_execution',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED-EXTERNAL-STAGING-SQL-EXECUTION',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled.',
  'Approved Secret Manager credential aliases were resolved only into ephemeral process environment variables for the guard run.',
]

const forbidden = [
  /Internal beta unlocked:\s*`?true/i,
  /trackAInternalBetaUnlocked:\s*`?true/i,
  /internalBetaReady:\s*`?true/i,
  /productionReady:\s*`?true/i,
  /externalBetaReady:\s*`?true/i,
  /finalDeliveryReady:\s*`?true/i,
  /Supabase environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /readbackStatus:(?!\s*`?not_run`?)/i,
  /Secret Manager payload printed:(?!\s*`?false`?)/i,
  /production touched:(?!\s*`?false`?)/i,
  /remoteSupabaseMutation:\s*true/i,
  /sqlExecution:\s*true/i,
  /migrationApply:\s*true/i,
  /rlsPolicyApply:\s*true/i,
  /storageBucketCreation:\s*true/i,
  /storageObjectCreation:\s*true/i,
  /storageObjectRead:\s*true/i,
  /serviceRoleRouteExecution:\s*true/i,
  /workerExecution:\s*true/i,
  /workerDispatch:\s*true/i,
  /workerLeaseClaim:\s*true/i,
  /providerModelCall:\s*true/i,
  /signedUrlCreation:\s*true/i,
  /publicArtifactCreation:\s*true/i,
  /creditMutation:\s*true/i,
  /internalBetaUnlock:\s*true/i,
  /externalBetaUnlock:\s*true/i,
  /productionUnlock:\s*true/i,
  /finalRenderExport:\s*true/i,
  /Package-lock:\s*`?changed/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /completed_guarded_staging_sql_execution_readback_passed/i,
  /SQL execution passed/i,
  /migration deployment passed/i,
  /readback verification passed/i,
]

const secretLike = [
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /\bbearer\s+[A-Za-z0-9._-]{16,}/i,
  /\b(?:SUPABASE|SERVICE_ROLE|ANON|JWT|SECRET|TOKEN)[A-Z0-9_]*\s*=\s*['"]?[A-Za-z0-9._/-]{12,}/i,
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
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-source-audit.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-runner.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-readiness-gate.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-safety-boundary.md'),
  read('docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-confirmed-results.md'),
  read('docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-confirmed.md'),
  extractSection(read('implementation-status-and-next-phase.md'), 'SUPABASE-WORKER-RUNTIME Transactional RPC 4R Confirmed Runner'),
  extractSection(read('docs/production-beta-blocker-inventory.md'), 'SUPABASE-WORKER-RUNTIME Transactional RPC 4R Confirmed Runner'),
].join('\n')

for (const token of requiredText) {
  if (!corpus.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbidden) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-record.json'))
if (record.decision !== 'completed_rpc_4r_confirmed_runner_fail_closed_without_sql_execution') fail('record decision mismatch')
if (record.execution !== 'completed_guard_scaffold_no_remote_execution') fail('record execution mismatch')
if (record.currentRunnerResult !== 'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner') fail('record current runner result mismatch')
if (record.currentRunnerExecution !== 'blocked_confirmed_target_validation_present_but_no_sql_execution_in_codex_session') fail('record current runner execution mismatch')
if (record.targetValidationDependency !== 'passed_confirmed_supabase_target_rls_storage_validation') fail('record target validation dependency mismatch')
if (record.credentialContextDecision !== 'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access') fail('record credential context decision mismatch')
if (record.targetValidationReportSha256 !== '9723d72a02ab2a9d2aa930c5ecbc85a2841857d5be11c570754bb8f1516c0b57') fail('record target report checksum mismatch')
if (record.currentRunReportSha256 !== '0397747bef9c0adb48b445de69e28685ff5a25b71aa0e22c3bd8cb0b1ec72c86') fail('record current report checksum mismatch')
if (record.currentRunManifestSha256 !== '9d0fda2f43cb26cea7343224dafd4a9a72d9cbf765773ce293d82a23ea47aa23') fail('record current manifest checksum mismatch')
if (record.manifestChecksumPolicy !== 'manifest_file_checksum_recorded_outside_self_referential_manifest') fail('record manifest checksum policy mismatch')
if (record.supabaseEnvironmentTouched !== 'none') fail('record environment touched mismatch')
if (record.sqlExecuted !== 'none') fail('record sql executed mismatch')
if (record.migrationDeployed !== 'no') fail('record migration deployed mismatch')
if (record.readbackStatus !== 'not_run') fail('record readback mismatch')
if (record.internalBetaUnlocked !== false) fail('record internal beta unlock mismatch')
if (record.trackAInternalBetaUnlocked !== false) fail('record trackA unlock mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('record package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('record generated artifact mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-4r-confirmed'] !== 'node scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed.mjs') {
  fail('missing confirmed runner package script')
}
if (packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-4r-confirmed:diagnostics'] !== 'node scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs') {
  fail('missing confirmed diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
for (const blocked of [
  'supabase/migrations',
  'supabase/functions',
  'server/routes',
  'server/workers',
  'server/config',
  'docker',
  'src',
  'database',
  '.github/workflows',
  '.dockerignore',
]) {
  execFileSync('git', ['diff', '--quiet', '--', blocked], { env: gitEnv, stdio: 'pipe' })
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

const allowedChanged = new Set([
  ...requiredFiles,
  ...externalStagingSqlGateFiles,
  ...credentialContextHardeningFiles,
  ...externalSqlHistoryBlockerFiles,
  ...migrationHistoryReconciliationFiles,
])

for (const file of changed) {
  if (file === 'package-lock.json') fail('package-lock.json changed')
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('supabase/migrations/') || file.startsWith('supabase/functions/')) fail(`Supabase implementation file changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('database/')) fail(`runtime file changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.mkv') || file.endsWith('.zip')) fail(`generated/media artifact changed: ${file}`)
  if (!allowedChanged.has(file)) fail(`unexpected changed file: ${file}`)

  const text = read(file)
  for (const pattern of secretLike) {
    const match = text.match(pattern)
    if (match && !match[0].startsWith('postgresql://[redacted]')) fail(`secret-like value matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Supabase update status: blocked_sql_not_executed')
console.log('Supabase environment touched: none')
console.log('SQL executed: none')
console.log('Migration deployed: no')
console.log('readbackStatus: not_run')
console.log('Target validation dependency: passed_confirmed_supabase_target_rls_storage_validation')
