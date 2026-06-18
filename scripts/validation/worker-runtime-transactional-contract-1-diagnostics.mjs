import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/worker-runtime/worker-runtime-transactional-contract-1.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-source-audit.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-rpc-requirements.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-schema-requirements.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-claim-lease-state-machine.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-idempotency-retry-cancel.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-event-log-persistence.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-service-role-boundary.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-security-rls-readiness.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-supabase-handoff.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-tracka-private-e2e-handoff.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-blocked-scope-register.md',
  'docs/worker-runtime/worker-runtime-transactional-contract-1-next-phase-plan.md',
  'docs/activation-phase-worker-runtime-transactional-contract-1-results.md',
  'docs/implementation-prompts/prompt-worker-runtime-transactional-contract-2-supabase-rpc-schema-readiness.md',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-1-migration-readiness.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2r-rerun.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision: completed_contract_completion_plan_blocked_pending_rpc_schema_implementation',
  'Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_schema_readiness',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 readiness: ready_for_migration_readiness_planning',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_transactional_contract_implementation',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract',
  'Internal beta unlocked: false',
  'trackAInternalBetaUnlocked: false',
  '#334',
  '#340',
  '#343',
  '#347',
  '#375',
  '#380',
  '#497',
  '#502',
  '#505',
  '#510',
  '#513',
  '#516',
  '73eb9f808920d7c8acb8c9a7e390b5a0442a0f26',
  'Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.',
  'server/services/worker-claim-service.ts',
  'replace with transaction/RPC to avoid claim race windows',
  'can_claim_worker_job',
  'active_worker_claim_exists',
  'worker_job_claims',
  'api_idempotency_keys',
  'signed_url_events',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'claim_tracka_private_e2e_job',
  'heartbeat_tracka_private_e2e_job',
  'complete_tracka_private_e2e_job',
  'fail_tracka_private_e2e_job',
  'cancel_tracka_private_e2e_job',
  'release_expired_tracka_private_e2e_leases',
  'append_tracka_private_e2e_event',
  'workerJobFamily: `tracka_private_e2e_revalidation`',
  'claimMode: `future_transactional_backend_or_rpc_only`',
  'executionAllowedInThisPhase: false',
  'routeExecutionAllowedNow: false',
  'persistToDatabase: false in this phase',
  'approvedPlanSnapshotRequired: true',
  'toolRouteGateRequired: true',
  'workerGateRequired: true',
  'idempotencyRequired: true',
  'leaseTimeoutRequired: true',
  'heartbeatRequired: true',
  'cancellationRequired: true',
  'retryBackoffRequired: true',
  'eventLogRequired: true',
  'artifactManifestRequired: true',
  'checksumRequired: true',
  'QAReportRequired: true',
  'signedUrlSourceOfTruthAllowed: false',
  'publicArtifactAllowed: false',
  'finalDeliveryAllowed: false',
  'internalBetaUnlockAllowed: false',
  'Supabase update required: docs/status only',
  'Supabase update status: docs_only',
  'Supabase environment touched: none',
  'SQL executed: none',
  'Migration deployed: no',
  'Next Supabase action: SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 migration readiness planning',
  'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 -- Migration readiness planning',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R -- Rerun after transactional contract implementation',
  'prompt-worker-runtime-transactional-contract-2-supabase-rpc-schema-readiness.md',
  'prompt-supabase-worker-runtime-transactional-rpc-1-migration-readiness.md',
  'prompt-worker-runtime-tracka-private-e2e-execution-gate-2r-rerun.md',
  'BiRefNet/text-behind-subject/masking',
  'SAM2',
  'Real-ESRGAN',
  'FILM',
  'OpenColorIO/OpenImageIO production color',
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
  /workerExecutionInThisPr:\s*true/i,
  /jobClaimExecutionInThisPr:\s*true/i,
  /leaseAcquisitionInThisPr:\s*true/i,
  /heartbeatExecutionInThisPr:\s*true/i,
  /serviceRoleWorkerRuntimeInThisPr:\s*true/i,
  /toolRouteExecutionInThisPr:\s*true/i,
  /providerModelCallInThisPr:\s*true/i,
  /trackARuntimeExecutionInThisPr:\s*true/i,
  /ffmpegExecutionInThisPr:\s*true/i,
  /ffprobeExecutionInThisPr:\s*true/i,
  /libassExecutionInThisPr:\s*true/i,
  /remotionExecutionInThisPr:\s*true/i,
  /mediaProcessingInThisPr:\s*true/i,
  /gcsAccessInThisPr:\s*true/i,
  /privateArtifactAccessInThisPr:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /supabaseMutationInThisPr:\s*true/i,
  /sqlExecutedInThisPr:\s*true/i,
  /billingCreditMutationInThisPr:\s*true/i,
  /dependencyMutationInThisPr:\s*true/i,
  /packageLockMutationInThisPr:\s*true/i,
  /rawPromptExecutionInThisPr:\s*true/i,
  /finalRenderExportInThisPr:\s*true/i,
  /broadServiceRoleHandlerInThisPr:\s*true/i,
  /rawPromptExecutionAllowed:\s*true/i,
  /signedUrlSourceOfTruthAllowed:\s*true/i,
  /publicArtifactAllowed:\s*true/i,
  /finalDeliveryAllowed:\s*true/i,
  /internalBetaUnlockAllowed:\s*true/i,
  /externalBetaAllowed:\s*true/i,
  /productionAllowed:\s*true/i,
  /sqlExecutedInThisPhase:\s*true/i,
  /WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision:\s*completed_contract_completion_plan_ready_for_gate_2_rerun/i,
  /Worker runtime transactional contract readiness:\s*ready_for_worker_gate_2_rerun/i,
  /WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness:\s*ready(?!_)/i,
  /TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness:\s*blocked_pending_worker_gate_2_rerun/i,
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
  packageJson.scripts?.['worker-runtime:transactional-contract-1:diagnostics'] !==
  'node scripts/validation/worker-runtime-transactional-contract-1-diagnostics.mjs'
) {
  fail('missing package script: worker-runtime:transactional-contract-1:diagnostics')
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

for (const file of [...changedFiles, ...stagedFiles]) {
  if (file === 'package-lock.json') fail('package-lock.json is changed')
  if (file.startsWith('supabase/migrations/')) fail(`migration file changed: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('database/')) {
    fail(`runtime/source file changed: ${file}`)
  }
}

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1',
  decision: 'completed_contract_completion_plan_blocked_pending_rpc_schema_implementation',
  workerRuntimeTransactionalContractReadiness: 'blocked_pending_supabase_worker_rpc_schema_readiness',
  supabaseWorkerRuntimeTransactionalRpc1Readiness: 'ready_for_migration_readiness_planning',
  workerRuntimeTrackAPrivateE2EGate2RReadiness: 'blocked_pending_transactional_contract_implementation',
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
  noPublicArtifacts: true,
  noSignedUrls: true,
  noDependencyMutation: true,
  noPackageLockMutation: true,
  supabaseClassification: 'docs_only',
}, null, 2))
