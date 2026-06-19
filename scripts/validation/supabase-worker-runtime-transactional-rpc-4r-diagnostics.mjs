import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const migrationFile = 'supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql'

const requiredFiles = [
  migrationFile,
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-target-confirmation.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-secret-manager-credential-result.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-guarded-sql-execution-result.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-readback-verification.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-rollback-readiness.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-security-review.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-worker-handoff.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-blocked-scope-register.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-4r-next-phase-plan.md',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-4r-results.md',
  'docs/implementation-prompts/prompt-worker-runtime-transactional-contract-2-supabase-rpc-schema-readiness.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2r-rerun.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4r-repair-if-needed.md',
]

const requiredText = [
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R decision: blocked_pending_confirmed_staging_target_or_execution_confirmation',
  'execution: blocked_pending_guarded_staging_sql_confirmation',
  'Supabase update required: future_migration_required',
  'Supabase update status: blocked_sql_not_executed',
  'Supabase environment touched: none',
  'SQL executed: none',
  'Migration deployed: no',
  'readbackStatus: not_run',
  'Secret Manager payload printed: false',
  'production touched: false',
  'Target safety status: blocked_pending_confirmed_staging_target',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_guarded_staging_sql_execution',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_guarded_staging_sql_execution',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract',
  'Internal beta unlocked: false',
  'trackAInternalBetaUnlocked: false',
  '6e4c1c08f4f2ce44db0bbc4f2ce6139f40b253df',
  '#520',
  '#525',
  '#530',
  '#535',
  '#537',
  'supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql',
  'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE=true',
  'REEDITPRO_CONFIRM_SUPABASE_TARGET_IS_STAGING=true',
  'REEDITPRO_CONFIRM_NO_PRODUCTION_SUPABASE=true',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_BACKEND_CREDENTIAL_RESOLUTION=true',
  'Gate status: documented_only_not_set',
  'no automatic migration deployment workflow detected',
  'missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement',
  'public.worker_jobs',
  'public.worker_job_events',
  'public.worker_job_artifacts',
  'worker_runtime',
  'claim_tracka_private_e2e_job',
  'heartbeat_tracka_private_e2e_job',
  'complete_tracka_private_e2e_job',
  'fail_tracka_private_e2e_job',
  'cancel_tracka_private_e2e_job',
  'release_expired_tracka_private_e2e_leases',
  'append_tracka_private_e2e_event',
  'RLS is enabled',
  'service-role-only',
  'backend-only through Google Secret Manager',
  'Secret Manager payload access: none',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-REPAIR-IF-NEEDED -- Confirm staging target and guarded staging SQL execution',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const forbidden = [
  /Internal beta unlocked:\s*true/i,
  /trackAInternalBetaUnlocked:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /executionAllowedInThisPhase:\s*true/i,
  /routeExecutionAllowedNow:\s*true/i,
  /rawPromptExecutionAllowed:\s*true/i,
  /signedUrlSourceOfTruthAllowed:\s*true/i,
  /publicArtifactAllowed:\s*true/i,
  /finalDeliveryAllowed:\s*true/i,
  /externalBetaAllowed:\s*true/i,
  /productionAllowed:\s*true/i,
  /internalBetaUnlockAllowed:\s*true/i,
  /workerExecutionInThisPr:\s*true/i,
  /jobClaimExecutionInThisPr:\s*true/i,
  /leaseAcquisitionInThisPr:\s*true/i,
  /heartbeatExecutionInThisPr:\s*true/i,
  /routeExecutionInThisPr:\s*true/i,
  /toolExecutionInThisPr:\s*true/i,
  /providerModelCallInThisPr:\s*true/i,
  /trackARuntimeExecutionInThisPr:\s*true/i,
  /privateArtifactAccessInThisPr:\s*true/i,
  /gcsAccessInThisPr:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /supabaseMutationInThisPr:\s*true/i,
  /sqlExecutedInThisPr:\s*true/i,
  /migrationDeployedInThisPr:\s*true/i,
  /dependencyMutationInThisPr:\s*true/i,
  /packageLockMutationInThisPr:\s*true/i,
  /rawPromptExecutionInThisPr:\s*true/i,
  /finalRenderExportInThisPr:\s*true/i,
  /broadServiceRoleHandlerInThisPr:\s*true/i,
  /^SQL executed:(?![ \t]*`?none`?[ \t]*$).+$/im,
  /^Migration deployed:(?![ \t]*`?no`?[ \t]*$).+$/im,
  /^Supabase environment touched:(?![ \t]*`?none`?[ \t]*$).+$/im,
  /^readbackStatus:(?![ \t]*`?not_run`?[ \t]*$).+$/im,
  /^production touched:(?![ \t]*`?false`?[ \t]*$).+$/im,
  /SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R decision:\s*completed/i,
  /staging_migration_deployed_readback_passed/i,
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

const autoDeployPatterns = [
  /supabase\s+db\s+push/i,
  /supabase\s+migration\s+up/i,
  /supabase\s+db\s+reset/i,
  /\bpsql\b/i,
  /deploy.*supabase\/migrations/i,
  /supabase\/migrations.*deploy/i,
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  return readFileSync(file, 'utf8')
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-4r:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-4r-diagnostics.mjs'
) {
  fail('missing package script: supabase-worker-runtime:transactional-rpc-4r:diagnostics')
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbidden) {
  if (pattern.test(allText)) fail(`forbidden claim matched: ${pattern}`)
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (packageLockStatus) fail(`package-lock.json changed: ${packageLockStatus}`)

const changedFiles = execFileSync('git', ['diff', '--name-only'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)

const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)

const untrackedFiles = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)

const allowedFiles = new Set([
  ...requiredFiles.filter((file) => file !== migrationFile),
  'scripts/validation/supabase-worker-runtime-transactional-rpc-4r-diagnostics.mjs',
  'package.json',
])

const allChanged = [...new Set([...changedFiles, ...stagedFiles, ...untrackedFiles])]
const migrationChanges = allChanged.filter((file) => file.startsWith('supabase/migrations/'))

if (migrationChanges.length !== 0) {
  fail(`RPC-4R must not change migration files, got: ${migrationChanges.join(', ')}`)
}

for (const file of allChanged) {
  if (file === 'package-lock.json') fail('package-lock.json is changed')
  if (file.includes('/._') || file.startsWith('._')) fail(`AppleDouble metadata file present: ${file}`)
  if (file.endsWith('.sql')) fail(`unexpected SQL file changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('database/')) {
    fail(`runtime/source file changed: ${file}`)
  }
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.startsWith('.github/workflows/')) fail(`workflow file changed: ${file}`)
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

const migrationText = read(migrationFile)
const migrationRequired = [
  'create schema if not exists worker_runtime',
  'create table if not exists public.worker_jobs',
  'create table if not exists public.worker_job_events',
  'create table if not exists public.worker_job_artifacts',
  'create or replace function worker_runtime.claim_tracka_private_e2e_job',
  'for update skip locked',
  'security definer',
  'alter table public.worker_jobs enable row level security',
  'alter table public.worker_job_events enable row level security',
  'alter table public.worker_job_artifacts enable row level security',
  'grant usage on schema worker_runtime to service_role',
]

for (const token of migrationRequired) {
  if (!migrationText.toLowerCase().includes(token.toLowerCase())) {
    fail(`migration source missing required token: ${token}`)
  }
}

for (const file of allChanged) {
  const text = read(file)
  for (const pattern of secretLike) {
    if (pattern.test(text)) fail(`secret-like value matched in ${file}: ${pattern}`)
  }
}

const workflowFiles = execFileSync('git', ['ls-files', '.github/workflows'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)

for (const file of workflowFiles) {
  const text = read(file)
  for (const pattern of autoDeployPatterns) {
    if (pattern.test(text)) fail(`auto-deploy migration workflow pattern matched in ${file}: ${pattern}`)
  }
}

console.log('SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R diagnostics passed')
console.log('Supabase classification: blocked_sql_not_executed')
console.log('Supabase environment touched: none')
console.log('SQL executed: none')
console.log('Migration deployed: no')
console.log('readbackStatus: not_run')
console.log('Target safety status: blocked_pending_confirmed_staging_target')
