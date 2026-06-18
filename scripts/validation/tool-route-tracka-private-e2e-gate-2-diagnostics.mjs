import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-source-audit.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-route-contract-dry-run.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-synthetic-route-fixture.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-allow-deny-matrix.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-worker-runtime-handoff.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-artifact-event-policy.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-qa-gate-map.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-blocked-scope-register.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-2-next-phase-plan.md',
  'docs/activation-phase-tool-route-tracka-private-e2e-gate-2-results.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2-transactional-runtime.md',
  'docs/implementation-prompts/prompt-tool-route-tracka-private-e2e-execution-gate-3-if-needed.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2',
  'completed_route_contract_dry_run_gate_planning',
  'Tool Route execution readiness: blocked_pending_future_guarded_execution_packet_and_worker_gate_2',
  'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: completed',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_transactional_runtime_gate_planning',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_runtime_gate_2_and_guarded_execution_packet',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  'Internal beta unlocked: false',
  '#347',
  '#375',
  '#380',
  '#502',
  '#505',
  '#510',
  '0c7eab149615b3700a0eea38a2d10c34420fe6da',
  'routeFamily: `tracka_private_e2e_revalidation`',
  'dryRunOnly: true',
  'executionAllowedInThisPhase: false',
  'workerRuntimeGateRequired: true',
  'workerRuntimeGateSource: #505 and future Worker Gate 2',
  'toolRouteGateSource: #510 and this Gate 2',
  'approvedPlanSnapshotRequired: true',
  'approvedPlanSnapshotSource: #334/#343/#502 lineage',
  'allowedScope: restricted Track A scope from #502/#497',
  'excludedScope: BiRefNet/SAM2/Real-ESRGAN/FILM/broad media/public delivery/final delivery',
  'rawPromptExecutionAllowed: false',
  'signedUrlSourceOfTruthAllowed: false',
  'publicArtifactAllowed: false',
  'finalDeliveryAllowed: false',
  'externalBetaAllowed: false',
  'productionAllowed: false',
  'privateArtifactManifestRequired: true',
  'checksumRequired: true',
  'QAReportRequired: true',
  'eventLogRequired: true',
  'persistToDatabase: false in this phase',
  'routeExecutionAllowedNow: false',
  'fixtureId: `tracka-private-e2e-route-contract-fixture-v1`',
  'requestedCapabilities',
  'excludedCapabilities',
  'expectedRouteDecision: `planned_allowed_future_guarded`',
  'executionAllowedNow: false',
  'requiresWorkerGate2: true',
  'requiresToolRouteGate2: true',
  'requiresGuardedTrackAExecutionPacket: true',
  'expectedArtifacts',
  'blockedArtifacts',
  'private artifact manifest',
  'checksums',
  'QA report',
  'FFprobe validation metadata',
  'public artifact',
  'signed URL',
  'final delivery artifact',
  'allow/deny matrix',
  'Worker Runtime handoff',
  'Artifact/Event Policy',
  'QA Gate Map',
  'Blocked Scope Register',
  'Supabase update status: docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'prompt-tool-route-tracka-private-e2e-execution-gate-3-if-needed.md',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const forbidden = [
  /Internal beta unlocked:\s*true/i,
  /trackAInternalBetaUnlocked:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /executionAllowedInThisPhase:\s*true/i,
  /routeExecutionAllowedNow:\s*true/i,
  /executionAllowedNow:\s*true/i,
  /routeExecutionInThisPr:\s*true/i,
  /toolExecutionInThisPr:\s*true/i,
  /workerExecutionInThisPr:\s*true/i,
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
  /rawPromptExecutionAllowed:\s*true/i,
  /signedUrlSourceOfTruthAllowed:\s*true/i,
  /publicArtifactAllowed:\s*true/i,
  /finalDeliveryAllowed:\s*true/i,
  /externalBetaAllowed:\s*true/i,
  /productionAllowed:\s*true/i,
  /productionArtifactAllowed:\s*true/i,
  /externalBetaArtifactAllowed:\s*true/i,
  /supabaseWritesInThisPhase:\s*true/i,
  /sqlExecutedInThisPhase:\s*true/i,
  /route execution:\s*(approved|enabled|allowed|ready)/i,
  /tool execution:\s*(approved|enabled|allowed|ready)/i,
  /worker execution:\s*(approved|enabled|allowed|ready)/i,
  /provider\/model calls?:\s*(approved|enabled|allowed|ready)/i,
  /Track A runtime execution:\s*(approved|enabled|allowed|ready)/i,
  /Supabase mutation:\s*(approved|enabled|allowed|ready)/i,
  /SQL execution:\s*(approved|enabled|allowed|ready)/i,
  /signed URL source-of-truth:\s*(approved|enabled|allowed|ready)/i,
  /public artifacts?:\s*(approved|enabled|allowed|ready)/i,
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
  packageJson.scripts?.['tool-route:tracka-private-e2e-gate-2:diagnostics'] !==
  'node scripts/validation/tool-route-tracka-private-e2e-gate-2-diagnostics.mjs'
) {
  fail('missing package script: tool-route:tracka-private-e2e-gate-2:diagnostics')
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
  phase: 'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2',
  decision: 'completed_route_contract_dry_run_gate_planning',
  toolRouteExecutionReadiness: 'blocked_pending_future_guarded_execution_packet_and_worker_gate_2',
  toolRouteGate2Readiness: 'completed',
  workerRuntimeGate2Readiness: 'ready_for_transactional_runtime_gate_planning',
  trackAPrivateE2ERevalidation2Readiness: 'blocked_pending_worker_runtime_gate_2_and_guarded_execution_packet',
  internalBetaReadinessRollup: 'blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  internalBetaUnlocked: false,
  noRouteExecution: true,
  noToolExecution: true,
  noWorkerExecution: true,
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
