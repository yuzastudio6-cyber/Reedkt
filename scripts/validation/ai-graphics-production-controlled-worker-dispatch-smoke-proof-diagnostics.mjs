import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision =
  'ai_graphics_production_controlled_worker_dispatch_smoke_proof_blocked_before_runtime'
const acceptedStatus =
  'production_controlled_worker_dispatch_smoke_blocked_by_worker_mode'
const runScriptName = 'ai-graphics:production-controlled-worker-dispatch-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:production-controlled-worker-dispatch-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-controlled-worker-dispatch-smoke-proof-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts',
  'server/cli/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts',
  'scripts/validation/ai-graphics-production-controlled-worker-dispatch-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/production-controlled-dispatch-authorization-proof.json',
  'docs/tool-intelligence/ai-graphics/production-service-role-queue-transaction-dry-proof.json',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-router.ts',
  'docs/production-beta-readiness-scorecard.md',
  'server/tool-registry/index.ts',
  'package.json',
]

const all21Tools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const all12Capabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
]

const gpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const privateControlsArgs = [
  '--production-owner-approval-ref',
  'private://ai-graphics/production/owner-approval',
  '--production-support-runbook-ref',
  'backend://ai-graphics/production/support-runbook',
  '--production-incident-response-ref',
  'production-evidence://ai-graphics/production/incident-response',
  '--production-rollback-kill-switch-ref',
  'private://ai-graphics/production/rollback-kill-switch',
  '--production-cost-concurrency-ceiling-ref',
  'backend://ai-graphics/production/cost-concurrency-ceiling',
  '--production-monitoring-alerting-ref',
  'production-evidence://ai-graphics/production/monitoring-alerting',
  '--production-post-launch-review-ref',
  'private://ai-graphics/production/post-launch-review',
  '--production-credit-ledger-approval-snapshot-ref',
  'backend://ai-graphics/production/credit-ledger-approval-snapshot',
  '--production-tool-route-deployment-ref',
  'production-evidence://ai-graphics/production/tool-route-deployment',
  '--production-worker-deployment-ref',
  'private://ai-graphics/production/worker-deployment',
  '--production-privacy-retention-ref',
  'backend://ai-graphics/production/privacy-retention',
  '--production-private-artifact-controls-ref',
  'production-evidence://ai-graphics/production/private-artifact-controls',
  '--production-canary-cohort-ref',
  'private://ai-graphics/production/canary-cohort',
  '--production-launch-approver-role',
  'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
]

const privateGoNoGoArgs = [
  '--production-final-go-no-go-approval-ref',
  'private://ai-graphics/production/final-go-no-go-approval',
  '--production-traffic-cutover-plan-ref',
  'backend://ai-graphics/production/traffic-cutover-plan',
  '--production-feature-flag-cutover-ref',
  'production-evidence://ai-graphics/production/feature-flag-cutover',
  '--production-canary-ramp-plan-ref',
  'private://ai-graphics/production/canary-ramp-plan',
  '--production-rollback-operator-ack-ref',
  'backend://ai-graphics/production/rollback-operator-ack',
  '--production-monitoring-on-call-ack-ref',
  'production-evidence://ai-graphics/production/monitoring-on-call-ack',
  '--production-cost-ceiling-final-ack-ref',
  'private://ai-graphics/production/cost-ceiling-final-ack',
  '--production-privacy-retention-final-ack-ref',
  'backend://ai-graphics/production/privacy-retention-final-ack',
  '--production-post-cutover-review-schedule-ref',
  'production-evidence://ai-graphics/production/post-cutover-review-schedule',
  '--production-launch-approver-role',
  'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
]

const privateCutoverArgs = [
  '--production-traffic-switch-approval-ref',
  'private://ai-graphics/production/traffic-switch-approval',
  '--production-route-readiness-ref',
  'backend://ai-graphics/production/route-readiness',
  '--production-worker-readiness-ref',
  'production-evidence://ai-graphics/production/worker-readiness',
  '--production-private-artifact-store-ref',
  'private://ai-graphics/production/private-artifact-store',
  '--production-monitoring-live-dashboard-ref',
  'backend://ai-graphics/production/monitoring-live-dashboard',
  '--production-rollback-drill-ref',
  'production-evidence://ai-graphics/production/rollback-drill',
  '--production-canary-cohort-active-ref',
  'private://ai-graphics/production/canary-cohort-active',
  '--production-support-on-call-active-ref',
  'backend://ai-graphics/production/support-on-call-active',
  '--production-cost-guardrail-live-ref',
  'production-evidence://ai-graphics/production/cost-guardrail-live',
  '--production-privacy-retention-live-ref',
  'private://ai-graphics/production/privacy-retention-live',
  '--production-post-cutover-review-owner-ref',
  'backend://ai-graphics/production/post-cutover-review-owner',
  '--production-launch-approver-role',
  'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
]

