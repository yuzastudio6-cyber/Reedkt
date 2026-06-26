#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED-EXTERNAL-STAGING-SQL-EXECUTION'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-readiness-gate.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-safety-boundary.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-results.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-diagnostics.mjs',
  'package.json',
]

const confirmedClosureFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-runner.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-readiness-gate.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-safety-boundary.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-confirmed-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-confirmed-results.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-confirmed.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
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
  packet,
  'blocked_pending_external_guarded_staging_sql_execution',
  'completed_docs_only_external_staging_sql_gate_no_sql_execution',
  'passed_confirmed_supabase_target_rls_storage_validation',
  'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner',
  'Approved SQL execution in this phase: false',
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
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED',
  'supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql',
  'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TARGET_IS_STAGING=true',
  'REEDITPRO_CONFIRM_NO_PRODUCTION_SUPABASE=true',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_BACKEND_CREDENTIAL_RESOLUTION=true',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_guarded_staging_sql_execution',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_guarded_staging_sql_execution',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler was enabled.',
]

const forbidden = [
  /Approved SQL execution in this phase:\s*`?true/i,
  /Internal beta unlocked:\s*`?true/i,
  /trackAInternalBetaUnlocked:\s*`?true/i,
  /Supabase environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /readbackStatus:(?!\s*`?not_run`?)/i,
  /Secret Manager payload printed:(?!\s*`?false`?)/i,
  /production touched:(?!\s*`?false`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
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
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-source-audit.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-readiness-gate.md'),
  read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-safety-boundary.md'),
  read('docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-results.md'),
  read('docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution.md'),
  extractSection(read('implementation-status-and-next-phase.md'), 'SUPABASE-WORKER-RUNTIME Transactional RPC 4R External Staging SQL Gate'),
  extractSection(read('docs/production-beta-blocker-inventory.md'), 'SUPABASE-WORKER-RUNTIME Transactional RPC 4R External Staging SQL Gate'),
].join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbidden) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-record.json'))
if (record.decision !== 'blocked_pending_external_guarded_staging_sql_execution') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_external_staging_sql_gate_no_sql_execution') fail('record execution mismatch')
if (record.targetValidationDependency !== 'passed_confirmed_supabase_target_rls_storage_validation') fail('record target dependency mismatch')
if (record.rpc4rConfirmedClosureResult !== 'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner') fail('record RPC 4R closure result mismatch')
if (record.approvedSqlExecutionInThisPhase !== false) fail('SQL approval must be false')
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
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-4r-external-staging-sql-execution:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-4r-external-staging-sql-execution-diagnostics.mjs'
) {
  fail('missing external staging SQL gate diagnostics package script')
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
  ...confirmedClosureFiles,
  ...externalSqlHistoryBlockerFiles,
  ...migrationHistoryReconciliationFiles,
])

for (const file of changed) {
  if (!allowedChanged.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json changed')
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('supabase/migrations/') || file.startsWith('supabase/functions/')) fail(`Supabase implementation file changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('database/')) fail(`runtime file changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.mkv') || file.endsWith('.zip')) fail(`generated/media artifact changed: ${file}`)

  const text = read(file)
  for (const pattern of secretLike) {
    const match = text.match(pattern)
    if (match && !match[0].startsWith('postgresql://[redacted]')) fail(`secret-like value matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_pending_external_guarded_staging_sql_execution')
console.log('Supabase update status: blocked_sql_not_executed')
console.log('SQL executed: none')
console.log('Migration deployed: no')
