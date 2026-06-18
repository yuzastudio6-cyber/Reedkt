import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-source-audit.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-transactional-readiness.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-claim-lease-contract.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-idempotency-retry-cancel-plan.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-event-log-contract.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-service-role-boundary.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-plan-snapshot-handoff.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-artifact-qa-policy.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-blocked-scope-register.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-2-next-phase-plan.md',
  'docs/activation-phase-worker-runtime-tracka-private-e2e-gate-2-results.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2-transactional-runtime.md',
  'docs/implementation-prompts/prompt-worker-runtime-transactional-contract-1.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-3-if-needed.md',
  'docs/implementation-prompts/prompt-supabase-tracka-worker-runtime-milestone-sync-if-needed.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2',
  'blocked_pending_transactional_runtime_contract_completion',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 decision: blocked_pending_transactional_runtime_contract_completion',
  'Worker runtime execution readiness: blocked_pending_transactional_backend_or_rpc_contract',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: blocked_pending_transactional_runtime_contract_completion',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_runtime_gate_2_completion',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_runtime_gate_2',
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
  'e31c58b4063a2b924852f4fd89770c243079f3ad',
  'f33b36e246268ce4231045ed6aab8de46ef1ac94',
  '82672f2cda8c4f84e970a6a2275a7802ed3954ea',
  'ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49',
  'b1fc1d40c5a41c6e3874331d2ed84dc7072d7364',
  '809c4ec3d3c54c7629d90a35fcc89eeff527cf2b',
  '59f82beb641fd772bfeddc8a244f148c3dbb267a',
  'e23a56d3ff76122ff5dd5edaae59156e422ffe03',
  '7436ffd1de24d9666150aa552464997d3eedaddf',
  '0c7eab149615b3700a0eea38a2d10c34420fe6da',
  'eed130e64b680c30b26a020099f3b51f58e2b339',
  '#343 claim attempted: false',
  '#343 simulated claim: true',
  '#343 approved for runtime: false',
  'blocked_until_future_transactional_backend_runtime',
  'Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.',
  'WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 -- Track A private E2E worker claim/lease/RPC contract completion plan',
  'docs/implementation-prompts/prompt-worker-runtime-transactional-contract-1.md',
  'Transactional RPC required: true',
  'persistToDatabase: false',
  'workerJobFamily: `tracka_private_e2e_revalidation`',
  'claimMode: `future_transactional_backend_or_rpc_only`',
  'executionAllowedInThisPhase: false',
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
  '`worker_job_contract`',
  '`approved_plan_snapshot_reference`',
  '`job_claim_transactionality`',
  '`lease_timeout`',
  '`heartbeat_contract`',
  '`idempotency_key`',
  '`retry_backoff_policy`',
  '`cancellation_contract`',
  '`event_log_contract`',
  '`artifact_manifest_contract`',
  '`checksum_contract`',
  '`qa_report_contract`',
  '`service_role_boundary`',
  '`no_broad_service_role_handler`',
  '`no_public_artifact`',
  '`no_signed_url_source_of_truth`',
  '`no_supabase_write_in_this_phase`',
  '`no_worker_execution_in_this_phase`',
  'Supabase update status: docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'packageLockMutationInThisPr: false',
  'prompt-worker-runtime-transactional-contract-1.md',
  'prompt-worker-runtime-tracka-private-e2e-execution-gate-3-if-needed.md',
  'prompt-supabase-tracka-worker-runtime-milestone-sync-if-needed.md',
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
  /supabaseWritesInThisPhase:\s*true/i,
  /sqlExecutedInThisPhase:\s*true/i,
  /WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 decision:\s*completed_transactional_runtime_gate_planning/i,
  /Worker runtime execution readiness:\s*blocked_pending_future_guarded_worker_execution_confirmation/i,
  /WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness:\s*completed/i,
  /TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness:\s*ready_for_guarded_execution_packet_planning_after_worker_and_tool_route_gates/i,
  /INTERNAL-BETA-READINESS-ROLLUP readiness:\s*blocked_pending_tracka_private_e2e_execution_packet(?!_and_worker_tool_route_gates)/i,
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
  packageJson.scripts?.['worker-runtime:tracka-private-e2e-gate-2:diagnostics'] !==
  'node scripts/validation/worker-runtime-tracka-private-e2e-gate-2-diagnostics.mjs'
) {
  fail('missing package script: worker-runtime:tracka-private-e2e-gate-2:diagnostics')
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
}

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2',
  decision: 'blocked_pending_transactional_runtime_contract_completion',
  workerRuntimeExecutionReadiness: 'blocked_pending_transactional_backend_or_rpc_contract',
  workerRuntimeGate2Readiness: 'blocked_pending_transactional_runtime_contract_completion',
  trackAPrivateE2ERevalidation2Readiness: 'blocked_pending_worker_runtime_gate_2_completion',
  internalBetaReadinessRollup: 'blocked_pending_worker_runtime_gate_2',
  internalBetaUnlocked: false,
  blocker: 'blocked_until_future_transactional_backend_runtime',
  noWorkerExecution: true,
  noClaimLeaseExecution: true,
  noToolRouteExecution: true,
  noProviderModelCalls: true,
  noTrackARuntimeExecution: true,
  noFfmpegExecution: true,
  noFfprobeExecution: true,
  noLibassExecution: true,
  noRemotionExecution: true,
  noMediaProcessing: true,
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
