import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:beta-production-readiness-rollup'
const runScriptCommand = 'tsx server/cli/ai-graphics-beta-production-readiness-rollup.ts'
const diagnosticScriptName = 'ai-graphics:beta-production-readiness-rollup:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-beta-production-readiness-rollup-diagnostics.mjs'

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

const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const requiredFinalGoNoGoGates = [
  'accepted all-21 install and production mapping audit',
  'accepted cross-owner duplicate and reserved-tool coordination',
  'accepted model-weight manifest review packet for private model tools',
  'accepted native NVIDIA L4 GPU runtime proof packet',
  'accepted committed Node/browser/Satori runtime proof packets',
  'accepted approved-plan snapshot gate',
  'accepted credit reservation gate',
  'accepted artifact boundary gate',
  'accepted Tool Route approval gate',
  'accepted Worker approval gate',
  'accepted production worker gate checks',
  'explicit internal beta owner go/no-go approval',
  'separate external beta approval',
  'separate production launch approval',
]

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
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

function writeAcceptedEvidencePackets() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-beta-production-rollup-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(
    manifestPacketPath,
    `${JSON.stringify(acceptedModelWeightManifestReviewPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    gpuPacketPath,
    `${JSON.stringify(acceptedGpuRuntimeProofResultPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-production-readiness-rollup.ts',
  'server/cli/ai-graphics-beta-production-readiness-rollup.ts',
  'scripts/validation/ai-graphics-beta-production-readiness-rollup-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.md',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
  'docs/tool-intelligence/ai-graphics/beta-activation-gap-report.json',
  'docs/tool-intelligence/ai-graphics/cross-owner-coordination.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json')
const moduleSource = read('server/tool-registry/ai-graphics-beta-production-readiness-rollup.ts')
const cliSource = read('server/cli/ai-graphics-beta-production-readiness-rollup.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-beta-production-readiness-rollup'")) {
  fail('server_registry_index_does_not_export_beta_production_readiness_rollup')
}
if (docs.decision !== 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const decision of [
  'ai_graphics_beta_activation_gap_report_prepared_with_remaining_blocks',
  'ai_graphics_cross_owner_coordination_verified_without_duplicate_owner_claims',
  'ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime',
]) {
  if (!docs.sourceDecisions?.includes(decision)) fail(`docs_missing_source_decision:${decision}`)
}
if (!moduleSource.includes('AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION')) {
  fail('module_missing_activation_gap_decision_constant')
}
if (!moduleSource.includes('AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION')) {
  fail('module_missing_cross_owner_decision_constant')
}
if (!moduleSource.includes('AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION')) {
  fail('module_missing_production_worker_gate_decision_constant')
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_worker_gates_ready_runtime_still_blocked',
]) {
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  if (!markdown.includes(`\`${capability}\``)) fail(`markdown_missing_capability:${capability}`)
}
for (const gate of requiredFinalGoNoGoGates) {
  if (!docs.requiredFinalGoNoGoGates?.includes(gate)) fail(`docs_missing_go_no_go_gate:${gate}`)
  if (!moduleSource.includes(gate)) fail(`module_missing_go_no_go_gate:${gate}`)
}
for (const blockedAction of [
  'Tool Route execution',
  'Worker queue enqueue',
  'production worker dispatch',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'signed URL creation',
  'public artifact creation',
  'external beta unlock',
  'production unlock',
]) {
  if (!docs.stillBlockedRuntimeActions?.includes(blockedAction)) fail(`docs_missing_blocked_action:${blockedAction}`)
}
for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  properlyInstalledForPlannedSurface: 21,
  productionMappedTools: 21,
  duplicateProductionMappings: 0,
  gpuRuntimeTargetedTools: 8,
  heavyToolsIncorrectlyTargetingCpu: 0,
  productionWorkerGateChecksAcceptedWithProvidedEvidence: 21,
  capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence: 12,
  hardFailedProductionWorkerGateChecksWithProvidedEvidence: 0,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}
