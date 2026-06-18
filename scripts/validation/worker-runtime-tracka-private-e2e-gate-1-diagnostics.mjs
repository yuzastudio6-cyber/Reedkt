import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-gate-1.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-source-audit.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-job-contract.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-claim-lease-readiness.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-plan-snapshot-handoff.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-artifact-event-policy.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-qa-gate-map.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-blocked-scope-register.md',
  'docs/worker-runtime/worker-runtime-tracka-private-e2e-next-phase-plan.md',
  'docs/activation-phase-worker-runtime-tracka-private-e2e-gate-1-results.md',
  'docs/implementation-prompts/prompt-tool-route-tracka-private-e2e-execution-gate-1.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2-transactional-runtime.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1',
  'completed_repo_audit_gate_planning',
  'Worker runtime execution readiness: blocked_pending_worker_runtime_transactional_execution_gate',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_transactional_runtime_gate_planning',
  'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1 readiness: ready_for_repo_audit_or_gate_planning',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_runtime_gate_2_and_tool_route_gate',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  'trackAInternalBetaUnlocked: false',
  '#334',
  '#343',
  '#497',
  '#502',
  'e23a56d3ff76122ff5dd5edaae59156e422ffe03',
  'workerJobFamily: `tracka_private_e2e_revalidation`',
  'executionAllowedInThisPhase: false',
  'approvedPlanSnapshotRequired: true',
  'rawPromptExecutionAllowed: false',
  'privateArtifactManifestRequired: true',
  'checksumRequired: true',
  'qaReportRequired: true',
  'futureTransactionalClaimRequired: true',
  '#343 simulated claim: true',
  '#343 approved for runtime: false',
  'blocked_until_future_transactional_backend_runtime',
  'plannedLeaseTimeout: `15 minutes`',
  'plannedHeartbeatInterval: `60 seconds`',
  'transactional claim RPC or backend claim path',
  'idempotency',
  'lease timeout',
  'heartbeat',
  'retry/backoff',
  'cancellation',
  'event log persistence',
  'service-role boundary',
  'no broad service-role handler',
  'signedUrlSourceOfTruthAllowed: false',
  'publicArtifactAllowed: false',
  'finalDeliveryArtifactAllowed: false',
  'supabaseWritesInThisPhase: false',
  'SQL executed: none',
  'Supabase update status: docs_only',
  'packageLockMutationInThisPr: false',
  'prompt-worker-runtime-tracka-private-e2e-execution-gate-2-transactional-runtime.md',
  'BiRefNet/text-behind-subject/masking',
  'SAM2',
  'Real-ESRGAN',
  'FILM',
  'OpenColorIO/OpenImageIO production color',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const forbidden = [
  /trackAInternalBetaUnlocked:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /executionAllowedInThisPhase:\s*true/i,
  /workerExecutionInThisPr:\s*true/i,
  /workerClaimLeaseExecutionInThisPr:\s*true/i,
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
  /dependencyMutationInThisPr:\s*true/i,
  /packageLockMutationInThisPr:\s*true/i,
  /rawPromptExecutionAllowed:\s*true/i,
  /signedUrlSourceOfTruthAllowed:\s*true/i,
  /publicArtifactAllowed:\s*true/i,
  /finalDeliveryArtifactAllowed:\s*true/i,
  /productionArtifactAllowed:\s*true/i,
  /externalBetaArtifactAllowed:\s*true/i,
  /supabaseWritesInThisPhase:\s*true/i,
  /sqlExecutedInThisPhase:\s*true/i,
  /approved for runtime:\s*true/i,
  /claim attempted:\s*true/i,
  /worker execution:\s*(approved|enabled|allowed|ready)/i,
  /claim\/lease execution:\s*(approved|enabled|allowed|ready)/i,
  /route execution:\s*(approved|enabled|allowed|ready)/i,
  /tool execution:\s*(approved|enabled|allowed|ready)/i,
  /provider\/model call:\s*(approved|enabled|allowed|ready)/i,
  /Supabase mutation:\s*(approved|enabled|allowed|ready)/i,
  /SQL execution:\s*(approved|enabled|allowed|ready)/i,
  /signed URL source-of-truth:\s*(approved|enabled|allowed|ready)/i,
  /public artifacts:\s*(approved|enabled|allowed|ready)/i,
  /final delivery\/export:\s*(approved|enabled|allowed|ready)/i,
  /internal beta unlock:\s*(approved|enabled|allowed|ready)/i,
  /external beta unlock:\s*(approved|enabled|allowed|ready)/i,
  /production unlock:\s*(approved|enabled|allowed|ready)/i,
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
  packageJson.scripts?.['worker-runtime:tracka-private-e2e-gate-1:diagnostics'] !==
  'node scripts/validation/worker-runtime-tracka-private-e2e-gate-1-diagnostics.mjs'
) {
  fail('missing package script: worker-runtime:tracka-private-e2e-gate-1:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
if (packageLockStatus) fail(`package lock changed: ${packageLockStatus}`)

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1',
  decision: 'completed_repo_audit_gate_planning',
  workerRuntimeExecutionReadiness: 'blocked_pending_worker_runtime_transactional_execution_gate',
  workerRuntimeGate2Readiness: 'ready_for_transactional_runtime_gate_planning',
  toolRouteGate1Readiness: 'ready_for_repo_audit_or_gate_planning',
  trackAPrivateE2ERevalidation2Readiness: 'blocked_pending_worker_runtime_gate_2_and_tool_route_gate',
  internalBetaReadinessRollup: 'blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  trackAInternalBetaUnlocked: false,
  noWorkerExecution: true,
  noClaimLeaseExecution: true,
  noToolRouteExecution: true,
  noProviderModelCalls: true,
  noPrivateArtifactAccess: true,
  noSupabaseMutation: true,
  noSqlExecution: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noDependencyMutation: true,
  supabaseClassification: 'docs_only',
}, null, 2))
