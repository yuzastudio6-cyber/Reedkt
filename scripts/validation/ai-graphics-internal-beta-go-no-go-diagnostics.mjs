import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-go-no-go'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-go-no-go.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-go-no-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs'

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
    stdio: ['ignore', 'pipe', 'pipe'],
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-internal-beta-go-no-go-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  const nativeGpuProofCollectionPacketPath =
    path.join(root, 'external-beta-native-gpu-proof-collection-packet.json')
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
  fs.writeFileSync(
    nativeGpuProofCollectionPacketPath,
    `${JSON.stringify(acceptedNativeGpuProofCollectionPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath, nativeGpuProofCollectionPacketPath }
}

function writeJsonPacket(root, fileName, packet) {
  const packetPath = path.join(root, fileName)
  fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
  return packetPath
}

function deepMerge(base, patch) {
  const output = Array.isArray(base) ? [...base] : { ...base }
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base?.[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      output[key] = deepMerge(base[key], value)
    } else {
      output[key] = value
    }
  }
  return output
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function expectSourceRollupPacketRejected(label, packetRoot, sourceRollupPacket, mutatePacket) {
  const packet = typeof mutatePacket === 'function' ? mutatePacket(deepClone(sourceRollupPacket)) : deepClone(sourceRollupPacket)
  const packetPath = writeJsonPacket(packetRoot, `bad-beta-production-readiness-rollup-packet-${label}.json`, packet)
  try {
    runNpm(runScriptName, [
      '--beta-production-readiness-rollup-packet',
      packetPath,
      '--require-internal-beta-go-no-go-approved',
    ])
    fail(`bad_source_rollup_packet_was_accepted:${label}`)
  } catch {
    // Expected: malformed source rollup evidence must fail before go/no-go acceptance.
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-go-no-go.ts',
  'server/cli/ai-graphics-internal-beta-go-no-go.ts',
  'scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.md',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-go-no-go.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-go-no-go.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-internal-beta-go-no-go'")) {
  fail('server_registry_index_does_not_export_internal_beta_go_no_go')
}

if (docs.decision !== 'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`unexpected_docs_status:${docs.status}`)
}
if (docs.sourceDecision !== 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_source_decision:${docs.sourceDecision}`)
}