if (docs.gpuRuntimeTargetsExact !== true) fail('docs_gpu_runtime_targets_not_exact')
if (docs.gpuRuntimeOnDemandOnly !== true) fail('docs_gpu_runtime_not_on_demand')
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (docs.expectedGpuRuntimeTargets?.[tool] !== runtimeTarget) {
    fail(`docs_expected_gpu_runtime_target_mismatch:${tool}:${docs.expectedGpuRuntimeTargets?.[tool]}`)
  }
  if (!moduleSource.includes('gpuRuntimeTargetsExact')) fail('module_missing_gpu_runtime_targets_exact')
  if (!markdown.includes(runtimeTarget)) fail(`markdown_missing_gpu_runtime_target:${tool}`)
}
if (!markdown.includes('GPU runtime remains on-demand only')) {
  fail('markdown_missing_gpu_on_demand_policy')
}
for (const key of [
  'betaProductionReadinessRollupPrepared',
  'sourceActivationGapAccepted',
  'sourceCrossOwnerCoordinationAccepted',
  'sourceProductionWorkerGateAcceptedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all21ToolsProperlyInstalledForPlannedSurface',
  'all21ToolsMappedToProductionRegistry',
  'noDuplicateProductionMappings',
  'gpuHeavyToolsTargetGpuRuntime',
  'gpuRuntimeTargetsExact',
  'gpuRuntimeOnDemandOnly',
  'productionWorkerGateHardFailuresWithProvidedEvidenceAbsent',
  'internalBetaGoNoGoReadyWithProvidedEvidence',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const key of [
  'externalBetaGoNoGoReadyWithProvidedEvidence',
  'productionGoNoGoReadyWithProvidedEvidence',
  ...falseGateKeys,
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_rollup')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== false) {
  fail('default_internal_beta_go_no_go_not_false')
}

const { manifestPacketPath, gpuPacketPath } = writeAcceptedEvidencePackets()
let awaitingExited = false
let awaitingOutputText = ''
try {
  awaitingOutputText = runNpm(runScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--require-internal-beta-go-no-go-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_rollup')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)

const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-ready',
]), 'approved_rollup')

if (approvedOutput.status !== 'owner_approved_worker_gates_ready_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.totalAiGraphicsTools !== 21) fail('approved_total_tools_not_21')
if (approvedOutput.totalProductFacingCapabilities !== 12) fail('approved_capabilities_not_12')
if (approvedOutput.gpuRuntimeTargetedTools !== 8) fail('approved_gpu_targeted_not_8')
if (approvedOutput.gpuRuntimeTargetsExact !== true) fail('approved_gpu_runtime_targets_not_exact')
if (approvedOutput.gpuRuntimeOnDemandOnly !== true) fail('approved_gpu_runtime_not_on_demand')
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (approvedOutput.expectedGpuRuntimeTargets?.[tool] !== runtimeTarget) {
    fail(`approved_expected_gpu_runtime_target_mismatch:${tool}:${approvedOutput.expectedGpuRuntimeTargets?.[tool]}`)
  }
}
if (approvedOutput.heavyToolsIncorrectlyTargetingCpu !== 0) fail('approved_heavy_cpu_mismatch')
if (approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('approved_gate_checks_not_21')
}
if (approvedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('approved_capability_gate_checks_not_12')
}
if (approvedOutput.hardFailedProductionWorkerGateChecksWithProvidedEvidence !== 0) {
  fail('approved_hard_failed_gate_checks_not_0')
}
if (approvedOutput.internalBetaReadyNowTools !== 0) fail('approved_internal_beta_now_tools_not_0')
if (approvedOutput.externalBetaReadyNowTools !== 0) fail('approved_external_beta_now_tools_not_0')
if (approvedOutput.productionReadyNowTools !== 0) fail('approved_production_now_tools_not_0')
if (approvedOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('approved_internal_beta_go_no_go_not_true')
}
if (approvedOutput.booleans?.externalBetaGoNoGoReadyWithProvidedEvidence !== false) {
  fail('approved_external_beta_go_no_go_not_false')
}
if (approvedOutput.booleans?.productionGoNoGoReadyWithProvidedEvidence !== false) {
  fail('approved_production_go_no_go_not_false')
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_beta_production_rollup_decision')
}
if (!scorecard.includes('$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT')) {
  fail('scorecard_missing_private_model_weight_root_env')
}

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /productionWorkerJobEnqueueApprovedNow["`:\s]+true/i,
  /productionWorkerDispatchApprovedNow["`:\s]+true/i,
  /productionWorkerRouteExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /productionWorkerDispatchPerformed["`:\s]+true/i,
  /productionWorkerRouteExecutionPerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
const combinedText = [
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.md',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
  'server/tool-registry/ai-graphics-beta-production-readiness-rollup.ts',
  'server/cli/ai-graphics-beta-production-readiness-rollup.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')
for (const pattern of forbiddenTruePatterns) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i.test(file))) {
  fail('generated_media_staged')
}
if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')

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
  '+    "ai-graphics:model-weight-source-catalog:diagnostics": "node scripts/validation/ai-graphics-model-weight-source-catalog-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-checksum-evidence:validate": "tsx server/cli/ai-graphics-model-weight-checksum-evidence.ts",',
  '+    "ai-graphics:model-weight-checksum-evidence:diagnostics": "node scripts/validation/ai-graphics-model-weight-checksum-evidence-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-checksum-evidence-scaffold": "tsx server/cli/ai-graphics-model-weight-checksum-evidence-scaffold.ts",',
  '+    "ai-graphics:model-weight-checksum-evidence-scaffold:diagnostics": "node scripts/validation/ai-graphics-model-weight-checksum-evidence-scaffold-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go": "tsx server/cli/ai-graphics-internal-beta-go-no-go.ts",',
  '+    "ai-graphics:internal-beta-go-no-go:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval": "tsx server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval": "tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-adapter-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-adapter-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness": "tsx server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-backend-queue-storage-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuRuntimeTargetedTools: approvedOutput.gpuRuntimeTargetedTools,
  gpuRuntimeTargetsExact: approvedOutput.gpuRuntimeTargetsExact,
  gpuRuntimeOnDemandOnly: approvedOutput.gpuRuntimeOnDemandOnly,
  productionWorkerGateChecksAcceptedWithProvidedEvidence:
    approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence,
  hardFailedProductionWorkerGateChecksWithProvidedEvidence:
    approvedOutput.hardFailedProductionWorkerGateChecksWithProvidedEvidence,
  internalBetaReadyNowTools: approvedOutput.internalBetaReadyNowTools,
  externalBetaReadyNowTools: approvedOutput.externalBetaReadyNowTools,
  productionReadyNowTools: approvedOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
