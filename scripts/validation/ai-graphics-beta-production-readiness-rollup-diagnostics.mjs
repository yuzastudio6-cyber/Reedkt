import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'

const toolRouteRuntimeProofScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof'
const toolRouteRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const toolRouteRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const toolRouteRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'
const perToolRuntimeProofScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof'
const perToolRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts'
const perToolRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof:diagnostics'
const perToolRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-runtime-proof-diagnostics.mjs'
const nativeGpuProofCollectionScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection'
const nativeGpuProofCollectionScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts'
const nativeGpuProofCollectionDiagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
const nativeGpuProofCollectionDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-collection-diagnostics.mjs'
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

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
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

const runtimeProfiles = [
  'native_linux_amd64_nvidia_l4_torch_torchvision_runtime',
  'native_linux_amd64_nvidia_l4_transformers_runtime',
  'native_linux_amd64_nvidia_l4_sam2_runtime',
  'native_linux_amd64_nvidia_l4_birefnet_runtime',
  'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  'native_linux_amd64_nvidia_l4_transparent_background_runtime',
]

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
  'accepted external beta service-role queue smoke preflight',
  'accepted saved external beta service-role queue smoke proof',
  'explicit internal beta owner go/no-go approval',
  'accepted external beta activated-launch readiness',
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

function acceptedPerToolRuntimeProofFixture() {
  return {
    decision: 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks',
    sourceToolRouteRuntimeProofBridgeAccepted: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    runtimeProofRecordsPrepared: 21,
    runtimeProofAcceptedWithProvidedEvidenceTools: 13,
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
    jsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
    nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
    blockedPendingNativeGpuRuntimeProofTools: 8,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    records: allTools.map((toolId) => ({
      toolId,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
    })),
    booleans: {
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      gpuRuntimeOnDemandOnly: true,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
    },
  }
}

function acceptedChecksumEvidenceFixture() {
  return {
    decision: 'ai_graphics_model_weight_checksum_evidence_prepared_with_no_private_records',
    totalAiGraphicsTools: 21,
    modelWeightChecksumEvidenceRequiredTools: [
      'sam2',
      'birefnet',
      'real_esrgan',
      'rembg',
      'transparent_background',
    ],
    checksumEvidenceRecordsProvided: 5,
    checksumEvidenceRecordsAccepted: 5,
    manifestAuthoringEligibleRecords: 5,
    privateArtifactRefsLogged: 0,
    betaReadyModelWeightTools: 0,
    booleans: {
      all5ModelWeightToolsCovered: true,
      privateArtifactRefsNotLogged: true,
    },
  }
}