function privateGatewayArgs(sourceCutoverPacketPath) {
  return [
    '--source-production-traffic-cutover-packet',
    sourceCutoverPacketPath,
    '--execution-requested',
    '--production-workspace-id',
    'workspace-ai-graphics-production',
    '--production-project-id',
    'project-ai-graphics-production',
    '--production-request-id',
    'request-ai-graphics-production-tool-call',
    '--production-edit-plan-id',
    'edit-plan-ai-graphics-production',
    '--production-tool-execution-plan-id',
    'tool-execution-plan-ai-graphics-production',
    '--approved-plan-snapshot-id',
    'approved-snapshot-ai-graphics-production',
    '--credit-reservation-id',
    'credit-reservation-ai-graphics-production',
    '--production-route-path',
    '/api/ai-graphics/production/tool-call',
    '--production-queue-name',
    'ai-graphics-production-tool-call',
    '--production-gateway-handoff-ref',
    'private://ai-graphics/production/gateway-handoff',
    '--production-worker-handoff-candidate-ref',
    'backend://ai-graphics/production/worker-handoff-candidate',
    '--production-tool-route-approval-ref',
    'production-evidence://ai-graphics/production/tool-route-approval',
    '--production-worker-approval-ref',
    'private://ai-graphics/production/worker-approval',
    '--production-runtime-admission-ref',
    'backend://ai-graphics/production/runtime-admission',
    '--production-service-role-boundary-ref',
    'production-evidence://ai-graphics/production/service-role-boundary',
    '--production-private-artifact-manifest-ref',
    'private://ai-graphics/production/private-artifact-manifest',
    '--production-asset-manifest-ref',
    'backend://ai-graphics/production/asset-manifest',
    '--production-dependency-graph-ref',
    'production-evidence://ai-graphics/production/dependency-graph',
    '--production-cost-guardrail-decision-ref',
    'private://ai-graphics/production/cost-guardrail-decision',
    '--production-qa-policy-ref',
    'backend://ai-graphics/production/qa-policy',
    '--production-fallback-policy-ref',
    'production-evidence://ai-graphics/production/fallback-policy',
    '--production-checkback-policy-ref',
    'private://ai-graphics/production/checkback-policy',
    '--production-trace-id',
    'trace-ai-graphics-production-tool-call',
  ]
}

const privateQueueAdmissionArgs = [
  '--execution-requested',
  '--production-queue-admission-ref',
  'private://ai-graphics/production/queue-admission',
  '--production-queue-schema-ref',
  'backend://ai-graphics/production/queue-schema',
  '--production-queue-write-authorization-ref',
  'production-evidence://ai-graphics/production/queue-write-authorization',
  '--production-service-role-transaction-ref',
  'private://ai-graphics/production/service-role-transaction',
  '--production-worker-claim-policy-ref',
  'backend://ai-graphics/production/worker-claim-policy',
  '--production-worker-dispatch-block-ref',
  'production-evidence://ai-graphics/production/worker-dispatch-block',
  '--production-queue-audit-ref',
  'private://ai-graphics/production/queue-audit',
  '--production-queue-rollback-ref',
  'backend://ai-graphics/production/queue-rollback',
  '--production-queue-observability-ref',
  'production-evidence://ai-graphics/production/queue-observability',
]

