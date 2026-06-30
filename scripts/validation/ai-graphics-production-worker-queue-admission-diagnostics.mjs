import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision = 'ai_graphics_production_worker_queue_admission_prepared_dispatch_blocked'
const acceptedStatus = 'production_worker_queue_admission_prepared_dispatch_blocked'
const runScriptName = 'ai-graphics:production-worker-queue-admission'
const runScriptCommand = 'tsx server/cli/ai-graphics-production-worker-queue-admission.ts'
const diagnosticScriptName = 'ai-graphics:production-worker-queue-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-worker-queue-admission-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-worker-queue-admission.ts',
  'server/cli/ai-graphics-production-worker-queue-admission.ts',
  'scripts/validation/ai-graphics-production-worker-queue-admission-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-worker-queue-admission.json',
  'docs/tool-intelligence/ai-graphics/production-worker-queue-admission.md',
  'docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.json',
  'docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.md',
  'docs/tool-intelligence/ai-graphics/production-traffic-cutover.json',
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

const trueAcceptedKeys = [
  'productionWorkerQueueAdmissionPrepared',
  'sourceProductionToolCallGatewayHandoffAccepted',
  'productionQueueAdmissionControlsAccepted',
  'productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence',
  'queueAdmissionEnvelopeShapeValid',
  'workerPayloadAcceptedByPreDispatchGates',
  'dispatchBlockedByProductionBlockedMode',
  'approvedSnapshotGatePassed',
  'idempotencyGatePassed',
  'rawPromptBlockGatePassed',
  'signedUrlBlockGatePassed',
  'aiGraphicsCanonicalRegistryGatePassed',
  'licenseModelWeightGatePassed',
  'creditReservationGatePassed',
  'artifactPolicyGatePassed',
  'qaPolicyGatePassed',
  'workerModeGateBlocksDispatch',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'queueAdmissionRefAccepted',
  'queueSchemaAccepted',
  'queueWriteAuthorizationAccepted',
  'serviceRoleTransactionRefAccepted',
  'workerClaimPolicyAccepted',
  'workerDispatchBlockAccepted',
  'queueAuditAccepted',
  'queueRollbackAccepted',
  'queueObservabilityAccepted',
  'productionControlledToolCallReadyNow',
  'runtimeReadyForOnDemandProductionToolCall',
  'productionRouteReadyNow',
  'productionWorkerPathReadyNow',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
  'externalBetaReadyNow',
  'productionReadyNow',
]

