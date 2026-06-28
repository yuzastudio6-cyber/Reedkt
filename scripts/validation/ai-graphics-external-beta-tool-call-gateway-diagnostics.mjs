import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-tool-call-gateway'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-tool-call-gateway.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-tool-call-gateway:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-gateway-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const launchGoNoGoScriptName = 'ai-graphics:external-beta-launch-go-no-go'
const runtimeAdmissionScriptName = 'ai-graphics:external-beta-runtime-admission'

const allTools = [
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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
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
  'routeExecutionPerformed',
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

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function acceptedRecord(toolId) {
  const prefix = `external-beta-evidence://${toolId}`
  return {
    toolId,
    internalRuntimeSoakEvidenceRef: `${prefix}:internal-runtime-soak`,
    externalBetaQaEvidenceRef: `${prefix}:external-qa`,
    costConcurrencyPrivacyRollbackEvidenceRef: `${prefix}:cost-concurrency-privacy-rollback`,
    incidentResponseEvidenceRef: `${prefix}:incident-response`,
    ownerApprovalRef: `${prefix}:owner-approval`,
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-tool-call-gateway.ts',
  'server/cli/ai-graphics-external-beta-tool-call-gateway.ts',
  'server/tool-registry/ai-graphics-external-beta-runtime-admission.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.md',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.md')
const source = read('server/tool-registry/ai-graphics-external-beta-tool-call-gateway.ts')
const cli = read('server/cli/ai-graphics-external-beta-tool-call-gateway.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-tool-call-gateway'")) {
  fail('server_registry_index_missing_external_beta_tool_call_gateway_export')
}
if (docs.decision !== 'ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultGatewayReadyExamples: 0,
  fullGatewayWorkerEnqueueCandidateReadyExamples: 2,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobExamples: 1,
  gpuRuntimeShouldStartNow: 0,
  workerEnqueuePerformedNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const gate of [
  'external beta user id',
  'external beta workspace id',
  'external beta request id',
  'external beta tool-call gateway reference',
  'external beta feature flag evaluation reference',
  'external beta rollout assignment reference',
  'external beta rate-limit decision reference',
  'external beta cost-ceiling decision reference',
  'external beta audit event reference',
  'external beta trace id',
  'external beta idempotency key',
  'external beta worker enqueue candidate reference',
  'accepted external-beta runtime admission packet',
]) {
  if (!docs.requiredGatewayControls?.includes(gate)) fail(`docs_missing_gateway_control:${gate}`)
}
for (const key of [
  'externalBetaToolCallGatewayPrepared',
  'sourceExternalBetaRuntimeAdmissionAccepted',
  'externalBetaGatewayControlsSatisfied',
  'externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'externalBetaFeatureFlagEvaluated',
  'externalBetaRolloutAssignmentAccepted',
  'externalBetaRateLimitAccepted',
  'externalBetaCostCeilingAccepted',
  'externalBetaAuditTracePrepared',
  'externalBetaIdempotencyKeyAccepted',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
for (const [id, expected] of Object.entries({
  planning_sam2_gateway: 'planning_metadata_selected',
  blocked_sam2_gateway_missing_runtime_admission: 'missing_external_beta_runtime_admission',
  blocked_sam2_gateway_missing_rate_limit: 'missing_external_beta_gateway_controls',
  accepted_future_sam2_gateway_worker_enqueue_candidate:
    'external_beta_worker_enqueue_candidate_ready',
  accepted_future_d3_gateway_worker_enqueue_candidate:
    'external_beta_worker_enqueue_candidate_ready',
})) {
  const entry = docs.exampleEvaluations?.find((example) => example.id === id)
  if (!entry) fail(`docs_missing_example:${id}`)
  if (entry?.decision !== expected) fail(`docs_example_decision_unexpected:${id}:${entry?.decision}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION',
  'evaluateAiGraphicsExternalBetaToolCallGateway',
  'sourceExternalBetaRuntimeAdmissionPacket',
  'externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence',
  'externalBetaWorkerEnqueueCandidate',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
  'gpuRuntimeShouldStartNow: false',
  'workerEnqueuePerformed: false',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'noIdleGpuRuntimeApproved: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-runtime-admission-packet',
  '--external-beta-user-id',
  '--external-beta-workspace-id',
  '--external-beta-rate-limit-decision-ref',
  '--external-beta-worker-enqueue-candidate-ref',
  'evaluatorOnly: true',
  'workerEnqueuePerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'External-Beta Tool-Call Gateway',
  'Worker enqueue performed now: `0`',
  'GPU remains on-demand only',
  'If no one is using the tool, no GPU runtime should be running',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing:${needle}`)
}
for (const needle of [
  'AI graphics external beta tool-call gateway decision',
  'worker enqueue candidate',
  '`workerEnqueuePerformed=false`',
]) {
  if (!scorecard.includes(needle)) fail(`scorecard_missing:${needle}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-tool-call-gateway-'))
const fullRecordsPath = writeJson(
  path.join(tmpRoot, 'external-beta-evidence-records.json'),
  allTools.map(acceptedRecord),
)
const validatedPacket = parseJsonOutput(runNpm(packetScriptName, [
  '--evidence-records',
  fullRecordsPath,
]), 'validated_external_beta_evidence_packet')
if (validatedPacket.evidenceRecordsAcceptedWithProvidedEvidence !== 21) {
  fail('validated_packet_evidence_records_not_21')
}
const fullPacketPath = writeJson(path.join(tmpRoot, 'external-beta-evidence-packet.json'), validatedPacket)

const fullEvidenceArgs = [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
]
const launchApprovalArgs = [
  '--all-external-beta-launch-gates-approved',
  '--external-beta-launch-ref',
  'external-beta-launch://launch-switch-approved',
  '--external-beta-rollout-cohort-ref',
  'external-beta-launch://rollout-cohort-approved',
  '--external-beta-cost-concurrency-ceiling-ref',
  'external-beta-launch://cost-concurrency-ceiling-approved',
  '--external-beta-rollback-incident-runbook-ref',
  'external-beta-launch://rollback-incident-runbook-approved',
  '--external-beta-private-artifact-retention-support-ref',
  'external-beta-launch://private-artifact-retention-support-approved',
  '--external-beta-launch-approver-role',
  'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
]
const launchGoNoGo = parseJsonOutput(runNpm(launchGoNoGoScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
  ...launchApprovalArgs,
]), 'external_beta_launch_go_no_go')
if (launchGoNoGo.status !== 'external_beta_launch_go_no_go_approved_runtime_still_blocked') {
  fail(`launch_go_no_go_status_unexpected:${launchGoNoGo.status}`)
}
const launchGoNoGoPath = writeJson(path.join(tmpRoot, 'launch-go-no-go.json'), launchGoNoGo)

const commonRuntimeArgs = [
  '--external-beta-launch-go-no-go-packet',
  launchGoNoGoPath,
  '--execution-requested',
  '--approved-plan-snapshot-id',
  'approved_snapshot_external_beta_fixture',
  '--credit-reservation-id',
  'credit_reservation_external_beta_fixture',
  '--artifact-boundary-approval-ref',
  'artifact_boundary_approval_external_beta_fixture',
  '--tool-route-approval-ref',
  'tool_route_approval_external_beta_fixture',
  '--worker-approval-ref',
  'worker_approval_external_beta_fixture',
  '--runtime-enqueue-approval-ref',
  'runtime_enqueue_approval_external_beta_fixture',
  '--owner-runtime-approval-ref',
  'owner_runtime_approval_external_beta_fixture',
  '--private-artifact-manifest-ref',
  'private://ai-graphics/external-beta/artifact-manifest.json',
  '--external-beta-feature-flag-enabled',
  '--external-beta-feature-flag-ref',
  'external-beta-runtime://feature-flag-ai-graphics',
  '--external-beta-runtime-admission-ref',
  'external-beta-runtime://runtime-admission',
  '--external-beta-tool-allowlist-ref',
  'external-beta-runtime://tool-allowlist',
  '--external-beta-traffic-scope-ref',
  'external-beta-runtime://traffic-scope',
  '--external-beta-telemetry-ref',
  'external-beta-runtime://telemetry',
  '--external-beta-support-ref',
  'external-beta-runtime://support',
  '--external-beta-cost-guardrail-ref',
  'external-beta-runtime://cost-guardrail',
  '--external-beta-worker-pool-ref',
  'external-beta-runtime://worker-pool',
]
const sam2RuntimeAdmission = parseJsonOutput(runNpm(runtimeAdmissionScriptName, [
  ...commonRuntimeArgs,
  '--external-beta-gpu-concurrency-ref',
  'external-beta-runtime://gpu-concurrency',
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--native-gpu-runtime-proof-ref',
  'private://ai-graphics/gpu-proof/sam2-proof.json',
  '--model-weight-manifest-ref',
  'private://ai-graphics/model-manifests/sam2.json',
]), 'sam2_runtime_admission')
const d3RuntimeAdmission = parseJsonOutput(runNpm(runtimeAdmissionScriptName, [
  ...commonRuntimeArgs,
  '--capability-id',
  'chart_overlay',
  '--requested-tool-id',
  'd3',
  '--node-runtime-proof-ref',
  'private://ai-graphics/node-static-proof/d3.json',
]), 'd3_runtime_admission')
const sam2RuntimeAdmissionPath = writeJson(path.join(tmpRoot, 'sam2-runtime-admission.json'), sam2RuntimeAdmission)
const d3RuntimeAdmissionPath = writeJson(path.join(tmpRoot, 'd3-runtime-admission.json'), d3RuntimeAdmission)

const gatewayControls = [
  '--external-beta-user-id',
  'external-beta-user-fixture',
  '--external-beta-workspace-id',
  'workspace-fixture',
  '--external-beta-request-id',
  'request-fixture',
  '--external-beta-tool-call-gateway-ref',
  'external-beta-gateway://tool-call',
  '--external-beta-feature-flag-evaluation-ref',
  'external-beta-gateway://feature-flag-evaluation',
  '--external-beta-rollout-assignment-ref',
  'external-beta-gateway://rollout-assignment',
  '--external-beta-rate-limit-decision-ref',
  'external-beta-gateway://rate-limit',
  '--external-beta-cost-ceiling-decision-ref',
  'external-beta-gateway://cost-ceiling',
  '--external-beta-audit-event-ref',
  'external-beta-gateway://audit-event',
  '--external-beta-trace-id',
  'trace-fixture',
  '--external-beta-idempotency-key',
  'ai-graphics:external-beta:workspace-fixture:request-fixture:sam2',
  '--external-beta-worker-enqueue-candidate-ref',
  'external-beta-gateway://worker-enqueue-candidate',
]
const gatewayControlsWithoutRateLimit = gatewayControls.filter((value, index, list) => (
  value !== '--external-beta-rate-limit-decision-ref' &&
  list[index - 1] !== '--external-beta-rate-limit-decision-ref'
))

const planningGateway = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_gateway')
const blockedMissingRuntime = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--execution-requested',
]), 'blocked_missing_runtime_gateway')
const blockedMissingRateLimit = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  sam2RuntimeAdmissionPath,
  ...gatewayControlsWithoutRateLimit,
]), 'blocked_missing_rate_limit_gateway')
const readySam2Gateway = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  sam2RuntimeAdmissionPath,
  ...gatewayControls,
]), 'ready_sam2_gateway')
const readyD3Gateway = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-runtime-admission-packet',
  d3RuntimeAdmissionPath,
  ...gatewayControls,
  '--external-beta-idempotency-key',
  'ai-graphics:external-beta:workspace-fixture:request-fixture:d3',
]), 'ready_d3_gateway')

if (planningGateway.decision !== 'planning_metadata_selected') {
  fail(`planning_gateway_decision_unexpected:${planningGateway.decision}`)
}
if (blockedMissingRuntime.decision !== 'missing_external_beta_runtime_admission') {
  fail(`blocked_missing_runtime_decision_unexpected:${blockedMissingRuntime.decision}`)
}
if (blockedMissingRateLimit.decision !== 'missing_external_beta_gateway_controls') {
  fail(`blocked_missing_rate_limit_decision_unexpected:${blockedMissingRateLimit.decision}`)
}
if (!blockedMissingRateLimit.missingGatewayControls?.includes('external beta rate-limit decision reference is missing')) {
  fail('blocked_missing_rate_limit_not_reported')
}
for (const [label, output] of Object.entries({ readySam2Gateway, readyD3Gateway })) {
  if (output.decision !== 'external_beta_worker_enqueue_candidate_ready') {
    fail(`${label}_decision_unexpected:${output.decision}`)
  }
  if (output.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence !== true) {
    fail(`${label}_candidate_ready_not_true`)
  }
  if (!output.externalBetaWorkerEnqueueCandidate) fail(`${label}_missing_worker_candidate`)
  if (output.externalBetaWorkerEnqueueCandidate?.workerEnqueuePerformed !== false) {
    fail(`${label}_worker_enqueue_performed_not_false`)
  }
  if (output.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_runtime_should_start_now_not_false`)
  if (output.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_ready_now_not_0`)
  if (output.productionReadyNowTools !== 0) fail(`${label}_production_ready_now_not_0`)
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`${label}_required_false_not_false:${key}`)
    }
  }
}
if (readySam2Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('ready_sam2_gateway_gpu_start_allowed_not_true')
}
if (readyD3Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('ready_d3_gateway_gpu_start_allowed_not_false')
}
if (readySam2Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget !== 'native_linux_amd64_nvidia_l4_sam2_runtime') {
  fail('ready_sam2_gateway_runtime_target_unexpected')
}
if (readyD3Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget !== 'node_cpu_static') {
  fail('ready_d3_gateway_runtime_target_unexpected')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json',
  'server/tool-registry/ai-graphics-external-beta-tool-call-gateway.ts',
  'server/cli/ai-graphics-external-beta-tool-call-gateway.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeShouldStartNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /workerEnqueuePerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /providerRuntimePerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-worker-enqueue-adapter": "tsx server/cli/ai-graphics-external-beta-worker-enqueue-adapter.ts",',
  '+    "ai-graphics:external-beta-worker-enqueue-adapter:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-enqueue-adapter-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-backend-queue-submission": "tsx server/cli/ai-graphics-external-beta-backend-queue-submission.ts",',
  '+    "ai-graphics:external-beta-backend-queue-submission:diagnostics": "node scripts/validation/ai-graphics-external-beta-backend-queue-submission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction": "tsx server/cli/ai-graphics-external-beta-service-role-queue-transaction.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-transaction:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-transaction-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-local-queue-storage": "tsx server/cli/ai-graphics-external-beta-local-queue-storage.ts",',
  '+    "ai-graphics:external-beta-local-queue-storage:diagnostics": "node scripts/validation/ai-graphics-external-beta-local-queue-storage-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge": "tsx server/cli/ai-graphics-external-beta-runtime-queue-service-bridge.ts",',
  '+    "ai-graphics:external-beta-runtime-queue-service-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-queue-service-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-readiness.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(generated|render|renders|media|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
  fail('generated_output_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: allTools.length,
  gpuToolsCovered: gpuTools.length,
  planningGatewayDecision: planningGateway.decision,
  blockedMissingRuntimeDecision: blockedMissingRuntime.decision,
  blockedMissingRateLimitDecision: blockedMissingRateLimit.decision,
  readySam2GatewayDecision: readySam2Gateway.decision,
  readyD3GatewayDecision: readyD3Gateway.decision,
  readySam2GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readySam2Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readyD3Gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  sam2RuntimeTarget: readySam2Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget,
  d3RuntimeTarget: readyD3Gateway.externalBetaWorkerEnqueueCandidate?.runtimeTarget,
  workerEnqueuePerformed: readySam2Gateway.booleans?.workerEnqueuePerformed,
  gpuRuntimeShouldStartNow: readySam2Gateway.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: readySam2Gateway.externalBetaReadyNowTools,
  productionReadyNowTools: readySam2Gateway.productionReadyNowTools,
  agentCanExecuteToolsNow: readySam2Gateway.booleans?.agentCanExecuteToolsNow,
}, null, 2))