const privateTransactionArgs = [
  '--execution-requested',
  '--production-service-role-queue-transaction-ref',
  'private://ai-graphics/production/service-role-queue-transaction',
  '--production-service-role-rpc-schema-ref',
  'backend://ai-graphics/production/service-role-rpc-schema',
  '--production-job-batch-table-ref',
  'production-evidence://ai-graphics/production/job-batch-table',
  '--production-job-table-ref',
  'private://ai-graphics/production/job-table',
  '--production-worker-claim-table-ref',
  'backend://ai-graphics/production/worker-claim-table',
  '--production-worker-event-table-ref',
  'production-evidence://ai-graphics/production/worker-event-table',
  '--production-audit-event-table-ref',
  'private://ai-graphics/production/audit-event-table',
  '--production-service-role-rollback-ref',
  'backend://ai-graphics/production/service-role-rollback',
  '--production-dispatch-dry-proof-ref',
  'production-evidence://ai-graphics/production/dispatch-dry-proof',
  '--production-worker-instance-ref',
  'private://ai-graphics/production/worker-instance',
  '--production-worker-lease-policy-ref',
  'backend://ai-graphics/production/worker-lease-policy',
  '--production-worker-dispatch-policy-ref',
  'production-evidence://ai-graphics/production/worker-dispatch-policy',
]

const privateAuthorizationArgs = [
  '--execution-requested',
  '--production-controlled-dispatch-authorization-granted',
  '--production-controlled-dispatch-authorization-ref',
  'private://ai-graphics/production/controlled-dispatch-authorization',
  '--production-controlled-dispatch-operator-role',
  'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR',
  '--production-worker-lease-approval-ref',
  'backend://ai-graphics/production/worker-lease-approval',
  '--production-worker-dispatch-approval-ref',
  'production-evidence://ai-graphics/production/worker-dispatch-approval',
  '--production-tool-route-execution-block-ref',
  'private://ai-graphics/production/tool-route-execution-block',
  '--production-private-artifact-runtime-binding-ref',
  'backend://ai-graphics/production/private-artifact-runtime-binding',
  '--production-cost-guardrail-runtime-ref',
  'production-evidence://ai-graphics/production/cost-guardrail-runtime',
  '--production-telemetry-runtime-ref',
  'private://ai-graphics/production/telemetry-runtime',
  '--production-rollback-runtime-ref',
  'backend://ai-graphics/production/rollback-runtime',
  '--production-post-dispatch-review-ref',
  'production-evidence://ai-graphics/production/post-dispatch-review',
]

const privateSmokeArgs = [
  '--execution-requested',
  '--production-controlled-worker-dispatch-smoke-ref',
  'private://ai-graphics/production/controlled-worker-dispatch-smoke',
  '--production-controlled-worker-dispatch-smoke-telemetry-ref',
  'backend://ai-graphics/production/controlled-worker-dispatch-smoke-telemetry',
  '--production-controlled-worker-dispatch-smoke-lease-audit-ref',
  'production-evidence://ai-graphics/production/controlled-worker-dispatch-smoke-lease-audit',
  '--production-controlled-worker-dispatch-smoke-blocked-dispatch-audit-ref',
  'private://ai-graphics/production/controlled-worker-dispatch-smoke-blocked-dispatch-audit',
  '--production-controlled-worker-dispatch-smoke-cleanup-ref',
  'backend://ai-graphics/production/controlled-worker-dispatch-smoke-cleanup',
  '--production-controlled-worker-dispatch-smoke-worker-instance-ref',
  'production-evidence://ai-graphics/production/controlled-worker-dispatch-smoke-worker-instance',
]

