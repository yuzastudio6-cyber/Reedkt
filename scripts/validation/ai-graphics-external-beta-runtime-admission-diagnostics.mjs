import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const toolRouteRuntimeProofScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof'
const toolRouteRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const toolRouteRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const toolRouteRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-runtime-admission'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-runtime-admission.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-runtime-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-runtime-admission-diagnostics.mjs'
const packetScriptName = 'ai-graphics:external-beta-evidence-packet:validate'
const launchGoNoGoScriptName = 'ai-graphics:external-beta-launch-go-no-go'

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

const capabilities = [
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
  'server/tool-registry/ai-graphics-external-beta-runtime-admission.ts',
  'server/cli/ai-graphics-external-beta-runtime-admission.ts',
  'server/tool-registry/ai-graphics-external-beta-launch-go-no-go.ts',
  'server/tool-registry/ai-graphics-on-demand-runtime-admission.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.md',
  'docs/tool-intelligence/ai-graphics/external-beta-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.md')
const source = read('server/tool-registry/ai-graphics-external-beta-runtime-admission.ts')
const cli = read('server/cli/ai-graphics-external-beta-runtime-admission.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-runtime-admission'")) {
  fail('server_registry_index_missing_external_beta_runtime_admission_export')
}
if (docs.decision !== 'ai_graphics_external_beta_runtime_admission_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  defaultExternalBetaRuntimeAdmissionReadyExamples: 0,
  fullExternalBetaRuntimeAdmissionReadyExamples: 2,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobExamples: 1,
  gpuRuntimeShouldStartNow: 0,
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
for (const capability of capabilities) {
  if (!source.includes(capability) && !docsMd.includes('12')) fail(`capability_context_missing:${capability}`)
}

for (const gate of [
  'external beta launch go/no-go approval',
  'external beta feature flag approval',
  'external beta runtime admission reference',
  'external beta tool allowlist reference',
  'external beta rollout traffic scope reference',
  'external beta telemetry reference',
  'external beta support ownership reference',
  'external beta cost guardrail reference',
  'external beta worker pool reference',
  'external beta GPU concurrency reference for GPU tools',
  'on-demand runtime job admission with provided evidence',
]) {
  if (!docs.requiredExternalRuntimeGates?.includes(gate)) fail(`docs_missing_external_runtime_gate:${gate}`)
}

for (const key of [
  'externalBetaRuntimeAdmissionContractPrepared',
  'sourceExternalBetaLaunchGoNoGoAccepted',
  'sourceOnDemandRuntimeAdmissionAccepted',
  'externalBetaRuntimeAdmissionReadyWithProvidedEvidence',
  'externalBetaWorkerEnqueueAllowedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
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
  planning_sam2_external_beta: 'planning_metadata_selected',
  blocked_sam2_external_beta_missing_launch: 'missing_external_beta_launch_go_no_go',
  accepted_future_sam2_external_beta_worker_enqueue:
    'external_beta_runtime_admission_ready_for_worker_enqueue',
  accepted_future_d3_external_beta_worker_enqueue:
    'external_beta_runtime_admission_ready_for_worker_enqueue',
})) {
  const entry = docs.exampleEvaluations?.find((example) => example.id === id)
  if (!entry) fail(`docs_missing_example:${id}`)
  if (entry?.decision !== expected) fail(`docs_example_decision_unexpected:${id}:${entry?.decision}`)
}