for (const status of [
  'missing_technical_evidence',
  'awaiting_internal_beta_go_no_go_approval',
  'internal_beta_go_no_go_approved_runtime_still_blocked',
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

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  goNoGoCandidateToolsWithProvidedEvidence: 21,
  goNoGoCandidateCapabilitiesWithProvidedEvidence: 12,
  internalBetaGoNoGoApprovedToolsWithProvidedEvidence: 0,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}

for (const [key, expected] of Object.entries({
  required: true,
  approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  goNoGoRefRequired: true,
  approvesRuntimeNow: false,
})) {
  if (docs.requiredApprovalRecord?.[key] !== expected) {
    fail(`docs_approval_record_mismatch:${key}:${docs.requiredApprovalRecord?.[key]}`)
  }
}

for (const [key, expected] of Object.entries({
  acceptsLowLevelEvidenceFlags: true,
  acceptsBetaEvidenceBundlePacket: true,
  acceptsBetaEvidenceLocalAssemblyPacket: true,
  acceptsBetaProductionReadinessRollupPacket: true,
  sourceRollupPacketMustReportOwnerApprovedWorkerGatesReady: true,
  sourceRollupPacketMustCoverAll21Tools: true,
  sourceRollupPacketMustCoverAll12Capabilities: true,
  sourceRollupPacketMustPreserveEightGpuRuntimeTargets: true,
  sourceRollupPacketMustPreserveOnDemandGpuRuntimePolicy: true,
  sourceRollupPacketMustKeepNoIdleGpuRuntime: true,
  sourceRollupPacketMustBlockCpuFallbackForHeavyTools: true,
  sourceRollupPacketMustKeepRuntimeBetaAndProductionFalse: true,
  ownerApprovalRequiredBeforeGoNoGoCandidateReady: true,
  goNoGoApprovalSeparatedFromOwnerEvidence: true,
  runtimeUnlockPerformed: false,
})) {
  if (docs.evidencePolicy?.[key] !== expected) {
    fail(`docs_evidence_policy_mismatch:${key}:${docs.evidencePolicy?.[key]}`)
  }
}
for (const flag of [
  '--beta-evidence-bundle-packet',
  '--beta-evidence-local-assembly-packet',
  '--beta-production-readiness-rollup-packet',
]) {
  if (!cliSource.includes(flag)) fail(`cli_missing_packet_flag:${flag}`)
  if (!markdown.includes(flag)) fail(`markdown_missing_packet_flag:${flag}`)
}
if (!moduleSource.includes('sourceBetaProductionReadinessRollupPacket')) {
  fail('module_missing_source_beta_production_readiness_rollup_packet_input')
}
if (!cliSource.includes('betaProductionReadinessRollupPacketRead')) {
  fail('cli_missing_beta_production_readiness_rollup_packet_read_marker')
}
for (const [tool, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (!cliSource.includes(tool)) fail(`cli_missing_expected_gpu_tool:${tool}`)
  if (!cliSource.includes(runtimeTarget)) fail(`cli_missing_expected_gpu_runtime_target:${tool}`)
}
for (const phrase of [
  'exactly eight GPU/model gate checks',
  'exactly eight nested GPU/model source job payloads',
  'on-demand-only GPU runtime',
  'no idle GPU runtime approval',
  'CPU fallback blocked for heavy/model tools',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_source_rollup_gpu_policy:${phrase}`)
}

for (const action of [
  'accept all-21 install, ranking, GPU targeting, and cross-owner coordination evidence',
  'accept all-21 production worker gate checks with provided evidence and zero hard failures',
  'record owner go/no-go approval metadata for the future internal beta runtime lane',
  'return explicit runtime, Tool Route, Worker, artifact, external beta, and production blockers',
]) {
  if (!docs.allowedGoNoGoActions?.includes(action)) fail(`docs_missing_allowed_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_allowed_action:${action}`)
}

for (const action of [
  'Tool Route execution',
  'Worker queue enqueue',
  'production worker dispatch',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'signed URL creation',
  'public artifact creation',
  'external beta unlock',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(action)) fail(`docs_missing_blocked_action:${action}`)
  if (!moduleSource.includes(action)) fail(`module_missing_blocked_action:${action}`)
}

for (const key of [
  'internalBetaGoNoGoContractPrepared',
  'sourceBetaProductionReadinessRollupAccepted',
  'internalBetaGoNoGoReadyWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}

for (const key of [
  'internalBetaGoNoGoApprovalRecordAccepted',
  'all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence',
  ...falseGateKeys,
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_go_no_go')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== false) {
  fail('default_internal_beta_ready_with_evidence_not_false')
}

const {
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
} = writeAcceptedEvidencePackets()
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
    '--external-beta-native-gpu-proof-collection-packet',
    nativeGpuProofCollectionPacketPath,
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
    '--require-internal-beta-go-no-go-approved',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_go_no_go')
if (!awaitingExited) fail('awaiting_internal_beta_go_no_go_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`awaiting_status:${awaitingOutput.status}`)
}
if (awaitingOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('awaiting_ready_with_provided_evidence_not_true')
}
if (awaitingOutput.booleans?.internalBetaGoNoGoApprovalRecordAccepted !== false) {
  fail('awaiting_approval_record_not_false')
}

const approvedArgs = [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--internal-beta-go-no-go-approved',
  '--internal-beta-go-no-go-ref',
  'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-approved',
]
const approvedOutput = parseJsonOutput(runNpm(runScriptName, approvedArgs), 'approved_go_no_go')
if (approvedOutput.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.totalAiGraphicsTools !== 21) fail('approved_total_tools_not_21')
if (approvedOutput.totalProductFacingCapabilities !== 12) fail('approved_capabilities_not_12')
if (approvedOutput.goNoGoCandidateToolsWithProvidedEvidence !== 21) {
  fail('approved_candidate_tools_not_21')
}
if (approvedOutput.goNoGoCandidateCapabilitiesWithProvidedEvidence !== 12) {
  fail('approved_candidate_capabilities_not_12')
}
if (approvedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('approved_tools_not_21')
}
if (approvedOutput.internalBetaReadyNowTools !== 0) fail('approved_internal_beta_now_tools_not_0')
if (approvedOutput.externalBetaReadyNowTools !== 0) fail('approved_external_beta_now_tools_not_0')
if (approvedOutput.productionReadyNowTools !== 0) fail('approved_production_now_tools_not_0')
if (approvedOutput.requiredApprovalRecord?.approverRole !== 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') {
  fail('approved_required_role_mismatch')
}
if (approvedOutput.requiredApprovalRecord?.approvesRuntimeNow !== false) {
  fail('approved_record_unexpectedly_approves_runtime')
}
if (approvedOutput.booleans?.all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence !== true) {
  fail('approved_all21_go_no_go_not_true')
}

const sourceProductionWorkerGatePacket = parseJsonOutput(runNpm(
  'ai-graphics:internal-beta-production-worker-gate-readiness',
  [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--external-beta-native-gpu-proof-collection-packet',
    nativeGpuProofCollectionPacketPath,
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
    '--require-owner-approved-production-worker-gates-ready',
  ],
), 'source_production_worker_gate_packet')
const sourceProductionWorkerGatePacketPath = writeJsonPacket(
  path.dirname(manifestPacketPath),
  'internal-beta-production-worker-gate-readiness-packet.json',
  sourceProductionWorkerGatePacket,
)

const sourceRollupPacket = parseJsonOutput(runNpm('ai-graphics:beta-production-readiness-rollup', [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
  '--internal-beta-production-worker-gate-readiness-packet',
  sourceProductionWorkerGatePacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-ready',
]), 'source_beta_production_readiness_rollup_packet')
const sourceRollupPacketPath = writeJsonPacket(
  path.dirname(manifestPacketPath),
  'beta-production-readiness-rollup-packet.json',
  sourceRollupPacket,
)
let rollupPacketAwaitingExited = false
let rollupPacketAwaitingOutputText = ''
try {
  rollupPacketAwaitingOutputText = runNpm(runScriptName, [
    '--beta-production-readiness-rollup-packet',
    sourceRollupPacketPath,
    '--require-internal-beta-go-no-go-approved',
  ])
} catch (error) {
  rollupPacketAwaitingExited = true
  rollupPacketAwaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const rollupPacketAwaitingOutput = parseJsonOutput(
  rollupPacketAwaitingOutputText,
  'rollup_packet_awaiting_go_no_go',
)
if (!rollupPacketAwaitingExited) fail('rollup_packet_awaiting_go_no_go_require_did_not_fail')
if (sourceRollupPacket.status !== 'owner_approved_worker_gates_ready_runtime_still_blocked') {
  fail(`source_rollup_packet_status:${sourceRollupPacket.status}`)
}
if (sourceRollupPacket.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('source_rollup_packet_gate_checks_not_21')
}
if (sourceRollupPacket.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('source_rollup_packet_capability_checks_not_12')
}
if (sourceRollupPacket.hardFailedProductionWorkerGateChecksWithProvidedEvidence !== 0) {
  fail('source_rollup_packet_hard_failures_not_0')
}
if (sourceRollupPacket.booleans?.gpuRuntimeOnDemandOnly !== true) {
  fail('source_rollup_packet_gpu_on_demand_not_true')
}
if (sourceRollupPacket.booleans?.gpuRuntimeApprovedNow !== false) {
  fail('source_rollup_packet_gpu_runtime_not_false')
}
if (rollupPacketAwaitingOutput.input?.rollupSourceMode !== 'beta_production_readiness_rollup_packet') {
  fail(`rollup_packet_awaiting_source_mode:${rollupPacketAwaitingOutput.input?.rollupSourceMode}`)
}
if (rollupPacketAwaitingOutput.input?.betaProductionReadinessRollupPacketRead !== true) {
  fail('rollup_packet_awaiting_source_rollup_not_read')
}
if (rollupPacketAwaitingOutput.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`rollup_packet_awaiting_status:${rollupPacketAwaitingOutput.status}`)
}
if (rollupPacketAwaitingOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('rollup_packet_awaiting_ready_with_provided_evidence_not_true')
}
if (rollupPacketAwaitingOutput.booleans?.internalBetaGoNoGoApprovalRecordAccepted !== false) {
  fail('rollup_packet_awaiting_go_no_go_approval_not_false')
}

expectSourceRollupPacketRejected('missing_tool_coverage', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) =>
  deepMerge(packet, { totalAiGraphicsTools: 20 }),
)
expectSourceRollupPacketRejected(
  'missing_capability_coverage',
  path.dirname(manifestPacketPath),
  sourceRollupPacket,
  (packet) => deepMerge(packet, { totalProductFacingCapabilities: 11 }),
)
expectSourceRollupPacketRejected('wrong_gpu_runtime_target_count', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) =>
  deepMerge(packet, { gpuRuntimeTargetedTools: 7 }),
)
expectSourceRollupPacketRejected('wrong_gpu_runtime_target_value', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) => {
  packet.expectedGpuRuntimeTargets.sam2 = 'native_linux_amd64_cpu_worker'
  return packet
})
expectSourceRollupPacketRejected('wrong_gpu_gate_check_count', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) => {
  const gateCheck = packet.productionWorkerGateReadiness.productionWorkerGateChecks.find(
    (candidate) => candidate.toolId === 'sam2',
  )
  gateCheck.toolId = 'sam2_misclassified'
  return packet
})
expectSourceRollupPacketRejected(
  'wrong_nested_gpu_source_payload_count',
  path.dirname(manifestPacketPath),
  sourceRollupPacket,
  (packet) => {
    const payload =
      packet.productionWorkerGateReadiness.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
        (candidate) => candidate.sourceToolId === 'sam2',
      )
    payload.sourceToolId = 'sam2_misclassified'
    return packet
  },
)
expectSourceRollupPacketRejected('gpu_runtime_on_demand_policy_removed', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) => {
  const payload =
    packet.productionWorkerGateReadiness.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
      (candidate) => candidate.sourceToolId === 'sam2',
    )
  payload.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.onDemandOnly = false
  return packet
})
expectSourceRollupPacketRejected('idle_gpu_runtime_approved', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) => {
  const payload =
    packet.productionWorkerGateReadiness.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
      (candidate) => candidate.sourceToolId === 'sam2',
    )
  payload.productionWorkerJobPayload.metadata.noIdleGpuRuntimeApproved = false
  return packet
})
expectSourceRollupPacketRejected('heavy_tool_cpu_fallback_allowed', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) => {
  const payload =
    packet.productionWorkerGateReadiness.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
      (candidate) => candidate.sourceToolId === 'sam2',
    )
  payload.productionWorkerJobPayload.metadata.cpuFallbackAllowedForHeavyTools = true
  return packet
})
expectSourceRollupPacketRejected('gpu_runtime_approved_now', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) =>
  deepMerge(packet, { booleans: { gpuRuntimeApprovedNow: true } }),
)
expectSourceRollupPacketRejected(
  'production_worker_dispatch_approved_now',
  path.dirname(manifestPacketPath),
  sourceRollupPacket,
  (packet) => deepMerge(packet, { booleans: { productionWorkerDispatchApprovedNow: true } }),
)
expectSourceRollupPacketRejected('tool_execution_performed', path.dirname(manifestPacketPath), sourceRollupPacket, (packet) =>
  deepMerge(packet, { booleans: { toolExecutionPerformed: true } }),
)

const rollupPacketApprovedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--beta-production-readiness-rollup-packet',
  sourceRollupPacketPath,
  '--internal-beta-go-no-go-approved',
  '--internal-beta-go-no-go-ref',
  'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-approved',
]), 'rollup_packet_approved_go_no_go')
if (rollupPacketApprovedOutput.input?.rollupSourceMode !== 'beta_production_readiness_rollup_packet') {
  fail(`rollup_packet_approved_source_mode:${rollupPacketApprovedOutput.input?.rollupSourceMode}`)
}
if (rollupPacketApprovedOutput.input?.betaProductionReadinessRollupPacketRead !== true) {
  fail('rollup_packet_approved_source_rollup_not_read')
}
if (rollupPacketApprovedOutput.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
  fail(`rollup_packet_approved_status:${rollupPacketApprovedOutput.status}`)
}
if (rollupPacketApprovedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('rollup_packet_approved_tools_not_21')
}
if (rollupPacketApprovedOutput.internalBetaReadyNowTools !== 0) {
  fail('rollup_packet_approved_internal_beta_now_not_0')
}

const technicalBundlePacket = parseJsonOutput(runNpm('ai-graphics:beta-evidence-bundle:validate', [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
]), 'technical_beta_evidence_bundle_packet')
const bundlePacketPath = path.join(path.dirname(manifestPacketPath), 'technical-beta-evidence-bundle-packet.json')
fs.writeFileSync(bundlePacketPath, `${JSON.stringify(technicalBundlePacket, null, 2)}\n`, 'utf8')
let packetAwaitingExited = false
let packetAwaitingOutputText = ''
try {
  packetAwaitingOutputText = runNpm(runScriptName, [
    '--beta-evidence-bundle-packet',
    bundlePacketPath,
    '--owner-approval-granted',
    '--owner-approval-ref',
    'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
    '--require-internal-beta-go-no-go-approved',
  ])
} catch (error) {
  packetAwaitingExited = true
  packetAwaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const packetAwaitingOutput = parseJsonOutput(packetAwaitingOutputText, 'packet_awaiting_go_no_go')
if (!packetAwaitingExited) fail('packet_awaiting_go_no_go_require_did_not_fail')
if (packetAwaitingOutput.input?.evidenceSourceMode !== 'beta_evidence_bundle_packet') {
  fail('packet_awaiting_source_mode_not_reported')
}
if (packetAwaitingOutput.status !== 'awaiting_internal_beta_go_no_go_approval') {
  fail(`packet_awaiting_status:${packetAwaitingOutput.status}`)
}
if (packetAwaitingOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('packet_awaiting_ready_with_provided_evidence_not_true')
}
if (packetAwaitingOutput.booleans?.internalBetaGoNoGoApprovalRecordAccepted !== false) {
  fail('packet_awaiting_go_no_go_approval_not_false')
}

const packetApprovedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--beta-evidence-bundle-packet',
  bundlePacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--internal-beta-go-no-go-approved',
  '--internal-beta-go-no-go-ref',
  'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-approved',
]), 'packet_approved_go_no_go')
if (packetApprovedOutput.input?.evidenceSourceMode !== 'beta_evidence_bundle_packet') {
  fail('packet_approved_source_mode_not_reported')
}
if (packetApprovedOutput.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
  fail(`packet_approved_status:${packetApprovedOutput.status}`)
}
if (packetApprovedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('packet_approved_tools_not_21')
}
if (packetApprovedOutput.internalBetaReadyNowTools !== 0) {
  fail('packet_approved_internal_beta_now_not_0')
}

const localAssemblyPacketPath = path.join(path.dirname(manifestPacketPath), 'technical-beta-evidence-local-assembly-packet.json')
fs.writeFileSync(
  localAssemblyPacketPath,
  `${JSON.stringify({
    decision: 'ai_graphics_beta_evidence_local_assembly_prepared_with_directory_inputs',
    betaEvidenceBundle: technicalBundlePacket,
  }, null, 2)}\n`,
  'utf8',
)
const localAssemblyPacketApprovedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--beta-evidence-local-assembly-packet',
  localAssemblyPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--internal-beta-go-no-go-approved',
  '--internal-beta-go-no-go-ref',
  'AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-approved',
]), 'local_assembly_packet_approved_go_no_go')
if (localAssemblyPacketApprovedOutput.input?.evidenceSourceMode !== 'beta_evidence_local_assembly_packet') {
  fail('local_assembly_packet_source_mode_not_reported')
}
if (localAssemblyPacketApprovedOutput.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
  fail(`local_assembly_packet_approved_status:${localAssemblyPacketApprovedOutput.status}`)
}
if (localAssemblyPacketApprovedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('local_assembly_packet_approved_tools_not_21')
}

let runtimeRequireExited = false
try {
  runNpm(runScriptName, [...approvedArgs, '--require-runtime-ready'])
} catch {
  runtimeRequireExited = true
}
if (!runtimeRequireExited) fail('require_runtime_ready_did_not_fail')

for (const output of [
  defaultOutput,
  awaitingOutput,
  approvedOutput,
  rollupPacketAwaitingOutput,
  rollupPacketApprovedOutput,
  packetAwaitingOutput,
  packetApprovedOutput,
  localAssemblyPacketApprovedOutput,
]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_internal_beta_go_no_go_decision')
}
if (!scorecard.includes('awaiting_internal_beta_go_no_go_approval')) {
  fail('scorecard_missing_awaiting_internal_beta_go_no_go_status')
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
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-go-no-go.json',
  'server/tool-registry/ai-graphics-internal-beta-go-no-go.ts',
  'server/cli/ai-graphics-internal-beta-go-no-go.ts',
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
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
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
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
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
  docsStatus: docs.status,
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  rollupPacketAwaitingStatus: rollupPacketAwaitingOutput.status,
  rollupPacketApprovedStatus: rollupPacketApprovedOutput.status,
  rollupPacketSourceMode: rollupPacketApprovedOutput.input?.rollupSourceMode,
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  approvedToolsWithProvidedEvidence:
    approvedOutput.internalBetaGoNoGoApprovedToolsWithProvidedEvidence,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  routeExecutionApprovedNow: approvedOutput.booleans?.routeExecutionApprovedNow,
  workerExecutionApprovedNow: approvedOutput.booleans?.workerExecutionApprovedNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  internalBetaReadyNow: approvedOutput.booleans?.internalBetaReadyNow,
  externalBetaReadyNow: approvedOutput.booleans?.externalBetaReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