function acceptedPrivateEvidenceIntakeFixture() {
  return {
    decision: 'ai_graphics_model_weight_private_evidence_intake_prepared_with_runtime_blocks',
    status: 'private_model_weight_evidence_ready_for_native_gpu_proof_not_beta_ready',
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: 8,
    modelWeightManifestRequiredTools: modelWeightTools,
    checksumEvidenceRecordsAccepted: 5,
    manifestSupplementRecordsAccepted: 5,
    localPrivateManifestDraftsReady: 5,
    reviewedPrivateManifestRecordsAccepted: 5,
    nativeGpuProofInputEligibleRecords: 5,
    readyForNativeGpuProofInputRecords: 5,
    privateArtifactRefsLogged: 0,
    betaReadyModelWeightTools: 0,
    booleans: {
      readyForNativeGpuProofInput: true,
      checksumEvidenceAcceptedForAll5: true,
      manifestSupplementsAcceptedForAll5: true,
      localPrivateManifestDraftsReadyForAll5: true,
      reviewedPrivateManifestsAcceptedForAll5: true,
      privateArtifactRefsNotLogged: true,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function acceptedCloudRunResultCollectorFixture() {
  return {
    decision: 'ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only',
    currentStatus: 'external_beta_native_gpu_proof_cloud_run_result_collector_prepared_pending_private_cloud_run_logs',
    sourceCloudRunJobScaffoldBridgeAccepted: true,
    runtimeProfilesRequired: runtimeProfiles,
    counts: {
      runtimeProfilesExtracted: 6,
    },
    booleans: {
      sourceCloudRunJobScaffoldAccepted: true,
      sourceNativeGpuProofCollectionBridgeAccepted: true,
      gpuRuntimeApprovedNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function writeJsonPacket(root, fileName, packet) {
  const packetPath = path.join(root, fileName)
  fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
  return packetPath
}

function writeAcceptedNativeGpuProofCollectionPacket(root, manifestPacketPath, gpuPacketPath) {
  const perToolPath = writeJsonPacket(
    root,
    'accepted-external-beta-per-tool-runtime-proof.json',
    acceptedPerToolRuntimeProofFixture(),
  )
  const checksumPath = writeJsonPacket(
    root,
    'accepted-model-weight-checksum-evidence.json',
    acceptedChecksumEvidenceFixture(),
  )
  const privateEvidenceIntakePath = writeJsonPacket(
    root,
    'accepted-model-weight-private-evidence-intake.json',
    acceptedPrivateEvidenceIntakeFixture(),
  )
  const cloudRunResultCollectorPath = writeJsonPacket(
    root,
    'accepted-cloud-run-result-collector.json',
    acceptedCloudRunResultCollectorFixture(),
  )
  const collectionOutput = parseJsonOutput(runNpm(nativeGpuProofCollectionScriptName, [
    '--external-beta-per-tool-runtime-proof-packet',
    perToolPath,
    '--gpu-runtime-proof-command-plan-packet',
    path.join(process.cwd(), 'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json'),
    '--model-weight-checksum-evidence-packet',
    checksumPath,
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--model-weight-private-evidence-intake-packet',
    privateEvidenceIntakePath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--cloud-run-result-collector-packet',
    cloudRunResultCollectorPath,
    '--external-beta-native-gpu-proof-collection-policy-ref',
    'external-beta-evidence://ai-graphics/native-gpu-proof/policy',
    '--external-beta-native-gpu-proof-collection-schema-ref',
    'external-beta-evidence://ai-graphics/native-gpu-proof/schema',
    '--external-beta-native-gpu-proof-collection-host-pool-ref',
    'backend-evidence://ai-graphics/native-gpu-proof/nvidia-l4-host-pool',
    '--external-beta-native-gpu-proof-collection-private-artifact-namespace-ref',
    'private://ai-graphics/model-weight-artifacts',
    '--external-beta-native-gpu-proof-collection-telemetry-ref',
    'backend-evidence://ai-graphics/native-gpu-proof/telemetry',
    '--external-beta-native-gpu-proof-collection-rollback-ref',
    'backend-evidence://ai-graphics/native-gpu-proof/rollback',
  ]), 'accepted_native_gpu_proof_collection')

  if (collectionOutput.decision !== 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready') {
    fail(`native_gpu_collection_fixture_status:${collectionOutput.decision}`)
  }

  return writeJsonPacket(
    root,
    'external-beta-native-gpu-proof-collection-packet.json',
    collectionOutput,
  )
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

function expectSourceGatePacketRejected(label, packetRoot, sourceGatePacket, mutatePacket) {
  const packet = typeof mutatePacket === 'function' ? mutatePacket(deepClone(sourceGatePacket)) : deepClone(sourceGatePacket)
  const packetPath = writeJsonPacket(
    packetRoot,
    `bad-internal-beta-production-worker-gate-readiness-packet-${label}.json`,
    packet,
  )
  try {
    runNpm(runScriptName, [
      '--internal-beta-production-worker-gate-readiness-packet',
      packetPath,
      '--require-internal-beta-go-no-go-ready',
    ])
    fail(`bad_source_production_worker_gate_packet_was_accepted:${label}`)
  } catch {
    // Expected: malformed source gate evidence must fail before rollup acceptance.
  }
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
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
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
  'ai_graphics_external_beta_native_gpu_proof_collection_prepared_with_private_manifest_and_runtime_result_blocks',
]) {
  if (!docs.sourceDecisions?.includes(decision)) fail(`docs_missing_source_decision:${decision}`)
}
for (const [key, expected] of Object.entries({
  acceptsProductionWorkerGateReadinessPacket: true,
  acceptsExternalBetaNativeGpuProofCollectionPacket: true,
  sourceProductionWorkerGatePacketMustReportOwnerApprovedGateChecksReady: true,
  sourceProductionWorkerGatePacketMustCoverAll21Tools: true,
  sourceProductionWorkerGatePacketMustCoverAll12Capabilities: true,
  sourceProductionWorkerGatePacketMustHaveZeroHardFailures: true,
  sourceProductionWorkerGatePacketMustPreserveEightGpuRuntimeTargets: true,
  sourceProductionWorkerGatePacketMustPreserveOnDemandGpuRuntimePolicy: true,
  sourceProductionWorkerGatePacketMustKeepNoIdleGpuRuntime: true,
  sourceProductionWorkerGatePacketMustBlockCpuFallbackForHeavyTools: true,
  sourceProductionWorkerGatePacketMustKeepEnqueueDispatchRuntimeGpuAndProductionFalse: true,
  sourceNativeGpuProofCollectionPacketMustBeReadyForPerToolRuntimeProofRecheck: true,
  sourceNativeGpuProofCollectionPacketMustAcceptAll8GpuRuntimeToolsWithProvidedEvidence: true,
  sourceNativeGpuProofCollectionPacketMustKeepGpuRuntimeExecutionFalse: true,
  rollupStillDoesNotApproveExecutionOrRuntime: true,
})) {
  if (docs.sourceEvidencePolicy?.[key] !== expected) {
    fail(`docs_source_evidence_policy_mismatch:${key}:${docs.sourceEvidencePolicy?.[key]}`)
  }
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
if (!moduleSource.includes('AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION')) {
  fail('module_missing_native_gpu_proof_collection_decision_constant')
}
if (!moduleSource.includes('sourceProductionWorkerGateReadinessPacket')) {
  fail('module_missing_source_production_worker_gate_packet_input')
}
if (!moduleSource.includes('sourceExternalBetaNativeGpuProofCollectionPacket')) {
  fail('module_missing_source_native_gpu_proof_collection_packet_input')
}
for (const bridgeNeedle of [
  'cloudRunResultCollectorProfilesAccepted',
  'sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence',
  'sourceCloudRunResultCollectorAccepted',
]) {
  if (!moduleSource.includes(bridgeNeedle)) fail(`module_missing_cloud_run_collector_bridge:${bridgeNeedle}`)
}
if (!cliSource.includes('--internal-beta-production-worker-gate-readiness-packet')) {
  fail('cli_missing_production_worker_gate_readiness_packet_flag')
}
if (!cliSource.includes('--external-beta-native-gpu-proof-collection-packet')) {
  fail('cli_missing_native_gpu_proof_collection_packet_flag')
}
if (!cliSource.includes('sourceProductionWorkerGateReadinessPacketRead')) {
  fail('cli_missing_production_worker_gate_packet_read_marker')
}
if (!cliSource.includes('sourceExternalBetaNativeGpuProofCollectionPacketRead')) {
  fail('cli_missing_native_gpu_proof_collection_packet_read_marker')
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
  'live service-role queue writes',
  'production worker dispatch',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'signed URL creation',
  'public artifact creation',
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
  nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence: 8,
  nativeGpuRuntimeProofProfilesAcceptedWithProvidedEvidence: 6,
  modelWeightManifestReviewAcceptedWithProvidedEvidence: 5,
  internalBetaReadyNowTools: 0,
  externalBetaReadyNowTools: 21,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count_mismatch:${key}:${docs.counts?.[key]}`)
}
if (docs.gpuRuntimeTargetsExact !== true) fail('docs_gpu_runtime_targets_not_exact')
if (docs.gpuRuntimeOnDemandOnly !== true) fail('docs_gpu_runtime_not_on_demand')
if (docs.nativeGpuProofCollection?.acceptedWithProvidedEvidence !== true) {
  fail('docs_native_gpu_collection_not_accepted')
}
if (docs.nativeGpuProofCollection?.readyForPerToolRuntimeProofRecheck !== true) {
  fail('docs_native_gpu_collection_not_ready_for_recheck')
}
if (docs.nativeGpuProofCollection?.status !== 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready') {
  fail(`docs_native_gpu_collection_status:${docs.nativeGpuProofCollection?.status}`)
}
if (docs.nativeGpuProofCollection?.sourcePacketFlag !== '--external-beta-native-gpu-proof-collection-packet') {
  fail(`docs_native_gpu_collection_flag:${docs.nativeGpuProofCollection?.sourcePacketFlag}`)
}
if (docs.externalBetaActivatedLaunchReadiness?.acceptedWithProvidedEvidence !== true) {
  fail('docs_external_beta_activated_launch_not_accepted')
}
if (docs.externalBetaActivatedLaunchReadiness?.externalBetaReadyNowTools !== 21) {
  fail('docs_external_beta_activated_launch_ready_tools_not_21')
}
if (docs.externalBetaActivatedLaunchReadiness?.gpuRuntimeShouldStartNow !== false) {
  fail('docs_external_beta_activated_launch_gpu_should_start_not_false')
}
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
for (const phrase of [
  'service-role queue smoke preflight',
  'accepted saved service-role queue smoke proof',
  'does not approve live queue writes',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_external_beta_queue_gate:${phrase}`)
}
for (const phrase of [
  'exactly eight GPU/model gate checks',
  'exactly eight nested GPU/model source job payloads',
  'on-demand-only GPU runtime',
  'no idle GPU runtime approval',
  'CPU fallback blocked for heavy/model tools',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing_source_gpu_policy:${phrase}`)
}
for (const key of [
  'betaProductionReadinessRollupPrepared',
  'sourceActivationGapAccepted',
  'sourceCrossOwnerCoordinationAccepted',
  'sourceProductionWorkerGateAcceptedWithProvidedEvidence',
  'sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence',
  'nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck',
  'nativeGpuRuntimeProofAcceptedForAll8GpuToolsWithProvidedEvidence',
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
  'externalBetaGoNoGoReadyWithProvidedEvidence',
  'externalBetaActivatedLaunchReadyWithProvidedEvidence',
  'externalBetaReadyNow',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const key of [
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
const packetRoot = path.dirname(manifestPacketPath)
const nativeGpuProofCollectionPacketPath = writeAcceptedNativeGpuProofCollectionPacket(
  packetRoot,
  manifestPacketPath,
  gpuPacketPath,
)
const nativeGpuProofCollectionPacket = json(nativeGpuProofCollectionPacketPath)
if (nativeGpuProofCollectionPacket.counts?.cloudRunResultCollectorProfilesAccepted !== 6) {
  fail('native_gpu_collection_cloud_run_collector_profiles_not_6')
}
if (nativeGpuProofCollectionPacket.booleans?.sourceCloudRunResultCollectorAccepted !== true) {
  fail('native_gpu_collection_cloud_run_collector_not_accepted')
}
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
    '--require-internal-beta-go-no-go-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_rollup')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)

const sourceGatePacket = parseJsonOutput(runNpm('ai-graphics:internal-beta-production-worker-gate-readiness', [
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
]), 'source_production_worker_gate_packet')
const sourceGatePacketPath = writeJsonPacket(
  packetRoot,
  'internal-beta-production-worker-gate-readiness-packet.json',
  sourceGatePacket,
)
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
  '--internal-beta-production-worker-gate-readiness-packet',
  sourceGatePacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-internal-beta-go-no-go-ready',
]), 'approved_rollup')
const packetFedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--internal-beta-production-worker-gate-readiness-packet',
  sourceGatePacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
  '--require-internal-beta-go-no-go-ready',
]), 'packet_fed_rollup')
const activatedPacketFedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--internal-beta-production-worker-gate-readiness-packet',
  sourceGatePacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
  '--external-beta-activated-launch-readiness-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
  '--require-internal-beta-go-no-go-ready',
  '--require-external-beta-ready',
]), 'activated_packet_fed_rollup')

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
if (approvedOutput.nativeGpuProofCollectionAcceptedWithProvidedEvidence !== true) {
  fail('approved_native_gpu_collection_not_accepted')
}
if (approvedOutput.nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck !== true) {
  fail('approved_native_gpu_collection_not_ready_for_recheck')
}
if (approvedOutput.nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence !== 8) {
  fail('approved_native_gpu_accepted_tools_not_8')
}
if (approvedOutput.nativeGpuRuntimeProofProfilesAcceptedWithProvidedEvidence !== 6) {
  fail('approved_native_gpu_accepted_profiles_not_6')
}
if (approvedOutput.modelWeightManifestReviewAcceptedWithProvidedEvidence !== 5) {
  fail('approved_model_manifest_review_not_5')
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

if (sourceGatePacket.status !== 'owner_approved_production_worker_gate_checks_ready') {
  fail(`source_gate_packet_status:${sourceGatePacket.status}`)
}
if (sourceGatePacket.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('source_gate_packet_gate_checks_not_21')
}
if (sourceGatePacket.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('source_gate_packet_capability_checks_not_12')
}
if (sourceGatePacket.hardFailedGateChecksWithProvidedEvidence !== 0) {
  fail('source_gate_packet_hard_failures_not_0')
}
if (sourceGatePacket.booleans?.gpuRuntimeApprovedNow !== false) {
  fail('source_gate_packet_gpu_runtime_not_false')
}

if (packetFedOutput.input?.sourceEvidenceMode !== 'internal_beta_production_worker_gate_readiness_packet') {
  fail(`packet_fed_source_evidence_mode:${packetFedOutput.input?.sourceEvidenceMode}`)
}
if (packetFedOutput.input?.sourceProductionWorkerGateReadinessPacketRead !== true) {
  fail('packet_fed_source_production_worker_gate_packet_not_read')
}
if (packetFedOutput.status !== 'owner_approved_worker_gates_ready_runtime_still_blocked') {
  fail(`packet_fed_status:${packetFedOutput.status}`)
}
if (packetFedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence !== 21) {
  fail('packet_fed_gate_checks_not_21')
}
if (packetFedOutput.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence !== 12) {
  fail('packet_fed_capability_gate_checks_not_12')
}
if (packetFedOutput.hardFailedProductionWorkerGateChecksWithProvidedEvidence !== 0) {
  fail('packet_fed_hard_failed_gate_checks_not_0')
}
if (packetFedOutput.booleans?.sourceProductionWorkerGateAcceptedWithProvidedEvidence !== true) {
  fail('packet_fed_source_gate_not_accepted')
}
if (packetFedOutput.input?.sourceExternalBetaNativeGpuProofCollectionPacketRead !== true) {
  fail('packet_fed_native_gpu_collection_packet_not_read')
}
if (packetFedOutput.booleans?.sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence !== true) {
  fail('packet_fed_native_gpu_collection_not_accepted')
}
if (packetFedOutput.nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence !== 8) {
  fail('packet_fed_native_gpu_accepted_tools_not_8')
}
if (packetFedOutput.booleans?.internalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('packet_fed_internal_beta_go_no_go_not_true')
}
if (packetFedOutput.booleans?.externalBetaGoNoGoReadyWithProvidedEvidence !== false) {
  fail('packet_fed_external_beta_go_no_go_not_false')
}
if (packetFedOutput.booleans?.productionGoNoGoReadyWithProvidedEvidence !== false) {
  fail('packet_fed_production_go_no_go_not_false')
}

if (activatedPacketFedOutput.input?.sourceExternalBetaActivatedLaunchReadinessPacketRead !== true) {
  fail('activated_packet_fed_activated_launch_packet_not_read')
}
if (activatedPacketFedOutput.externalBetaReadyNowTools !== 21) {
  fail('activated_packet_fed_external_beta_ready_tools_not_21')
}
if (activatedPacketFedOutput.productionReadyNowTools !== 0) {
  fail('activated_packet_fed_production_ready_tools_not_0')
}
if (activatedPacketFedOutput.booleans?.externalBetaGoNoGoReadyWithProvidedEvidence !== true) {
  fail('activated_packet_fed_external_beta_go_no_go_not_true')
}
if (activatedPacketFedOutput.booleans?.externalBetaActivatedLaunchReadyWithProvidedEvidence !== true) {
  fail('activated_packet_fed_activated_launch_not_true')
}
if (activatedPacketFedOutput.booleans?.externalBetaReadyNow !== true) {
  fail('activated_packet_fed_external_beta_ready_not_true')
}
if (activatedPacketFedOutput.booleans?.productionReadyNow !== false) {
  fail('activated_packet_fed_production_ready_not_false')
}

expectSourceGatePacketRejected('missing_tool_coverage', packetRoot, sourceGatePacket, (packet) =>
  deepMerge(packet, { totalAiGraphicsTools: 20 }),
)
expectSourceGatePacketRejected('missing_capability_coverage', packetRoot, sourceGatePacket, (packet) =>
  deepMerge(packet, { totalProductFacingCapabilities: 11 }),
)
expectSourceGatePacketRejected('wrong_gpu_gate_check_count', packetRoot, sourceGatePacket, (packet) => {
  const gateCheck = packet.productionWorkerGateChecks.find((candidate) => candidate.toolId === 'sam2')
  gateCheck.toolId = 'sam2_misclassified'
  return packet
})
expectSourceGatePacketRejected('wrong_nested_gpu_source_payload_count', packetRoot, sourceGatePacket, (packet) => {
  const payload = packet.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
    (candidate) => candidate.sourceToolId === 'sam2',
  )
  payload.sourceToolId = 'sam2_misclassified'
  return packet
})
expectSourceGatePacketRejected('gpu_runtime_on_demand_policy_removed', packetRoot, sourceGatePacket, (packet) => {
  const payload = packet.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
    (candidate) => candidate.sourceToolId === 'sam2',
  )
  payload.productionWorkerJobPayload.metadata.aiGraphicsRuntimeActivationPolicy.onDemandOnly = false
  return packet
})
expectSourceGatePacketRejected('idle_gpu_runtime_approved', packetRoot, sourceGatePacket, (packet) => {
  const payload = packet.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
    (candidate) => candidate.sourceToolId === 'sam2',
  )
  payload.productionWorkerJobPayload.metadata.noIdleGpuRuntimeApproved = false
  return packet
})
expectSourceGatePacketRejected('heavy_tool_cpu_fallback_allowed', packetRoot, sourceGatePacket, (packet) => {
  const payload = packet.sourceProductionWorkerJobReadiness.productionWorkerJobPayloads.find(
    (candidate) => candidate.sourceToolId === 'sam2',
  )
  payload.productionWorkerJobPayload.metadata.cpuFallbackAllowedForHeavyTools = true
  return packet
})
expectSourceGatePacketRejected('gpu_runtime_approved_now', packetRoot, sourceGatePacket, (packet) =>
  deepMerge(packet, { booleans: { gpuRuntimeApprovedNow: true } }),
)
expectSourceGatePacketRejected('production_worker_dispatch_approved_now', packetRoot, sourceGatePacket, (packet) =>
  deepMerge(packet, { booleans: { productionWorkerDispatchApprovedNow: true } }),
)
expectSourceGatePacketRejected('tool_execution_performed', packetRoot, sourceGatePacket, (packet) =>
  deepMerge(packet, { booleans: { toolExecutionPerformed: true } }),
)

for (const output of [defaultOutput, awaitingOutput, approvedOutput, packetFedOutput, activatedPacketFedOutput]) {
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
if (!scorecard.includes('service-role queue smoke preflight') || !scorecard.includes('saved service-role queue smoke proof')) {
  fail('scorecard_missing_external_beta_queue_smoke_gates')
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
  '+    "ai-graphics:production-launch-controls": "tsx server/cli/ai-graphics-production-launch-controls.ts",',
  '+    "ai-graphics:production-launch-controls:diagnostics": "node scripts/validation/ai-graphics-production-launch-controls-diagnostics.mjs",',
  '+    "ai-graphics:production-launch-readiness-gap": "tsx server/cli/ai-graphics-production-launch-readiness-gap.ts",',
  '+    "ai-graphics:production-launch-readiness-gap:diagnostics": "node scripts/validation/ai-graphics-production-launch-readiness-gap-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-callable-scope": "tsx server/cli/ai-graphics-external-beta-callable-scope.ts",',
  '+    "ai-graphics:external-beta-callable-scope:diagnostics": "node scripts/validation/ai-graphics-external-beta-callable-scope-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-callable-request-admission": "tsx server/cli/ai-graphics-external-beta-callable-request-admission.ts",',
  '+    "ai-graphics:external-beta-callable-request-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-callable-request-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-boundary": "tsx server/cli/ai-graphics-external-beta-api-route-boundary.ts",',
  '+    "ai-graphics:external-beta-api-route-boundary:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-boundary-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-insertion-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-insertion-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-insertion-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-insertion-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${perToolRuntimeProofScriptName}": "${perToolRuntimeProofScriptCommand}",`,
  `+    "${perToolRuntimeProofDiagnosticScriptName}": "${perToolRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${nativeGpuProofCollectionScriptName}": "${nativeGpuProofCollectionScriptCommand}",`,
  `+    "${nativeGpuProofCollectionDiagnosticScriptName}": "${nativeGpuProofCollectionDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:model-weight-source-catalog:diagnostics": "node scripts/validation/ai-graphics-model-weight-source-catalog-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-checksum-evidence:validate": "tsx server/cli/ai-graphics-model-weight-checksum-evidence.ts",',
  '+    "ai-graphics:model-weight-checksum-evidence:diagnostics": "node scripts/validation/ai-graphics-model-weight-checksum-evidence-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-checksum-evidence-scaffold": "tsx server/cli/ai-graphics-model-weight-checksum-evidence-scaffold.ts",',
  '+    "ai-graphics:model-weight-checksum-evidence-scaffold:diagnostics": "node scripts/validation/ai-graphics-model-weight-checksum-evidence-scaffold-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-manifest-authoring": "tsx server/cli/ai-graphics-model-weight-manifest-authoring.ts",',
  '+    "ai-graphics:model-weight-manifest-authoring:diagnostics": "node scripts/validation/ai-graphics-model-weight-manifest-authoring-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-manifest-supplement:validate": "tsx server/cli/ai-graphics-model-weight-manifest-supplement.ts",',
  '+    "ai-graphics:model-weight-manifest-supplement:diagnostics": "node scripts/validation/ai-graphics-model-weight-manifest-supplement-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-manifest-supplement-scaffold": "tsx server/cli/ai-graphics-model-weight-manifest-supplement-scaffold.ts",',
  '+    "ai-graphics:model-weight-manifest-supplement-scaffold:diagnostics": "node scripts/validation/ai-graphics-model-weight-manifest-supplement-scaffold-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go": "tsx server/cli/ai-graphics-internal-beta-go-no-go.ts",',
  '+    "ai-graphics:internal-beta-go-no-go:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval": "tsx server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval": "tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs",',
  '+    "ai-graphics:on-demand-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-on-demand-runtime-admission-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-readiness-gate": "tsx server/cli/ai-graphics-external-beta-readiness-gate.ts",',
  '+    "ai-graphics:external-beta-readiness-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-readiness-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-scaffold": "tsx server/cli/ai-graphics-external-beta-evidence-scaffold.ts",',
  '+    "ai-graphics:external-beta-evidence-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-scaffold-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-packet:validate": "tsx server/cli/ai-graphics-external-beta-evidence-packet.ts",',
  '+    "ai-graphics:external-beta-evidence-packet:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-packet-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-gap-report": "tsx server/cli/ai-graphics-external-beta-launch-gap-report.ts",',
  '+    "ai-graphics:external-beta-launch-gap-report:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-gap-report-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-go-no-go": "tsx server/cli/ai-graphics-external-beta-launch-go-no-go.ts",',
  '+    "ai-graphics:external-beta-launch-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-runtime-admission": "tsx server/cli/ai-graphics-external-beta-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-runtime-admission-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-private-evidence-intake": "tsx server/cli/ai-graphics-model-weight-private-evidence-intake.ts",',
  '+    "ai-graphics:model-weight-private-evidence-intake:diagnostics": "node scripts/validation/ai-graphics-model-weight-private-evidence-intake-diagnostics.mjs",',
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
  packetFedSourceEvidenceMode: packetFedOutput.input?.sourceEvidenceMode,
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuRuntimeTargetedTools: approvedOutput.gpuRuntimeTargetedTools,
  gpuRuntimeTargetsExact: approvedOutput.gpuRuntimeTargetsExact,
  gpuRuntimeOnDemandOnly: approvedOutput.gpuRuntimeOnDemandOnly,
  productionWorkerGateChecksAcceptedWithProvidedEvidence:
    approvedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence,
  packetFedProductionWorkerGateChecksAcceptedWithProvidedEvidence:
    packetFedOutput.productionWorkerGateChecksAcceptedWithProvidedEvidence,
  hardFailedProductionWorkerGateChecksWithProvidedEvidence:
    approvedOutput.hardFailedProductionWorkerGateChecksWithProvidedEvidence,
  nativeGpuProofCollectionAcceptedWithProvidedEvidence:
    approvedOutput.nativeGpuProofCollectionAcceptedWithProvidedEvidence,
  nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck:
    approvedOutput.nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck,
  nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence:
    approvedOutput.nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence,
  internalBetaReadyNowTools: approvedOutput.internalBetaReadyNowTools,
  externalBetaReadyNowTools: approvedOutput.externalBetaReadyNowTools,
  activatedPacketFedExternalBetaReadyNowTools:
    activatedPacketFedOutput.externalBetaReadyNowTools,
  productionReadyNowTools: approvedOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
  productionReadyNow: approvedOutput.booleans?.productionReadyNow,
}, null, 2))