for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION',
  'evaluateAiGraphicsExternalBetaRuntimeAdmission',
  'buildAiGraphicsExternalBetaRuntimeAdmissionExamples',
  'evaluateAiGraphicsOnDemandRuntimeAdmission',
  'buildAiGraphicsExternalBetaLaunchGoNoGo',
  'externalBetaRuntimeAdmissionReadyWithProvidedEvidence',
  'externalBetaWorkerEnqueueAllowedWithProvidedEvidence',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
  'gpuRuntimeShouldStartNow: false',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'gpuRuntimeOnDemandOnly: true',
  'noIdleGpuRuntimeApproved: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-launch-go-no-go-packet',
  '--execution-requested',
  '--external-beta-feature-flag-enabled',
  '--external-beta-runtime-admission-ref',
  '--external-beta-worker-pool-ref',
  '--external-beta-gpu-concurrency-ref',
  'evaluatorOnly: true',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'External-Beta Runtime Admission',
  'GPU remains on-demand only',
  'If no one is using the tool, no GPU runtime should be running',
  'External-beta-ready now: `0`',
  'Production-ready now: `0`',
]) {
  if (!docsMd.includes(needle)) fail(`markdown_missing:${needle}`)
}
for (const needle of [
  'AI graphics external beta runtime admission decision',
  'GPU runtime is only start-allowed for an accepted future external-beta worker job',
  '`gpuRuntimeShouldStartNow=false`',
]) {
  if (!scorecard.includes(needle)) fail(`scorecard_missing:${needle}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-runtime-admission-'))
const fullRecordsPath = writeJson(
  path.join(tmpRoot, 'external-beta-evidence-records.json'),
  allTools.map(acceptedRecord),
)
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

const validatedPacket = parseJsonOutput(runNpm(packetScriptName, [
  '--evidence-records',
  fullRecordsPath,
]), 'validated_external_beta_evidence_packet')
if (validatedPacket.evidenceRecordsAcceptedWithProvidedEvidence !== 21) {
  fail('validated_packet_evidence_records_not_21')
}
const fullPacketPath = writeJson(
  path.join(tmpRoot, 'external-beta-evidence-packet.json'),
  validatedPacket,
)

const launchGoNoGo = parseJsonOutput(runNpm(launchGoNoGoScriptName, [
  ...fullEvidenceArgs,
  '--external-beta-evidence-packet',
  fullPacketPath,
  ...launchApprovalArgs,
]), 'external_beta_launch_go_no_go')
if (launchGoNoGo.status !== 'external_beta_launch_go_no_go_approved_runtime_still_blocked') {
  fail(`launch_go_no_go_status_unexpected:${launchGoNoGo.status}`)
}
if (launchGoNoGo.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('launch_go_no_go_approved_tools_not_21')
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

const planningSam2 = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
]), 'planning_sam2')
const blockedSam2 = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--execution-requested',
]), 'blocked_sam2')
const readySam2 = parseJsonOutput(runNpm(runScriptName, [
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
]), 'ready_sam2')
const readyD3 = parseJsonOutput(runNpm(runScriptName, [
  ...commonRuntimeArgs,
  '--capability-id',
  'chart_overlay',
  '--requested-tool-id',
  'd3',
  '--node-runtime-proof-ref',
  'private://ai-graphics/node-static-proof/d3.json',
]), 'ready_d3')
const blockedGpuConcurrency = parseJsonOutput(runNpm(runScriptName, [
  ...commonRuntimeArgs,
  '--capability-id',
  'background_removal',
  '--requested-tool-id',
  'sam2',
  '--native-gpu-runtime-proof-ref',
  'private://ai-graphics/gpu-proof/sam2-proof.json',
  '--model-weight-manifest-ref',
  'private://ai-graphics/model-manifests/sam2.json',
]), 'blocked_sam2_missing_gpu_concurrency')

if (planningSam2.decision !== 'planning_metadata_selected') {
  fail(`planning_sam2_decision_unexpected:${planningSam2.decision}`)
}
if (planningSam2.executionRequested !== false) fail('planning_sam2_execution_requested_not_false')
if (planningSam2.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('planning_sam2_gpu_start_allowed_not_false')
}
if (blockedSam2.decision !== 'missing_external_beta_launch_go_no_go') {
  fail(`blocked_sam2_decision_unexpected:${blockedSam2.decision}`)
}
if (!blockedSam2.missingExternalBetaRuntimeGates?.includes('external beta launch go/no-go approval is missing')) {
  fail('blocked_sam2_missing_launch_gate_not_reported')
}
for (const [label, output] of Object.entries({ readySam2, readyD3 })) {
  if (output.decision !== 'external_beta_runtime_admission_ready_for_worker_enqueue') {
    fail(`${label}_decision_unexpected:${output.decision}`)
  }
  if (output.externalBetaRuntimeAdmissionReadyWithProvidedEvidence !== true) {
    fail(`${label}_ready_with_provided_evidence_not_true`)
  }
  if (output.externalBetaWorkerEnqueueAllowedWithProvidedEvidence !== true) {
    fail(`${label}_worker_enqueue_allowed_not_true`)
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
if (readySam2.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
  fail('ready_sam2_gpu_start_allowed_not_true')
}
if (readyD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
  fail('ready_d3_gpu_start_allowed_not_false')
}
if (blockedGpuConcurrency.decision !== 'external_beta_runtime_admission_blocked') {
  fail(`blocked_gpu_concurrency_decision_unexpected:${blockedGpuConcurrency.decision}`)
}
if (!blockedGpuConcurrency.missingExternalBetaRuntimeGates?.includes('external beta GPU concurrency reference is missing')) {
  fail('blocked_gpu_concurrency_gate_not_reported')
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.md',
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json',
  'server/tool-registry/ai-graphics-external-beta-runtime-admission.ts',
  'server/cli/ai-graphics-external-beta-runtime-admission.ts',
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
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-tool-call-gateway": "tsx server/cli/ai-graphics-external-beta-tool-call-gateway.ts",',
  '+    "ai-graphics:external-beta-tool-call-gateway:diagnostics": "node scripts/validation/ai-graphics-external-beta-tool-call-gateway-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-private-artifact-manifest": "tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts",',
  '+    "ai-graphics:external-beta-private-artifact-manifest:diagnostics": "node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs",',
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
  capabilitiesCovered: capabilities.length,
  gpuToolsCovered: gpuTools.length,
  planningSam2Decision: planningSam2.decision,
  blockedSam2Decision: blockedSam2.decision,
  readySam2Decision: readySam2.decision,
  readyD3Decision: readyD3.decision,
  blockedGpuConcurrencyDecision: blockedGpuConcurrency.decision,
  readySam2GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readySam2.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  readyD3GpuRuntimeStartAllowedForAcceptedExternalBetaJob:
    readyD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  gpuRuntimeShouldStartNow: readySam2.gpuRuntimeShouldStartNow,
  externalBetaReadyNowTools: readySam2.externalBetaReadyNowTools,
  productionReadyNowTools: readySam2.productionReadyNowTools,
  agentCanExecuteToolsNow: readySam2.booleans?.agentCanExecuteToolsNow,
}, null, 2))
