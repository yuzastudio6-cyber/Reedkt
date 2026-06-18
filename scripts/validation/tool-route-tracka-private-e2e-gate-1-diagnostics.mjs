import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/tool-routes/tool-route-tracka-private-e2e-gate-1.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-source-audit.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-route-contract.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-route-family-matrix.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-worker-handoff.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-artifact-event-policy.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-qa-gate-map.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-blocked-scope-register.md',
  'docs/tool-routes/tool-route-tracka-private-e2e-next-phase-plan.md',
  'docs/activation-phase-tool-route-tracka-private-e2e-gate-1-results.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-2-transactional-runtime.md',
  'docs/implementation-prompts/prompt-tool-route-tracka-private-e2e-execution-gate-2-route-contract-dry-run.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
]

const requiredText = [
  'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1',
  'completed_repo_audit_gate_planning',
  'Tool Route execution readiness: blocked_pending_tool_route_contract_dry_run_gate',
  'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_route_contract_dry_run_gate_planning',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: ready_for_transactional_runtime_gate_planning',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_runtime_gate_2_and_tool_route_gate_2',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  'Internal beta unlocked: false',
  '#347',
  '#375',
  '#380',
  '#502',
  '#505',
  '7436ffd1de24d9666150aa552464997d3eedaddf',
  'routeFamily: `tracka_private_e2e_revalidation`',
  'executionMode: `future_guarded_private_e2e_only`',
  'workerJobFamily: `tracka_private_e2e_revalidation`',
  'workerRuntimeGateRequired: true',
  'workerRuntimeGateSource: #505 and future Worker Gate 2',
  'approvedPlanSnapshotRequired: true',
  'toolRouteGateRequired: true',
  'rawPromptExecutionAllowed: false',
  'signedUrlSourceOfTruthAllowed: false',
  'publicArtifactAllowed: false',
  'privateArtifactManifestRequired: true',
  'checksumRequired: true',
  'QAReportRequired: true',
  'executionAllowedInThisPhase: false',
  'tracka_private_e2e_revalidation',
  'planned_allowed_future_guarded',
  'tracka_corrected_caption_burnin',
  'included_as_private_evidence_dependency',
  'tracka_ffmpeg_ffprobe_private_validation',
  'tracka_remotion_private_preview',
  'included_if_current_source_evidence_sufficient',
  'public_artifact_delivery',
  'signed_url_delivery_or_source_of_truth',
  'final_delivery_export',
  'broad_arbitrary_user_media',
  'birefnet_sam2_realesrgan_film_scope',
  'routeEventLogPlanRequired: true',
  'Supabase update status: docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'prompt-tool-route-tracka-private-e2e-execution-gate-2-route-contract-dry-run.md',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const forbidden = [
  /Internal beta unlocked:\s*true/i,
  /trackAInternalBetaUnlocked:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /executionAllowedInThisPhase:\s*true/i,
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
  /dependencyMutationInThisPr:\s*true/i,
  /packageLockMutationInThisPr:\s*true/i,
  /rawPromptExecutionInThisPr:\s*true/i,
  /finalRenderExportInThisPr:\s*true/i,
  /rawPromptExecutionAllowed:\s*true/i,
  /signedUrlSourceOfTruthAllowed:\s*true/i,
  /publicArtifactAllowed:\s*true/i,
  /finalDeliveryAllowed:\s*true/i,
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
  packageJson.scripts?.['tool-route:tracka-private-e2e-gate-1:diagnostics'] !==
  'node scripts/validation/tool-route-tracka-private-e2e-gate-1-diagnostics.mjs'
) {
  fail('missing package script: tool-route:tracka-private-e2e-gate-1:diagnostics')
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
  phase: 'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1',
  decision: 'completed_repo_audit_gate_planning',
  toolRouteExecutionReadiness: 'blocked_pending_tool_route_contract_dry_run_gate',
  toolRouteGate2Readiness: 'ready_for_route_contract_dry_run_gate_planning',
  workerRuntimeGate2Readiness: 'ready_for_transactional_runtime_gate_planning',
  trackAPrivateE2ERevalidation2Readiness: 'blocked_pending_worker_runtime_gate_2_and_tool_route_gate_2',
  internalBetaReadinessRollup: 'blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  internalBetaUnlocked: false,
  noRouteExecution: true,
  noToolExecution: true,
  noWorkerExecution: true,
  noProviderModelCalls: true,
  noTrackARuntimeExecution: true,
  noMediaProcessing: true,
  noPrivateArtifactAccess: true,
  noSupabaseMutation: true,
  noSqlExecution: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noDependencyMutation: true,
  supabaseClassification: 'docs_only',
}, null, 2))