const falseKeysAlways = [
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'liveQueueWriteApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'internalBetaReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleTransactionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const allowedPackageDiffLines = [
  '+    "ai-graphics:production-worker-queue-admission": "tsx server/cli/ai-graphics-production-worker-queue-admission.ts",',
  '+    "ai-graphics:production-worker-queue-admission:diagnostics": "node scripts/validation/ai-graphics-production-worker-queue-admission-diagnostics.mjs",',
  '+    "ai-graphics:production-service-role-queue-transaction-dry-proof": "tsx server/cli/ai-graphics-production-service-role-queue-transaction-dry-proof.ts",',
  '+    "ai-graphics:production-service-role-queue-transaction-dry-proof:diagnostics": "node scripts/validation/ai-graphics-production-service-role-queue-transaction-dry-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-dispatch-authorization-proof": "tsx server/cli/ai-graphics-production-controlled-dispatch-authorization-proof.ts",',
  '+    "ai-graphics:production-controlled-dispatch-authorization-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-dispatch-authorization-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs",',
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

function gateStatus(envelope, gateName) {
  return envelope?.preDispatchGateChecks?.find((gate) => gate.gateName === gateName)?.status
}

function assertAccepted(record, label, expectedToolId, expectedCapabilityId) {
  if (record.decision !== decision) fail(`${label}_decision:${record.decision}`)
  if (record.status !== acceptedStatus) fail(`${label}_status:${record.status}`)
  if (record.sourceProductionToolCallGatewayHandoffAccepted !== true) {
    fail(`${label}_source_handoff_not_true`)
  }
  if (record.productionQueueAdmissionControlsAccepted !== true) {
    fail(`${label}_controls_not_true`)
  }
  if (record.productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence !== true) {
    fail(`${label}_envelope_not_ready`)
  }
  if (record.rejectionReasons?.length !== 0) fail(`${label}_rejections_not_empty`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_caps_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_not_8`)
  if (record.productionControlledToolCallReadyNowTools !== 21) {
    fail(`${label}_controlled_tool_call_tools_not_21`)
  }
  if (record.runtimeReadyForOnDemandProductionToolCallTools !== 21) {
    fail(`${label}_runtime_ready_tools_not_21`)
  }
  if (record.productionReadyNowTools !== 21) fail(`${label}_production_tools_not_21`)
  const envelope = record.productionWorkerQueueAdmissionEnvelope
  if (!envelope) fail(`${label}_envelope_missing`)
  if (envelope && envelope.toolId !== expectedToolId) fail(`${label}_tool_mismatch`)
  if (envelope && envelope.capabilityId !== expectedCapabilityId) fail(`${label}_capability_mismatch`)
  if (envelope && envelope.queueBatchCandidate.status !== 'prepared_not_submitted') {
    fail(`${label}_batch_not_prepared`)
  }
  if (envelope && envelope.queueJobCandidate.status !== 'prepared_not_submitted') {
    fail(`${label}_job_not_prepared`)
  }
  if (envelope && envelope.queueBatchCandidate.liveInsertPerformed !== false) {
    fail(`${label}_batch_insert_not_false`)
  }
  if (envelope && envelope.queueJobCandidate.liveInsertPerformed !== false) {
    fail(`${label}_job_insert_not_false`)
  }
  if (envelope && envelope.preDispatchGatesAccepted !== true) {
    fail(`${label}_predispatch_gates_not_accepted`)
  }
  if (envelope && envelope.dispatchBlockedByProductionBlockedMode !== true) {
    fail(`${label}_dispatch_block_not_true`)
  }
  if (envelope && envelope.dispatchBlockGateCheck?.gateName !== 'worker_mode') {
    fail(`${label}_dispatch_gate_name_mismatch`)
  }
  if (envelope && envelope.dispatchBlockGateCheck?.status !== 'blocked') {
    fail(`${label}_dispatch_gate_not_blocked`)
  }
  for (const gateName of [
    'approved_snapshot',
    'idempotency',
    'raw_prompt_block',
    'signed_url_block',
    'ai_graphics_canonical_registry',
    'license_model_weight',
    'credit_reservation',
    'artifact_policy',
    'qa_policy',
  ]) {
    if (gateStatus(envelope, gateName) !== 'passed') {
      fail(`${label}_gate_not_passed:${gateName}:${gateStatus(envelope, gateName)}`)
    }
  }
  const payload = envelope?.productionWorkerJobPayload
  if (payload && payload.executionMode !== 'production_blocked') {
    fail(`${label}_payload_not_production_blocked`)
  }
  const metadata = payload?.metadata ?? {}
  if (metadata.aiGraphicsCanonicalToolId !== expectedToolId) {
    fail(`${label}_metadata_tool_mismatch`)
  }
  if (!Array.isArray(metadata.aiGraphicsCapabilityIds) ||
      !metadata.aiGraphicsCapabilityIds.includes(expectedCapabilityId)) {
    fail(`${label}_metadata_capability_ids_missing`)
  }
  if (metadata.gpuRuntimeShouldStartNow !== false) {
    fail(`${label}_metadata_gpu_should_start_not_false`)
  }
  if (expectedToolId === 'sam2') {
    if (envelope?.workerType !== 'gpu_ai_worker') fail(`${label}_sam2_not_gpu_worker`)
    if (metadata.cpuFallbackAllowedForHeavyTools !== false) {
      fail(`${label}_cpu_fallback_not_false`)
    }
    if (metadata.aiGraphicsRuntimeActivationPolicy?.onDemandOnly !== true) {
      fail(`${label}_runtime_policy_on_demand_missing`)
    }
  }
  if (expectedToolId === 'vega_lite' && envelope?.workerType !== 'cpu_analysis_worker') {
    fail(`${label}_vega_lite_not_cpu_worker`)
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
if (!indexTs.includes("export * from './ai-graphics-production-worker-queue-admission'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-worker-queue-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/production-worker-queue-admission.md')
const source = read('server/tool-registry/ai-graphics-production-worker-queue-admission.ts')
const cli = read('server/cli/ai-graphics-production-worker-queue-admission.ts')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.coverage?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.coverage?.totalProductFacingCapabilities !== 12) fail('docs_caps_not_12')
if (docs.coverage?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_not_8')
for (const tool of all21Tools) {
  if (!docs.toolCoverage?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const capability of all12Capabilities) {
  if (!docs.capabilityCoverage?.includes(capability)) {
    fail(`docs_missing_capability:${capability}`)
  }
}
for (const citation of [
  'production-tool-call-gateway-handoff.json',
  'production-traffic-cutover.json',
  'production-launch-go-no-go.json',
  'production-launch-controls.json',
  'production-worker-gates.ts',
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
  'prepared_not_submitted',
  'production_blocked',
  'worker_mode',
  'ai_graphics_canonical_registry',
  'cpuFallbackAllowedForHeavyTools',
  'gpuRuntimeShouldStartNow',
]) {
  if (!docsMd.includes(phrase) && !JSON.stringify(docs).includes(phrase)) {
    fail(`missing_queue_phrase:${phrase}`)
  }
}
for (const phrase of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  '"workerEnqueuePerformed": true',
  '"workerDispatchPerformed": true',
  '"toolExecutionPerformed": true',
  '"backendQueueSubmissionPerformed": true',
  '"serviceRoleTransactionPerformed": true',
  '"gpuRuntimePerformed": true',
  '"publicArtifactCreated": true',
  '"signedUrlCreated": true',
]) {
  if (docsMd.includes(phrase) || source.includes(phrase) || cli.includes(phrase)) {
    fail(`forbidden_claim:${phrase}`)
  }
}

const tmpRoot = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-worker-queue-admission-`)
const controlsPath = `${tmpRoot}/production-launch-controls.json`
const goNoGoPath = `${tmpRoot}/production-launch-go-no-go.json`
const cutoverPath = `${tmpRoot}/production-traffic-cutover.json`
const sam2HandoffPath = `${tmpRoot}/sam2-production-gateway-handoff.json`
const vegaLiteHandoffPath = `${tmpRoot}/vega-lite-production-gateway-handoff.json`

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

const sam2Accepted = runNpm(runScriptName, [
  '--source-production-tool-call-gateway-handoff-packet',
  sam2HandoffPath,
  ...privateQueueAdmissionArgs,
])
assertAccepted(sam2Accepted, 'sam2', 'sam2', 'subject_segmentation')

const vegaLiteAccepted = runNpm(runScriptName, [
  '--source-production-tool-call-gateway-handoff-packet',
  vegaLiteHandoffPath,
  ...privateQueueAdmissionArgs,
])
assertAccepted(vegaLiteAccepted, 'vega_lite', 'vega_lite', 'chart_overlay')

const noSource = runNpm(runScriptName, [
  '--execution-requested',
  ...privateQueueAdmissionArgs,
])
if (noSource.status !== 'missing_production_tool_call_gateway_handoff') {
  fail(`no_source_status:${noSource.status}`)
}
assertFalseKeys(noSource, 'no_source')

const publicEvidenceArgs = [...privateQueueAdmissionArgs]
const publicRefIndex = publicEvidenceArgs.indexOf('--production-queue-admission-ref') + 1
publicEvidenceArgs[publicRefIndex] = 'https://example.com/signed-url/public-artifact'
const publicEvidence = runNpm(runScriptName, [
  '--source-production-tool-call-gateway-handoff-packet',
  sam2HandoffPath,
  ...publicEvidenceArgs,
])
if (publicEvidence.status !== 'missing_production_queue_admission_controls') {
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
    if (!file.includes('production-worker-queue-admission')) {
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
  acceptedPaths: ['sam2', 'vega_lite'],
  workerPayloadAcceptedByPreDispatchGates: true,
  dispatchBlockedByProductionBlockedMode: true,
  workerQueueApprovedNow: false,
  liveQueueWriteApprovedNow: false,
  workerEnqueuePerformed: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  packageLockUnchanged: true,
}, null, 2))
