import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-source-audit.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-schema-readiness.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-rpc-readiness.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-rls-security-readiness.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-service-role-boundary.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-migration-plan.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-secret-manager-plan.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-worker-handoff.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-blocked-scope-register.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-1-next-phase-plan.md',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-1-results.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-1-migration-readiness.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-2-migration-safety-packet.md',
  'docs/implementation-prompts/prompt-worker-runtime-transactional-contract-2-supabase-rpc-schema-readiness.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2r-rerun.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 decision: completed_migration_readiness_planning_blocked_pending_migration_safety_packet',
  'Supabase update required: future_migration_required',
  'Supabase update status: planning_only',
  'Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_migration_safety_packet',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 readiness: ready_for_migration_safety_packet',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_supabase_rpc_schema_safety_packet',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_supabase_rpc_schema_implementation',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract',
  'Internal beta unlocked: false',
  'trackAInternalBetaUnlocked: false',
  'Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.',
  '2fa54b4de1db19be85400eb6ca3af3374e0d254d',
  '#334',
  '#340',
  '#343',
  '#505',
  '#516',
  '#520',
  'server/services/worker-claim-service.ts',
  'replace with transaction/RPC to avoid claim race windows',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'worker_job_claims',
  'api_idempotency_keys',
  'can_claim_worker_job',
  'active_worker_claim_exists',
  'present_in_source',
  'present_in_docs_only',
  'missing',
  'blocked_pending_migration',
  'blocked_pending_backend_runtime',
  'worker_jobs',
  'worker_job_events',
  'worker_job_artifacts',
  'approved_plan_snapshot_id',
  'restricted_scope_ref',
  'idempotency_key',
  'lease_owner',
  'lease_expires_at',
  'heartbeat_at',
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
  'Operation family: `tracka_private_e2e_revalidation`',
  'Execution allowed in this phase: false',
  'Route execution allowed now: false',
  'Persist to database: false in this phase',
  '202606180001_worker_runtime_transactional_rpc.sql',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 -- Migration safety packet',
  'Supabase environment touched: none',
  'SQL executed: none',
  'Migration deployed: no',
  'No broad service-role handler',
  'backend-only Google Secret Manager credential resolution',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const forbidden = [
  /Internal beta unlocked:\s*true/i,
  /trackAInternalBetaUnlocked:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /Supabase update status:(?!\s*`?planning_only)/i,
  /Supabase environment touched:(?!\s*`?none)/i,
  /SQL executed:(?!\s*`?none)/i,
  /Migration deployed:(?!\s*`?no)/i,
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
  /SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 decision:\s*completed_migration_readiness_planning_no_migration_needed/i,
  /Worker runtime transactional contract readiness:\s*ready_for_worker_gate_2r/i,
  /WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness:\s*ready(?!_)/i,
]

const secretLike = [
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /\bbearer\s+[A-Za-z0-9._-]{16,}/i,
  /\b(?:SUPABASE|SERVICE_ROLE|ANON|JWT|SECRET|TOKEN)[A-Z0-9_]*\s*=\s*['"]?[A-Za-z0-9._/-]{8,}/i,
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
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-1:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-1-diagnostics.mjs'
) {
  fail('missing package script: supabase-worker-runtime:transactional-rpc-1:diagnostics')
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

const allowedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/supabase-worker-runtime-transactional-rpc-1-diagnostics.mjs',
  'package.json',
])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (file === 'package-lock.json') fail('package-lock.json is changed')
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

console.log(JSON.stringify({
  status: 'passed',
  phase: 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1',
  decision: 'completed_migration_readiness_planning_blocked_pending_migration_safety_packet',
  supabaseUpdateRequired: 'future_migration_required',
  supabaseUpdateStatus: 'planning_only',
  workerRuntimeTransactionalContractReadiness: 'blocked_pending_supabase_worker_rpc_migration_safety_packet',
  supabaseWorkerRuntimeTransactionalRpc2Readiness: 'ready_for_migration_safety_packet',
  workerRuntimeTransactionalContract2Readiness: 'blocked_pending_supabase_rpc_schema_safety_packet',
  workerRuntimeTrackAPrivateE2EGate2RReadiness: 'blocked_pending_supabase_rpc_schema_implementation',
  trackAPrivateE2ERevalidation2Readiness: 'blocked_pending_worker_transactional_contract',
  internalBetaReadinessRollup: 'blocked_pending_worker_transactional_contract',
  internalBetaUnlocked: false,
  exactBlocker: 'missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement',
  noWorkerExecution: true,
  noClaimLeaseExecution: true,
  noToolRouteExecution: true,
  noProviderModelCalls: true,
  noTrackARuntimeExecution: true,
  noPrivateArtifactAccess: true,
  noGcsAccess: true,
  noSupabaseMutation: true,
  noSqlExecution: true,
  noMigrationDeployment: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noDependencyMutation: true,
  noPackageLockMutation: true,
  supabaseClassification: 'planning_only',
}, null, 2))
