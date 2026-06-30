import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-native-gpu-proof-collection'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-collection-diagnostics.mjs'

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

const runtimeProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const expectedRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
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
    modelWeightChecksumEvidenceRequiredTools: modelWeightTools,
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

function acceptedManifestReviewFixture() {
  return {
    decision: 'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records',
    totalAiGraphicsTools: 21,
    modelWeightManifestRequiredTools: modelWeightTools,
    manifestRecordsProvided: 5,
    schemaValidManifestRecords: 5,
    reviewAcceptedManifestRecords: 5,
    nativeGpuProofInputEligibleRecords: 5,
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

function acceptedGpuProofResultFixture() {
  return {
    decision: 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results',
    status: 'ready_for_owner_review_not_beta_ready',
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: gpuTools,
    expectedGpuRuntimeTargets: expectedRuntimeTargets,
    modelWeightManifestRequiredTools: modelWeightTools,
    runtimeProfilesRequired: runtimeProfiles,
    runtimeProofResultsProvided: 6,
    runtimeProofResultsAcceptedForOwnerReview: 6,
    nativeGpuRuntimeProofResultsAccepted: true,
    booleans: {
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: true,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
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

function assertFalseGates(container, label) {
  for (const key of falseGateKeys) {
    if (container?.booleans?.[key] !== false) {
      fail(`${label}_required_false_boolean_not_false:${key}`)
    }
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-native-gpu-proof-collection.ts',
  'server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts',
  'server/tool-registry/ai-graphics-external-beta-per-tool-runtime-proof.ts',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-command-plan.ts',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.md',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
  'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-result-collector.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.md')
const source = read('server/tool-registry/ai-graphics-external-beta-native-gpu-proof-collection.ts')
const cli = read('server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts')
const index = read('server/tool-registry/index.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-native-gpu-proof-collection'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_native_gpu_proof_collection_prepared_with_private_manifest_and_runtime_result_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.currentStatus !== 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results') {
  fail(`unexpected_docs_current_status:${docs.currentStatus}`)
}
if (docs.readyAfterEvidenceStatus !== 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready') {
  fail(`unexpected_docs_ready_status:${docs.readyAfterEvidenceStatus}`)
}

for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
  if (!source.includes(`'${tool}'`)) fail(`source_missing_gpu_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_gpu_tool:${tool}`)
  if (docs.expectedGpuRuntimeTargets?.[tool] !== expectedRuntimeTargets[tool]) {
    fail(`docs_runtime_target_mismatch:${tool}:${docs.expectedGpuRuntimeTargets?.[tool]}`)
  }
}
for (const tool of modelWeightTools) {
  if (!docs.modelWeightManifestRequiredTools?.includes(tool)) fail(`docs_missing_model_weight_tool:${tool}`)
}
for (const profile of runtimeProfiles) {
  if (!docs.runtimeProfilesRequired?.includes(profile)) fail(`docs_missing_runtime_profile:${profile}`)
}

for (const [key, expected] of Object.entries({
  gpuRuntimeTargetedTools: 8,
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
  sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence: 0,
  modelWeightChecksumEvidenceRequiredTools: 5,
  modelWeightChecksumEvidenceAccepted: 0,
  modelWeightManifestRequiredTools: 5,
  modelWeightManifestReviewAccepted: 0,
  modelWeightPrivateEvidenceIntakeAccepted: 0,
  nativeGpuRuntimeProofProfilesRequired: 6,
  nativeGpuRuntimeProofProfilesAccepted: 0,
  cloudRunResultCollectorProfilesAccepted: 0,
  nativeGpuRuntimeProofAcceptedTools: 0,
  blockedPendingPrivateManifestTools: 5,
  blockedPendingNativeGpuRuntimeProofTools: 8,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}

for (const key of [
  'externalBetaNativeGpuProofCollectionPrepared',
  'sourcePerToolRuntimeProofAccepted',
  'sourceRuntimeQueueServiceProofBridgeAccepted',
  'commandPlanAccepted',
  'all8GpuRuntimeToolsCovered',
  'all5ModelWeightToolsCovered',
  'all6NativeGpuProfilesCovered',
  'gpuRuntimeTargetsExact',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'localOnlyEvidenceCollection',
  'privateArtifactRefsRequired',
  'privateArtifactRefsNotLogged',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of [
  'checksumEvidenceAcceptedForAll5ModelTools',
  'privateModelManifestsAcceptedForAll5ModelTools',
  'privateModelWeightEvidenceIntakeAcceptedForAll5ModelTools',
  'nativeGpuRuntimeProofResultsAcceptedForAll6Profiles',
  'sourceCloudRunResultCollectorAccepted',
  'sourceNativeGpuProofCollectionBridgeAccepted',
  'readyForPerToolRuntimeProofRecheck',
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_current_block_not_false:${key}`)
}
assertFalseGates(docs, 'docs')
if (docs.booleans?.cpuFallbackAllowedForHeavyTools !== false) {
  fail('docs_cpu_fallback_allowed_for_heavy_tools')
}
if (!markdown.includes('GPU runtime is on-demand only')) fail('markdown_missing_on_demand_policy')
if (!markdown.includes('sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence=21')) {
  fail('markdown_missing_source_bridge_policy')
}
if (!markdown.includes('sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence=6')) {
  fail('markdown_missing_cloud_run_collector_bridge_policy')
}
if (!markdown.includes('Current accepted private checksum evidence: `0 / 5`')) {
  fail('markdown_missing_checksum_block')
}
if (!markdown.includes('Current accepted native GPU proof profiles: `0 / 6`')) {
  fail('markdown_missing_native_gpu_block')
}
if (!markdown.includes('Current accepted combined private model-weight evidence intake: `0 / 5`')) {
  fail('markdown_missing_private_evidence_intake_block')
}
if (!markdown.includes('Current accepted Cloud Run result collector profiles: `0 / 6`')) {
  fail('markdown_missing_cloud_run_collector_block')
}

for (const token of [
  '--external-beta-per-tool-runtime-proof-packet',
  '--gpu-runtime-proof-command-plan-packet',
  '--model-weight-checksum-evidence-packet',
  '--model-weight-manifest-review-packet',
  '--model-weight-private-evidence-intake-packet',
  '--gpu-runtime-proof-result-packet',
  '--cloud-run-result-collector-packet',
  '--external-beta-native-gpu-proof-collection-policy-ref',
  'dependencyInstallPerformed: false',
  'gpuRuntimePerformed: false',
  'modelWeightsLoaded: false',
]) {
  if (!cli.includes(token)) fail(`cli_missing:${token}`)
}
for (const token of [
  'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results',
  'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready',
  'startsOnlyForApprovedWorkerOrToolCall',
  'cpuFallbackAllowedForHeavyTools: false',
  'readyForPerToolRuntimeProofRecheck',
  'sourceCloudRunResultCollectorAccepted',
  'cloudRunResultCollectorAccepted',
  'privateEvidenceIntakeAccepted',
  'privateArtifactRefsNotLogged',
]) {
  if (!source.includes(token)) fail(`source_missing:${token}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-native-gpu-proof-collection-'))
const perToolPath = writeJson(path.join(tempDir, 'per-tool.json'), acceptedPerToolRuntimeProofFixture())
const commandPlanPath = path.join(process.cwd(), 'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json')
const checksumPath = path.join(process.cwd(), 'docs/tool-intelligence/ai-graphics/model-weight-checksum-evidence.json')
const manifestPath = path.join(process.cwd(), 'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const resultPath = path.join(process.cwd(), 'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json')

const safeRefArgs = [
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
]

const currentOutput = runNpm(runScriptName, [
  '--external-beta-per-tool-runtime-proof-packet',
  perToolPath,
  '--gpu-runtime-proof-command-plan-packet',
  commandPlanPath,
  '--model-weight-checksum-evidence-packet',
  checksumPath,
  '--model-weight-manifest-review-packet',
  manifestPath,
  '--gpu-runtime-proof-result-packet',
  resultPath,
  ...safeRefArgs,
])
const currentPacket = parseJsonOutput(currentOutput, 'current_collection')
if (currentPacket.decision !== 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results') {
  fail(`current_collection_decision_mismatch:${currentPacket.decision}`)
}
if (currentPacket.counts?.modelWeightChecksumEvidenceAccepted !== 0) {
  fail('current_collection_checksum_evidence_not_zero')
}
if (currentPacket.counts?.modelWeightManifestReviewAccepted !== 0) {
  fail('current_collection_manifest_review_not_zero')
}
if (currentPacket.counts?.nativeGpuRuntimeProofProfilesAccepted !== 0) {
  fail('current_collection_native_profiles_not_zero')
}
if (currentPacket.counts?.blockedPendingNativeGpuRuntimeProofTools !== 8) {
  fail('current_collection_gpu_blocked_not_8')
}
if (currentPacket.booleans?.readyForPerToolRuntimeProofRecheck !== false) {
  fail('current_collection_ready_for_recheck_not_false')
}
assertFalseGates(currentPacket, 'current_collection')

const acceptedChecksumPath = writeJson(path.join(tempDir, 'accepted-checksum.json'), acceptedChecksumEvidenceFixture())
const acceptedManifestPath = writeJson(path.join(tempDir, 'accepted-manifest.json'), acceptedManifestReviewFixture())
const acceptedPrivateEvidenceIntakePath =
  writeJson(path.join(tempDir, 'accepted-private-evidence-intake.json'), acceptedPrivateEvidenceIntakeFixture())
const acceptedGpuResultPath = writeJson(path.join(tempDir, 'accepted-gpu-result.json'), acceptedGpuProofResultFixture())
const acceptedCollectorPath =
  writeJson(path.join(tempDir, 'accepted-cloud-run-result-collector.json'), acceptedCloudRunResultCollectorFixture())
const readyWithoutCollectorOutput = runNpm(runScriptName, [
  '--external-beta-per-tool-runtime-proof-packet',
  perToolPath,
  '--gpu-runtime-proof-command-plan-packet',
  commandPlanPath,
  '--model-weight-checksum-evidence-packet',
  acceptedChecksumPath,
  '--model-weight-manifest-review-packet',
  acceptedManifestPath,
  '--model-weight-private-evidence-intake-packet',
  acceptedPrivateEvidenceIntakePath,
  '--gpu-runtime-proof-result-packet',
  acceptedGpuResultPath,
  ...safeRefArgs,
])
const readyWithoutCollectorPacket = parseJsonOutput(readyWithoutCollectorOutput, 'ready_without_collector_collection')
if (readyWithoutCollectorPacket.decision !==
  'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results') {
  fail(`ready_without_collector_decision_mismatch:${readyWithoutCollectorPacket.decision}`)
}
if (readyWithoutCollectorPacket.booleans?.sourceCloudRunResultCollectorAccepted !== false) {
  fail('ready_without_collector_source_collector_not_false')
}
if (readyWithoutCollectorPacket.booleans?.readyForPerToolRuntimeProofRecheck !== false) {
  fail('ready_without_collector_ready_for_recheck_not_false')
}

const readyWithoutIntakeOutput = runNpm(runScriptName, [
  '--external-beta-per-tool-runtime-proof-packet',
  perToolPath,
  '--gpu-runtime-proof-command-plan-packet',
  commandPlanPath,
  '--model-weight-checksum-evidence-packet',
  acceptedChecksumPath,
  '--model-weight-manifest-review-packet',
  acceptedManifestPath,
  '--gpu-runtime-proof-result-packet',
  acceptedGpuResultPath,
  '--cloud-run-result-collector-packet',
  acceptedCollectorPath,
  ...safeRefArgs,
])
const readyWithoutIntakePacket = parseJsonOutput(readyWithoutIntakeOutput, 'ready_without_intake_collection')
if (readyWithoutIntakePacket.decision !==
  'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results') {
  fail(`ready_without_intake_decision_mismatch:${readyWithoutIntakePacket.decision}`)
}
if (readyWithoutIntakePacket.counts?.modelWeightPrivateEvidenceIntakeAccepted !== 0) {
  fail('ready_without_intake_count_not_zero')
}
if (readyWithoutIntakePacket.booleans?.privateModelWeightEvidenceIntakeAcceptedForAll5ModelTools !== false) {
  fail('ready_without_intake_boolean_not_false')
}
if (readyWithoutIntakePacket.booleans?.readyForPerToolRuntimeProofRecheck !== false) {
  fail('ready_without_intake_ready_for_recheck_not_false')
}

const readyOutput = runNpm(runScriptName, [
  '--external-beta-per-tool-runtime-proof-packet',
  perToolPath,
  '--gpu-runtime-proof-command-plan-packet',
  commandPlanPath,
  '--model-weight-checksum-evidence-packet',
  acceptedChecksumPath,
  '--model-weight-manifest-review-packet',
  acceptedManifestPath,
  '--model-weight-private-evidence-intake-packet',
  acceptedPrivateEvidenceIntakePath,
  '--gpu-runtime-proof-result-packet',
  acceptedGpuResultPath,
  '--cloud-run-result-collector-packet',
  acceptedCollectorPath,
  ...safeRefArgs,
])
const readyPacket = parseJsonOutput(readyOutput, 'ready_collection')
if (readyPacket.decision !== 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready') {
  fail(`ready_collection_decision_mismatch:${readyPacket.decision}`)
}
if (readyPacket.counts?.nativeGpuRuntimeProofAcceptedTools !== 8) {
  fail('ready_collection_native_gpu_accepted_tools_not_8')
}
if (readyPacket.counts?.sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence !== 6) {
  fail('ready_collection_source_collector_bridge_not_6')
}
if (readyPacket.counts?.modelWeightPrivateEvidenceIntakeAccepted !== 5) {
  fail('ready_collection_private_evidence_intake_not_5')
}
if (readyPacket.booleans?.sourceCloudRunResultCollectorAccepted !== true) {
  fail('ready_collection_source_collector_not_true')
}
if (readyPacket.booleans?.privateModelWeightEvidenceIntakeAcceptedForAll5ModelTools !== true) {
  fail('ready_collection_private_evidence_intake_boolean_not_true')
}
if (readyPacket.booleans?.readyForPerToolRuntimeProofRecheck !== true) {
  fail('ready_collection_ready_for_recheck_not_true')
}
assertFalseGates(readyPacket, 'ready_collection')

const unsafeOutput = runNpm(runScriptName, [
  '--external-beta-per-tool-runtime-proof-packet',
  perToolPath,
  '--gpu-runtime-proof-command-plan-packet',
  commandPlanPath,
  '--model-weight-checksum-evidence-packet',
  checksumPath,
  '--model-weight-manifest-review-packet',
  manifestPath,
  '--gpu-runtime-proof-result-packet',
  resultPath,
  '--external-beta-native-gpu-proof-collection-policy-ref',
  'https://example.invalid/public-policy',
  '--external-beta-native-gpu-proof-collection-schema-ref',
  'external-beta-evidence://ai-graphics/native-gpu-proof/schema',
])
const unsafePacket = parseJsonOutput(unsafeOutput, 'unsafe_collection')
if (unsafePacket.decision !== 'missing_external_beta_native_gpu_proof_collection_controls') {
  fail(`unsafe_collection_decision_mismatch:${unsafePacket.decision}`)
}
if (!unsafePacket.missingNativeGpuProofCollectionControls?.includes('externalBetaNativeGpuProofCollectionPolicyRef')) {
  fail('unsafe_collection_did_not_reject_public_policy_ref')
}

const strippedBridgePerToolPath = writeJson(path.join(tempDir, 'stripped-bridge-per-tool.json'), {
  ...acceptedPerToolRuntimeProofFixture(),
  sourceToolRouteRuntimeProofBridgeAccepted: false,
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 0,
  records: allTools.map((toolId) => ({
    toolId,
    sourceRuntimeQueueServiceProofBridgeAccepted: false,
  })),
  booleans: {
    ...acceptedPerToolRuntimeProofFixture().booleans,
    sourceRuntimeQueueServiceProofBridgeAccepted: false,
  },
})
const strippedBridgeOutput = runNpm(runScriptName, [
  '--external-beta-per-tool-runtime-proof-packet',
  strippedBridgePerToolPath,
  '--gpu-runtime-proof-command-plan-packet',
  commandPlanPath,
  '--model-weight-checksum-evidence-packet',
  acceptedChecksumPath,
  '--model-weight-manifest-review-packet',
  acceptedManifestPath,
  '--model-weight-private-evidence-intake-packet',
  acceptedPrivateEvidenceIntakePath,
  '--gpu-runtime-proof-result-packet',
  acceptedGpuResultPath,
  '--cloud-run-result-collector-packet',
  acceptedCollectorPath,
  ...safeRefArgs,
])
const strippedBridgePacket = parseJsonOutput(strippedBridgeOutput, 'stripped_bridge_collection')
if (strippedBridgePacket.decision !== 'external_beta_per_tool_runtime_proof_rejected') {
  fail(`stripped_bridge_collection_decision_mismatch:${strippedBridgePacket.decision}`)
}
if (strippedBridgePacket.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted !== false) {
  fail('stripped_bridge_collection_source_bridge_not_false')
}

const packageLockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

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
  '+    "ai-graphics:production-controlled-dispatch-authorization-proof": "tsx server/cli/ai-graphics-production-controlled-dispatch-authorization-proof.ts",',
  '+    "ai-graphics:production-controlled-dispatch-authorization-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-dispatch-authorization-proof-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
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
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
])
for (const line of packageDiff.split(/\r?\n/)) {
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (/^[+-]\s*"dependencies"\s*:/.test(line) || /^[+-]\s*"devDependencies"\s*:/.test(line)) {
    fail('dependency_sections_changed')
  }
  if (/^[+]\s*"[^"]+"\s*:\s*"\^?[^"]+"/.test(line)) {
    fail(`unexpected_package_json_addition:${line}`)
  }
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const changedFiles = git(['diff', '--name-only', baseRef])
const generatedOutputPaths = changedFiles.split(/\r?\n/).filter((file) => (
  file &&
  (
    /(^|\/)(\.local-artifacts|render|renders|generated|canvas|webgl|public-artifacts)(\/|$)/i.test(file) ||
    /\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)$/i.test(file)
  )
))
if (generatedOutputPaths.length) fail(`generated_output_path_changed:${generatedOutputPaths.join(',')}`)

const allText = [
  markdown,
  JSON.stringify(docs),
  source,
].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeShouldStartNow["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /modelInferencePerformed["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dependencyInstallPerformed["`:\s]+true/i,
  /packageLockMutationPerformed["`:\s]+true/i,
]) {
  if (pattern.test(allText)) fail(`forbidden_true_claim:${pattern}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  currentDecision: currentPacket.decision,
  readyAfterEvidenceDecision: readyPacket.decision,
  gpuRuntimeTargetedTools: gpuTools.length,
  modelWeightManifestRequiredTools: modelWeightTools.length,
  nativeGpuRuntimeProofProfilesRequired: runtimeProfiles.length,
  currentPrivateManifestAcceptedTools: currentPacket.counts?.modelWeightManifestReviewAccepted,
  currentNativeGpuProofProfilesAccepted: currentPacket.counts?.nativeGpuRuntimeProofProfilesAccepted,
  currentBlockedPendingNativeGpuRuntimeProofTools: currentPacket.counts?.blockedPendingNativeGpuRuntimeProofTools,
  readyAfterEvidenceNativeGpuRuntimeProofAcceptedTools: readyPacket.counts?.nativeGpuRuntimeProofAcceptedTools,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
