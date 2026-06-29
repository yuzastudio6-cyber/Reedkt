import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-production-worker-gate-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-production-worker-gate-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-internal-beta-production-worker-gate-readiness-diagnostics.mjs'

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

const requiredGateNames = [
  'approved_snapshot',
  'idempotency',
  'raw_prompt_block',
  'signed_url_block',
  'secret_block',
  'registry_runtime',
  'ai_graphics_canonical_registry',
  'license_model_weight',
  'credit_reservation',
  'artifact_policy',
  'qa_policy',
  'worker_mode',
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-production-worker-gate-readiness-'))
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

function writeAcceptedProductionWorkerJobReadinessPacket(
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  mutatePacket,
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-production-worker-gate-source-'))
  const packetPath = path.join(root, 'production-worker-job-readiness-packet.json')
  const packetText = runNpm('ai-graphics:internal-beta-production-worker-job-readiness', [
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
    '--require-owner-approved-production-worker-jobs-ready',
  ])
  const packet = parseJsonOutput(packetText, 'source_production_worker_job_readiness_packet')
  if (packet.status !== 'owner_approved_production_worker_jobs_ready') {
    fail(`source_job_packet_status:${packet.status}`)
  }
  const outputPacket = typeof mutatePacket === 'function' ? mutatePacket(packet) : packet
  fs.writeFileSync(packetPath, `${JSON.stringify(outputPacket, null, 2)}\n`, 'utf8')
  return packetPath
}

function expectSourceProductionWorkerJobPacketRejected(
  label,
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  mutatePacket,
) {
  try {
    runNpm(runScriptName, [
      '--internal-beta-production-worker-job-readiness-packet',
      writeAcceptedProductionWorkerJobReadinessPacket(
        manifestPacketPath,
        gpuPacketPath,
        nativeGpuProofCollectionPacketPath,
        mutatePacket,
      ),
      '--require-owner-approved-production-worker-gates-ready',
    ])
    fail(`bad_source_production_worker_job_packet_was_accepted:${label}`)
  } catch {
    // Expected: malformed source job-readiness evidence must fail before gate acceptance.
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
  'server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-production-worker-gate-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.json',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-idempotency.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-internal-beta-production-worker-gate-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_production_worker_gate_readiness')
}
if (docs.decision !== 'ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceDecision !== 'ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_source_decision:${docs.sourceDecision}`)
}
if (docs.sourceEvidencePolicy?.acceptsProductionWorkerJobReadinessPacket !== true) {
  fail('docs_source_policy_missing_job_readiness_packet_mode')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustReportOwnerApprovedJobsReady !== true) {
  fail('docs_source_policy_missing_owner_approved_jobs_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustCoverAll21Tools !== true) {
  fail('docs_source_policy_missing_21_tool_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustCoverAll12Capabilities !== true) {
  fail('docs_source_policy_missing_12_capability_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustPreserveEightGpuRuntimeTargets !== true) {
  fail('docs_source_policy_missing_8_gpu_target_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustPreserveOnDemandGpuRuntimePolicy !== true) {
  fail('docs_source_policy_missing_on_demand_gpu_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustKeepNoIdleGpuRuntime !== true) {
  fail('docs_source_policy_missing_no_idle_gpu_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustBlockCpuFallbackForHeavyTools !== true) {
  fail('docs_source_policy_missing_cpu_fallback_block_requirement')
}
if (docs.sourceEvidencePolicy?.sourceProductionWorkerJobPacketMustKeepEnqueueAndRuntimeFalse !== true) {
  fail('docs_source_policy_missing_false_gate_requirement')
}
if (docs.sourceEvidencePolicy?.gateReadinessStillDoesNotEnqueueOrDispatch !== true) {
  fail('docs_source_policy_missing_no_enqueue_dispatch_requirement')
}
if (docs.sourceEvidencePolicy?.runtimeUnlockPerformed !== false) {
  fail('docs_source_policy_runtime_unlock_not_false')
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_production_worker_gate_checks_ready',
]) {
  if (!docs.states?.includes(status)) fail(`docs_missing_status:${status}`)
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const gateName of requiredGateNames) {
  if (!docs.requiredGateNames?.includes(gateName)) fail(`docs_missing_gate:${gateName}`)
  if (!moduleSource.includes(gateName)) fail(`module_missing_gate:${gateName}`)
  if (!markdown.includes(`\`${gateName}\``)) fail(`markdown_missing_gate:${gateName}`)
}
for (const token of [
  'runProductionWorkerGates',
  'getHardFailedGates',
  'aiGraphicsCanonicalRegistryGate',
  'production worker dispatch',
  'production worker route execution',
  '--internal-beta-production-worker-job-readiness-packet',
  'sourceEvidenceMode',
  'internal_beta_production_worker_job_readiness_packet',
  'sourceProductionWorkerJobReadinessPacketRead',
  '--require-owner-approved-production-worker-gates-ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token) && !markdown.includes(token)) {
    fail(`source_missing:${token}`)
  }
}
for (const phrase of [
  'Source evidence policy',
  '`--internal-beta-production-worker-job-readiness-packet`',
  'exactly eight GPU/model production worker payloads',
  'on-demand-only GPU runtime',
  'no idle GPU runtime approval',
  'CPU fallback blocked for heavy/model tools',
  'Packet-fed gate',
  'readiness still only runs shared gate validation',
  'does not enqueue jobs',
  'does not enqueue production worker jobs',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_source_policy:${phrase}`)
}
if (docs.counts?.productionWorkerGateChecksPrepared !== 21) fail('docs_gate_checks_not_21')
if (docs.counts?.capabilityProductionWorkerGateScenariosPrepared !== 12) fail('docs_capability_gate_scenarios_not_12')
if (docs.counts?.ownerApprovedProductionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('docs_owner_gate_checks_not_21')
}
if (docs.counts?.ownerApprovedCapabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('docs_owner_capability_gate_scenarios_not_12')
}
if (docs.counts?.hardFailedGateChecksWithProvidedEvidence !== 0) fail('docs_hard_failed_gate_checks_not_0')
if (docs.counts?.productionWorkerGateChecksReadyNow !== 0) fail('docs_gate_checks_ready_now_not_0')
if (docs.runtimeTargets?.gpuToolsUseNativeL4 !== true) fail('docs_missing_gpu_l4_target_guard')
if (docs.runtimeTargets?.dedicatedGpuRuntimeTargetsExact !== true) fail('docs_missing_dedicated_gpu_runtime_target_guard')
if (docs.runtimeTargets?.productionWorkerGateChecksValidateCanonicalAiGraphicsRegistry !== true) {
  fail('docs_missing_canonical_registry_validation')
}
if (docs.runtimeTargets?.productionWorkerGateChecksValidateGpuRuntimeActivationPolicy !== true) {
  fail('docs_missing_gpu_runtime_activation_policy_gate')
}
if (docs.runtimeTargets?.gpuRuntimeOnDemandOnly !== true) fail('docs_gpu_runtime_not_on_demand')
if (docs.runtimeTargets?.noIdleGpuRuntimeApproved !== true) fail('docs_idle_gpu_policy_not_blocked')
if (docs.runtimeTargets?.startsOnlyForApprovedWorkerOrToolCall !== true) {
  fail('docs_gpu_start_policy_not_worker_call_only')
}
if (docs.runtimeTargets?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')
for (const [tool, expectedTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool] !== expectedTarget) {
    fail(`docs_expected_gpu_runtime_target_mismatch:${tool}:${docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool]}`)
  }
}

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_production_worker_gate')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== false) fail('default_owner_gate_not_false')
if (defaultOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 0) fail('default_gate_checks_not_0')

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
    '--require-owner-approved-production-worker-gates-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== false) fail('awaiting_owner_gate_not_false')

const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
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
]), 'approved_production_worker_gate')

if (approvedOutput.status !== 'owner_approved_production_worker_gate_checks_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== true) fail('approved_owner_gate_not_true')
if (approvedOutput.productionWorkerGateChecksPrepared !== 21) fail('approved_gate_checks_not_21')
if (approvedOutput.capabilityProductionWorkerGateScenariosPrepared !== 12) fail('approved_capability_gate_scenarios_not_12')
if (approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) fail('approved_gate_checks_accepted_not_21')
if (approvedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('approved_capability_gate_scenarios_accepted_not_12')
}
if (approvedOutput.hardFailedGateChecksWithProvidedEvidence !== 0) fail('approved_hard_failed_gate_checks_not_0')
if (approvedOutput.productionWorkerGateChecksReadyNow !== 0) fail('approved_gate_checks_ready_now_not_0')
if (approvedOutput.productionWorkerGateChecks?.length !== 21) fail('approved_gate_payload_length_not_21')
if (approvedOutput.capabilityProductionWorkerGateScenarios?.length !== 12) {
  fail('approved_capability_gate_payload_length_not_12')
}

const sourceJobReadinessPacketPath = writeAcceptedProductionWorkerJobReadinessPacket(
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
)
const packetFedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--internal-beta-production-worker-job-readiness-packet',
  sourceJobReadinessPacketPath,
  '--require-owner-approved-production-worker-gates-ready',
]), 'packet_fed_production_worker_gate')

if (packetFedOutput.input?.sourceEvidenceMode !== 'internal_beta_production_worker_job_readiness_packet') {
  fail(`packet_fed_source_mode:${packetFedOutput.input?.sourceEvidenceMode}`)
}
if (packetFedOutput.input?.sourceProductionWorkerJobReadinessPacketRead !== true) {
  fail('packet_fed_source_packet_not_read')
}
if (packetFedOutput.status !== 'owner_approved_production_worker_gate_checks_ready') {
  fail(`packet_fed_status:${packetFedOutput.status}`)
}
if (packetFedOutput.ownerApprovedProductionWorkerGateEvidenceAccepted !== true) {
  fail('packet_fed_owner_gate_not_true')
}
if (packetFedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('packet_fed_gate_checks_accepted_not_21')
}
if (packetFedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('packet_fed_capability_gate_scenarios_accepted_not_12')
}
if (packetFedOutput.hardFailedGateChecksWithProvidedEvidence !== 0) {
  fail('packet_fed_hard_failed_gate_checks_not_0')
}
if (packetFedOutput.productionWorkerGateChecksReadyNow !== 0) {
  fail('packet_fed_gate_checks_ready_now_not_0')
}
if (packetFedOutput.booleans?.productionWorkerDispatchApprovedNow !== false) {
  fail('packet_fed_dispatch_approved_not_false')
}
if (packetFedOutput.booleans?.gpuRuntimeApprovedNow !== false) {
  fail('packet_fed_gpu_runtime_not_false')
}
if (packetFedOutput.booleans?.runtimeReadyNow !== false) {
  fail('packet_fed_runtime_not_false')
}
if (packetFedOutput.booleans?.productionReadyNow !== false) {
  fail('packet_fed_production_not_false')
}

expectSourceProductionWorkerJobPacketRejected(
  'missing_tool_coverage',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => deepMerge(packet, { totalAiGraphicsTools: 20 }),
)
expectSourceProductionWorkerJobPacketRejected(
  'missing_capability_coverage',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => deepMerge(packet, { totalProductFacingCapabilities: 11 }),
)
expectSourceProductionWorkerJobPacketRejected(
  'wrong_gpu_runtime_target_count',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => {
    const next = deepMerge(packet, {})
    const sam2 = next.productionWorkerJobPayloads.find((candidate) => candidate.sourceToolId === 'sam2')
    sam2.sourceToolId = 'sam2_misclassified'
    return next
  },
)
expectSourceProductionWorkerJobPacketRejected(
  'gpu_runtime_on_demand_policy_removed',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => {
    const next = deepMerge(packet, {})
    const sam2 = next.productionWorkerJobPayloads.find((candidate) => candidate.sourceToolId === 'sam2')
    sam2.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.onDemandOnly = false
    return next
  },
)
expectSourceProductionWorkerJobPacketRejected(
  'idle_gpu_runtime_approved',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => {
    const next = deepMerge(packet, {})
    const sam2 = next.productionWorkerJobPayloads.find((candidate) => candidate.sourceToolId === 'sam2')
    sam2.productionWorkerJobPayload.metadata.noIdleGpuRuntimeApproved = false
    return next
  },
)
expectSourceProductionWorkerJobPacketRejected(
  'heavy_tool_cpu_fallback_allowed',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => {
    const next = deepMerge(packet, {})
    const sam2 = next.productionWorkerJobPayloads.find((candidate) => candidate.sourceToolId === 'sam2')
    sam2.productionWorkerJobPayload.metadata.cpuFallbackAllowedForHeavyTools = true
    return next
  },
)
expectSourceProductionWorkerJobPacketRejected(
  'gpu_runtime_approved_now',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => deepMerge(packet, { booleans: { gpuRuntimeApprovedNow: true } }),
)
expectSourceProductionWorkerJobPacketRejected(
  'production_worker_job_enqueue_approved_now',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => deepMerge(packet, { booleans: { productionWorkerJobEnqueueApprovedNow: true } }),
)
expectSourceProductionWorkerJobPacketRejected(
  'tool_execution_performed',
  manifestPacketPath,
  gpuPacketPath,
  nativeGpuProofCollectionPacketPath,
  (packet) => deepMerge(packet, { booleans: { toolExecutionPerformed: true } }),
)

for (const gateResult of approvedOutput.productionWorkerGateChecks ?? []) {
  if (gateResult.gateCheckShapeValid !== true) fail(`gate_shape_invalid:${gateResult.toolId}`)
  if (gateResult.gateChecksAcceptedWithProvidedEvidence !== true) fail(`gate_not_accepted:${gateResult.toolId}`)
  if (gateResult.hardFailedGateNames?.length !== 0) fail(`gate_hard_failures:${gateResult.toolId}`)
  if (gateResult.canEnqueueProductionWorkerJobNow !== false) fail(`gate_enqueue_not_false:${gateResult.toolId}`)
  if (gateResult.canDispatchProductionWorkerJobNow !== false) fail(`gate_dispatch_not_false:${gateResult.toolId}`)
  if (gateResult.canRunProductionWorkerRouteNow !== false) fail(`gate_route_not_false:${gateResult.toolId}`)
  if (gateResult.canExecuteToolNow !== false) fail(`gate_execute_not_false:${gateResult.toolId}`)
  const canonicalGate = (gateResult.gateChecks ?? []).find((gate) => gate.gateName === 'ai_graphics_canonical_registry')
  if (canonicalGate?.status !== 'passed') fail(`canonical_gate_not_passed:${gateResult.toolId}:${canonicalGate?.status}`)
  if (canonicalGate?.message?.includes('on-demand runtime activation')) {
    fail(`canonical_gate_missing_gpu_policy:${gateResult.toolId}`)
  }
  if (gpuTools.includes(gateResult.toolId)) {
    if (gateResult.workerType !== 'gpu_ai_worker') fail(`gpu_tool_not_gpu_worker:${gateResult.toolId}:${gateResult.workerType}`)
    if (!gateResult.runtimeTarget?.includes('nvidia_l4')) {
      fail(`gpu_tool_not_l4_target:${gateResult.toolId}:${gateResult.runtimeTarget}`)
    }
    if (gateResult.runtimeTarget !== expectedGpuRuntimeTargets[gateResult.toolId]) {
      fail(`gpu_tool_runtime_target_mismatch:${gateResult.toolId}:${gateResult.runtimeTarget}`)
    }
  }
  const gateNames = (gateResult.gateChecks ?? []).map((gate) => gate.gateName)
  for (const gateName of requiredGateNames) {
    if (!gateNames.includes(gateName)) fail(`gate_result_missing_gate:${gateResult.toolId}:${gateName}`)
  }
  for (const gate of gateResult.gateChecks ?? []) {
    if (!gate.gateName || !gate.status || typeof gate.hardBlock !== 'boolean' || !gate.message || !Array.isArray(gate.warnings)) {
      fail(`gate_result_bad_shape:${gateResult.toolId}:${gate.gateName}`)
    }
  }
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput, packetFedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime')) {
  fail('scorecard_missing_internal_beta_production_worker_gate_readiness_decision')
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
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-gate-readiness.json',
  'server/tool-registry/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
  'server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts',
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
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",',
  '+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup": "tsx server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup:diagnostics": "node scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activated-launch-readiness": "tsx server/cli/ai-graphics-external-beta-activated-launch-readiness.ts",',
  '+    "ai-graphics:external-beta-activated-launch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
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
  '+    "ai-graphics:internal-beta-production-worker-job-readiness": "tsx server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts",',
  '+    "ai-graphics:internal-beta-production-worker-job-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-production-worker-job-readiness-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:beta-production-readiness-rollup": "tsx server/cli/ai-graphics-beta-production-readiness-rollup.ts",',
  '+    "ai-graphics:beta-production-readiness-rollup:diagnostics": "node scripts/validation/ai-graphics-beta-production-readiness-rollup-diagnostics.mjs",',
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
  '+    "ai-graphics:model-weight-source-catalog:diagnostics": "node scripts/validation/ai-graphics-model-weight-source-catalog-diagnostics.mjs",',
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
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  packetFedStatus: packetFedOutput.status,
  toolsCovered: allTools.length,
  productionWorkerGateChecksAcceptedWithProvidedEvidence:
    approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence,
  capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence:
    approvedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence,
  hardFailedGateChecksWithProvidedEvidence: approvedOutput.hardFailedGateChecksWithProvidedEvidence,
  productionWorkerGateChecksReadyNow: approvedOutput.productionWorkerGateChecksReadyNow,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
