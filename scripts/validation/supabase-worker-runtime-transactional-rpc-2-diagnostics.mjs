import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-target-safety-check.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-migration-safety-plan.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-proposed-schema-contract.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-proposed-rpc-contract.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-rls-security-plan.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-service-role-boundary.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-secret-manager-plan.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-confirmation-gates.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-rollback-readiness.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-non-executable-sql-draft.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-worker-handoff.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-blocked-scope-register.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-2-next-phase-plan.md',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-2-results.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-2-migration-safety-packet.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-3-static-migration-implementation.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-4-guarded-staging-sql-execution.md',
  'docs/implementation-prompts/prompt-worker-runtime-transactional-contract-2-supabase-rpc-schema-readiness.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2r-rerun.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 decision: completed_migration_safety_packet_ready_for_static_migration_implementation',
  'Supabase update required: future_migration_required',
  'Supabase update status: safety_packet_complete_sql_not_executed',
  'SQL executed: none',
  'Migration deployed: no',
  'Supabase environment touched: none',
  'Target safety status: blocked_pending_confirmed_staging_target',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 readiness: ready_for_static_migration_implementation_packet',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 readiness: blocked_pending_static_migration_packet',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_supabase_rpc_schema_static_migration',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_supabase_rpc_schema_implementation',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract',
  'Internal beta unlocked: false',
  'trackAInternalBetaUnlocked: false',
  '10c6fee6fe52cbf4379369c55b52140cdd7f36b5',
  '#520',
  '#525',
  'Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.',
  'server/services/worker-claim-service.ts',
  'replace with transaction/RPC to avoid claim race windows',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'worker_job_claims',
  'api_idempotency_keys',
  'can_claim_worker_job',
  'active_worker_claim_exists',
  'tracka_private_e2e_revalidation',
  'worker_jobs',
  'worker_job_events',
  'worker_job_artifacts',
  'approved_plan_snapshot_id',
  'restricted_scope_ref',
  'idempotency_key',
  'lease_owner',
  'lease_expires_at',
  'heartbeat_at',
  'retry_count',
  'retry_after',
  'cancel_requested_at',
  'artifact_manifest_ref',
  'qa_report_ref',
  'event_payload_sanitized',
  'private_artifact_ref',
  'sha256',
  'claim_tracka_private_e2e_job',
  'heartbeat_tracka_private_e2e_job',
  'complete_tracka_private_e2e_job',
  'fail_tracka_private_e2e_job',
  'cancel_tracka_private_e2e_job',
  'release_expired_tracka_private_e2e_leases',
  'append_tracka_private_e2e_event',
  'FOR UPDATE SKIP LOCKED',
  'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE=true',
  'backend-only Google Secret Manager credential resolution',
  'NON-EXECUTABLE DRAFT - DO NOT RUN',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 -- Static migration implementation packet',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 -- Guarded staging SQL execution',
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
  /SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 readiness:\s*ready(?!_)/i,
  /WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness:\s*ready(?!_)/i,
  /TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness:\s*ready(?!_)/i,
]

const secretLike = [
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /\bbearer\s+[A-Za-z0-9._-]{16,}/i,
  /\b(?:SUPABASE|SERVICE_ROLE|ANON|JWT|SECRET|TOKEN)[A-Z0-9_]*\s*=\s*['"]?[A-Za-z0-9._/-]{12,}/i,
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-2:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-2-diagnostics.mjs'
) {
  fail('missing package script: supabase-worker-runtime:transactional-rpc-2:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (packageLockStatus) fail(`package lock changed: ${packageLockStatus}`)

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
  ...requiredFiles,
  'scripts/validation/supabase-worker-runtime-transactional-rpc-2-diagnostics.mjs',
  'package.json',
])

for (const file of [...changedFiles, ...stagedFiles, ...untrackedFiles]) {
  if (file === 'package-lock.json') fail('package-lock.json is changed')
  if (file.includes('/._') || file.startsWith('._')) fail(`AppleDouble metadata file present: ${file}`)
  if (file.startsWith('supabase/migrations/')) fail(`migration file changed: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('database/')) {
    fail(`runtime/source file changed: ${file}`)
  }
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

for (const file of requiredFiles) {
  const text = readFileSync(file, 'utf8')
  for (const pattern of secretLike) {
    if (pattern.test(text)) fail(`secret-like value matched in ${file}: ${pattern}`)
  }
}

console.log('SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 diagnostics passed')
console.log('Supabase classification: safety_packet_complete_sql_not_executed')
console.log('Supabase environment touched: none')
console.log('SQL executed: none')
console.log('Migration deployed: no')
console.log('Target safety status: blocked_pending_confirmed_staging_target')