const trueAcceptedKeys = [
  'productionControlledWorkerDispatchSmokeProofPrepared',
  'sourceProductionControlledDispatchAuthorizationProofAccepted',
  'productionControlledWorkerDispatchSmokeControlsAccepted',
  'productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence',
  'productionWorkerDispatcherBoundaryExercised',
  'workerModeGateBlockedDispatch',
  'blockedBeforeWorkerLease',
  'blockedBeforeRouteOutput',
  'allToolRunResultsEmpty',
  'allArtifactRecordsEmpty',
  'allQualityGateResultsEmpty',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'productionControlledToolCallReadyNow',
  'productionRouteReadyNow',
  'productionWorkerPathReadyNow',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeysAlways = [
  'runtimeReadyForOnDemandProductionToolCall',
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'workerLeaseCreationApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'liveQueueWriteApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const allowedPackageDiffLines = [
  '+    "ai-graphics:production-controlled-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof": "tsx server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-traffic-enablement-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-traffic-enablement-proof-diagnostics.mjs",',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function runNpm(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function assertFalseKeys(record, label) {
  const booleans = record.booleans ?? {}
  const input = record.input ?? {}
  for (const key of falseKeysAlways) {
    if (booleans[key] !== false && input[key] !== false) {
      fail(`${label}_false_key_not_false:${key}`)
    }
  }
}

function assertAccepted(record, label, expectedToolId, expectedCapabilityId) {
  if (record.decision !== decision) fail(`${label}_decision:${record.decision}`)
  if (record.status !== acceptedStatus) fail(`${label}_status:${record.status}`)
  if (record.sourceProductionControlledDispatchAuthorizationProofAccepted !== true) {
    fail(`${label}_source_authorization_not_true`)
  }
  if (record.productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence !== true) {
    fail(`${label}_smoke_not_complete`)
  }
  if (record.rejectionReasons?.length !== 0) fail(`${label}_rejections_not_empty`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_caps_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_not_8`)
  if (record.runtimeReadyForOnDemandProductionToolCallTools !== 0) {
    fail(`${label}_runtime_ready_tools_not_0`)
  }
  if (record.productionReadyNowTools !== 0) fail(`${label}_production_tools_not_0`)
  if (record.liveWorkerLeasesCreatedNow !== 0) fail(`${label}_leases_not_0`)
  if (record.liveWorkerDispatchesNow !== 0) fail(`${label}_dispatches_not_0`)
  if (record.liveToolExecutionsNow !== 0) fail(`${label}_executions_not_0`)
  const smoke = record.controlledWorkerDispatchSmokeRecord
  if (!smoke) fail(`${label}_smoke_record_missing`)
  if (smoke?.toolId !== expectedToolId) fail(`${label}_tool_mismatch`)
  if (smoke?.capabilityId !== expectedCapabilityId) fail(`${label}_capability_mismatch`)
  if (smoke?.payloadShapeValid !== true) fail(`${label}_payload_shape_not_true`)
  if (smoke?.dispatcherEvaluated !== true) fail(`${label}_dispatcher_not_evaluated`)
  if (smoke?.dispatcherStatus !== 'blocked') fail(`${label}_dispatcher_status:${smoke?.dispatcherStatus}`)
  if (smoke?.workerModeGateStatus !== 'blocked') fail(`${label}_worker_mode_not_blocked`)
  if (smoke?.hardGateBlockCount !== 1) fail(`${label}_hard_gate_count:${smoke?.hardGateBlockCount}`)
  if (smoke?.blockedBeforeLease !== true) fail(`${label}_not_blocked_before_lease`)
  if (smoke?.blockedBeforeRouteOutput !== true) fail(`${label}_not_blocked_before_route`)
  if (smoke?.inMemoryLeaseCreated !== false) fail(`${label}_lease_created`)
  if (smoke?.inMemoryLeaseReleased !== false) fail(`${label}_lease_released`)
  if (smoke?.toolRunResultsCreated !== 0) fail(`${label}_tool_results_not_0`)
  if (smoke?.artifactRecordsCreated !== 0) fail(`${label}_artifacts_not_0`)
  if (smoke?.qualityGateResultsCreated !== 0) fail(`${label}_quality_gates_not_0`)
  if (smoke?.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_should_start_not_false`)
  for (const event of ['job_created', 'gates_started', 'gates_failed', 'job_blocked']) {
    if (!smoke?.eventNames?.includes(event)) fail(`${label}_missing_event:${event}`)
  }
  for (const key of trueAcceptedKeys) {
    if (record.booleans?.[key] !== true) fail(`${label}_true_key_not_true:${key}`)
  }
  assertFalseKeys(record, label)
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}
const packageDiff = git(['diff', '--unified=0', '--', 'package.json'])
for (const line of packageDiff.split('\n').filter((entry) => entry.startsWith('+    "'))) {
  if (!allowedPackageDiffLines.includes(line)) fail(`unexpected_package_json_addition:${line}`)
}
if (git(['diff', '--name-only', '--', 'package-lock.json']).trim().length > 0) {
  fail('package_lock_changed')
}

const indexTs = read('server/tool-registry/index.ts')
if (!indexTs.includes("export * from './ai-graphics-production-controlled-worker-dispatch-smoke-proof'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.md')
const source = read('server/tool-registry/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts')
const cli = read('server/cli/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.coverage?.runtimeReadyForOnDemandProductionToolCallTools !== 0) {
  fail('docs_runtime_ready_tools_not_0')
}
if (docs.dispatcherSmokeProof?.requiredSourceExecutionMode !== 'production_blocked') {
  fail('docs_missing_production_blocked_mode')
}
if (docs.dispatcherSmokeProof?.requiredBlockedGate !== 'worker_mode') {
  fail('docs_missing_worker_mode_gate')
}
if (docs.dispatcherSmokeProof?.blockedBeforeLease !== true) {
  fail('docs_blocked_before_lease_not_true')
}
for (const tool of all21Tools) {
  if (!docs.toolCoverage?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuToolCoverage?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const capability of all12Capabilities) {
  if (!docs.capabilityCoverage?.includes(capability)) {
    fail(`docs_missing_capability:${capability}`)
  }
}
for (const citation of [
  'production-controlled-dispatch-authorization-proof.json',
  'production-service-role-queue-transaction-dry-proof.json',
  'production-worker-queue-admission.json',
  'production-worker-dispatcher.ts',
  'production-worker-gates.ts',
  'production-worker-router.ts',
]) {
  if (!JSON.stringify(docs).includes(citation) || !docsMd.includes(citation)) {
    fail(`missing_citation:${citation}`)
  }
}
for (const key of trueAcceptedKeys) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_key_not_true:${key}`)
}
for (const key of falseKeysAlways) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_key_not_false:${key}`)
}
for (const phrase of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  '"workerLeaseCreated": true',
  '"workerDispatchPerformed": true',
  '"toolExecutionPerformed": true',
  '"gpuRuntimePerformed": true',
  '"runtimeReadyNow": true',
  '"externalBetaReadyNow": true',
  '"productionReadyNow": true',
]) {
  if (docsMd.includes(phrase) || source.includes(phrase) || cli.includes(phrase)) {
    fail(`forbidden_claim:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics Production Controlled Worker Dispatch Smoke Proof')) {
  fail('scorecard_missing_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

const tmpRoot = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-worker-dispatch-smoke-`)
const controlsPath = `${tmpRoot}/production-launch-controls.json`
const goNoGoPath = `${tmpRoot}/production-launch-go-no-go.json`
const cutoverPath = `${tmpRoot}/production-traffic-cutover.json`
const sam2HandoffPath = `${tmpRoot}/sam2-production-gateway-handoff.json`
const vegaLiteHandoffPath = `${tmpRoot}/vega-lite-production-gateway-handoff.json`
const sam2QueueAdmissionPath = `${tmpRoot}/sam2-production-queue-admission.json`
const vegaLiteQueueAdmissionPath = `${tmpRoot}/vega-lite-production-queue-admission.json`
const sam2DryProofPath = `${tmpRoot}/sam2-production-service-role-dry-proof.json`
const vegaLiteDryProofPath = `${tmpRoot}/vega-lite-production-service-role-dry-proof.json`
const sam2AuthorizationPath = `${tmpRoot}/sam2-production-dispatch-authorization.json`
const vegaLiteAuthorizationPath = `${tmpRoot}/vega-lite-production-dispatch-authorization.json`

const controlsPacket = runNpm('ai-graphics:production-launch-controls', privateControlsArgs)
writeJson(controlsPath, controlsPacket)
const goNoGoPacket = runNpm('ai-graphics:production-launch-go-no-go', [
  '--production-launch-controls-packet',
  controlsPath,
  ...privateGoNoGoArgs,
])
writeJson(goNoGoPath, goNoGoPacket)
const cutoverPacket = runNpm('ai-graphics:production-traffic-cutover', [
  '--production-launch-go-no-go-packet',
  goNoGoPath,
  ...privateCutoverArgs,
])
writeJson(cutoverPath, cutoverPacket)

const sam2Handoff = runNpm('ai-graphics:production-tool-call-gateway-handoff', [
  ...privateGatewayArgs(cutoverPath),
  '--capability-id',
  'subject_segmentation',
  '--requested-tool-id',
  'sam2',
])
writeJson(sam2HandoffPath, sam2Handoff)
const vegaLiteHandoff = runNpm('ai-graphics:production-tool-call-gateway-handoff', [
  ...privateGatewayArgs(cutoverPath),
  '--capability-id',
  'chart_overlay',
  '--requested-tool-id',
  'vega_lite',
])
writeJson(vegaLiteHandoffPath, vegaLiteHandoff)

const sam2QueueAdmission = runNpm('ai-graphics:production-worker-queue-admission', [
  '--source-production-tool-call-gateway-handoff-packet',
  sam2HandoffPath,
  ...privateQueueAdmissionArgs,
])
writeJson(sam2QueueAdmissionPath, sam2QueueAdmission)
const vegaLiteQueueAdmission = runNpm('ai-graphics:production-worker-queue-admission', [
  '--source-production-tool-call-gateway-handoff-packet',
  vegaLiteHandoffPath,
  ...privateQueueAdmissionArgs,
])
writeJson(vegaLiteQueueAdmissionPath, vegaLiteQueueAdmission)

const sam2DryProof = runNpm('ai-graphics:production-service-role-queue-transaction-dry-proof', [
  '--source-production-worker-queue-admission-packet',
  sam2QueueAdmissionPath,
  ...privateTransactionArgs,
])
writeJson(sam2DryProofPath, sam2DryProof)
const vegaLiteDryProof = runNpm('ai-graphics:production-service-role-queue-transaction-dry-proof', [
  '--source-production-worker-queue-admission-packet',
  vegaLiteQueueAdmissionPath,
  ...privateTransactionArgs,
])
writeJson(vegaLiteDryProofPath, vegaLiteDryProof)

const sam2Authorization = runNpm('ai-graphics:production-controlled-dispatch-authorization-proof', [
  '--source-production-service-role-queue-transaction-dry-proof-packet',
  sam2DryProofPath,
  ...privateAuthorizationArgs,
])
writeJson(sam2AuthorizationPath, sam2Authorization)
const vegaLiteAuthorization = runNpm('ai-graphics:production-controlled-dispatch-authorization-proof', [
  '--source-production-service-role-queue-transaction-dry-proof-packet',
  vegaLiteDryProofPath,
  ...privateAuthorizationArgs,
])
writeJson(vegaLiteAuthorizationPath, vegaLiteAuthorization)

const sam2Accepted = runNpm(runScriptName, [
  '--source-production-controlled-dispatch-authorization-proof-packet',
  sam2AuthorizationPath,
  ...privateSmokeArgs,
])
assertAccepted(sam2Accepted, 'sam2', 'sam2', 'subject_segmentation')

const vegaLiteAccepted = runNpm(runScriptName, [
  '--source-production-controlled-dispatch-authorization-proof-packet',
  vegaLiteAuthorizationPath,
  ...privateSmokeArgs,
])
assertAccepted(vegaLiteAccepted, 'vega_lite', 'vega_lite', 'chart_overlay')

const noSource = runNpm(runScriptName, [
  '--execution-requested',
  ...privateSmokeArgs,
])
if (noSource.status !== 'missing_production_controlled_dispatch_authorization_proof') {
  fail(`no_source_status:${noSource.status}`)
}
assertFalseKeys(noSource, 'no_source')

const publicEvidenceArgs = [...privateSmokeArgs]
const publicRefIndex =
  publicEvidenceArgs.indexOf('--production-controlled-worker-dispatch-smoke-ref') + 1
publicEvidenceArgs[publicRefIndex] = 'https://example.com/signed-url/public-artifact'
const publicEvidence = runNpm(runScriptName, [
  '--source-production-controlled-dispatch-authorization-proof-packet',
  sam2AuthorizationPath,
  ...publicEvidenceArgs,
])
if (publicEvidence.status !== 'awaiting_production_controlled_worker_dispatch_smoke_controls') {
  fail(`public_evidence_status:${publicEvidence.status}`)
}
if (!publicEvidence.rejectionReasons?.some((reason) => reason.includes('private/backend'))) {
  fail('public_evidence_not_rejected')
}
assertFalseKeys(publicEvidence, 'public_evidence')

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/generated|render|browser|canvas|webgl|public-artifact|signed-url/i.test(file)) {
    if (!file.includes('production-controlled-worker-dispatch-smoke-proof')) {
      fail(`unexpected_generated_output_path:${file}`)
    }
  }
}
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts']).trim()
if (trackedLocalArtifacts.length > 0) fail('tracked_local_artifacts_present')

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  acceptedStatus,
  toolsCovered: 21,
  capabilitiesCovered: 12,
  gpuToolsCovered: 8,
  acceptedPaths: ['sam2', 'vega_lite'],
  dispatcherBoundaryExercised: true,
  workerModeGateBlockedDispatch: true,
  blockedBeforeWorkerLease: true,
  blockedBeforeRouteOutput: true,
  workerLeaseCreated: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
  packageLockUnchanged: true,
}, null, 2))
