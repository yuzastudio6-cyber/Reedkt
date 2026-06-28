import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'

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
const runScriptName = 'ai-graphics:external-beta-per-tool-runtime-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-per-tool-runtime-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-runtime-proof-diagnostics.mjs'
const sourceSmokeScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke'
const sourceProofScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke-proof'
const privateManifestScriptName = 'ai-graphics:external-beta-private-artifact-manifest'
const routeProofScriptName = 'ai-graphics:external-beta-tool-route-runtime-proof'

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

const jsTools = [
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
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
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
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'workerDispatchPerformed',
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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-per-tool-runtime-proof.ts',
  'server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts',
  'server/tool-registry/ai-graphics-external-beta-tool-route-runtime-proof.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json',
  'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-per-tool-runtime-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-per-tool-runtime-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const tool of allTools) if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
for (const tool of jsTools) {
  if (!docs.jsRuntimeProofAcceptedTools?.includes(tool)) fail(`docs_missing_js_runtime_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeBlockedTools?.includes(tool)) fail(`docs_missing_gpu_blocked_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  jsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
  blockedPendingNativeGpuRuntimeProofTools: 8,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const [key, expected] of Object.entries({
  sourceToolRouteRuntimeProofAccepted: true,
  sourceExternalBetaNativeGpuProofCollectionAcceptedForRecheck: true,
  runtimeProofRecordsPrepared: 21,
  runtimeProofAcceptedWithProvidedEvidenceTools: 13,
  jsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
  blockedPendingNativeGpuRuntimeProofTools: 8,
  nativeGpuRuntimeProofRequiredForGpuTools: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
  readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
  readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.acceptanceCriteria?.[key] !== expected) {
    fail(`unexpected_docs_acceptance:${key}:${docs.acceptanceCriteria?.[key]}`)
  }
}
for (const key of [
  'externalBetaPerToolRuntimeProofPrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'all13JsRuntimeProofsAccepted',
  'blockedPendingNativeGpuRuntimeProofTools',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of [
  'sourceExternalBetaNativeGpuProofCollectionAccepted',
  'all8NativeGpuRuntimeProofsAccepted',
  'nativeGpuRuntimeProofResultsAcceptedForOwnerReview',
  ...falseGateKeys,
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

if (!docs.runtimeProofGate?.requiredInputFlags?.includes('--external-beta-native-gpu-proof-collection-packet')) {
  fail('docs_runtime_gate_missing_native_gpu_collection_flag')
}
for (const [key, expected] of Object.entries({
  sourcePacketFlag: '--external-beta-native-gpu-proof-collection-packet',
  sourceCollectionDecision: 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready',
  acceptedDecision: 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks',
  runtimeProofAcceptedWithProvidedEvidenceTools: 21,
  nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
  blockedPendingNativeGpuRuntimeProofTools: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.readyAfterNativeGpuCollection?.[key] !== expected) {
    fail(`unexpected_ready_after_native_gpu_collection:${key}:${docs.readyAfterNativeGpuCollection?.[key]}`)
  }
}

for (const phrase of [
  '--external-beta-tool-route-runtime-proof-packet',
  '--node-runtime-proof-packet',
  '--browser-runtime-proof-packet',
  '--satori-font-runtime-proof-packet',
  '--gpu-runtime-proof-result-packet',
  '--external-beta-native-gpu-proof-collection-packet',
  'sourceExternalBetaNativeGpuProofCollectionAccepted',
  'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks',
  'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks',
  'blocked_pending_native_gpu_runtime_proof',
  'runtimeProofOnlyNoToolExecution',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta Per-Tool Runtime Proof')) {
  fail('scorecard_missing_external_beta_per_tool_runtime_proof')
}

const missingOutput = parseJsonOutput(runNpm(runScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_tool_route_runtime_proof') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}
if (missingOutput.runtimeProofRecordsPrepared !== 21) {
  fail(`missing_records_not_21:${missingOutput.runtimeProofRecordsPrepared}`)
}
if (missingOutput.runtimeProofAcceptedWithProvidedEvidenceTools !== 0) {
  fail('missing_records_accepted_should_be_0')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-per-tool-runtime-proof-'))
try {
  const readinessPacketPath = writeJson(path.join(tmpRoot, 'worker-dispatch-readiness.json'), {
    decision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
    sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
    workerDispatchReadinessPreparedWithProvidedEvidence: true,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
    gpuRuntimeTargetedTools: 8,
    acceptedSourceEvidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
    },
    records: allTools.map((toolId) => ({
      toolId,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
    })),
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    booleans: {
      sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  })
  const smoke = parseJsonOutput(runNpm(sourceSmokeScriptName, [
    '--external-beta-worker-dispatch-readiness-packet',
    readinessPacketPath,
    '--external-beta-worker-dispatch-smoke-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/report.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke/cleanup.json',
  ]), 'source-smoke')
  const smokePath = writeJson(path.join(tmpRoot, 'worker-dispatch-smoke.json'), smoke)
  const proof = parseJsonOutput(runNpm(sourceProofScriptName, [
    '--external-beta-worker-dispatch-smoke-result',
    smokePath,
    '--external-beta-worker-dispatch-smoke-evidence-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/evidence.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/cleanup.json',
  ]), 'source-proof')
  const proofPath = writeJson(path.join(tmpRoot, 'worker-dispatch-smoke-proof.json'), proof)
  const manifest = parseJsonOutput(runNpm(privateManifestScriptName, [
    '--external-beta-worker-dispatch-smoke-proof-packet',
    proofPath,
    '--external-beta-private-artifact-policy-ref',
    'private://ai-graphics/external-beta/artifacts/policy.json',
    '--external-beta-artifact-manifest-schema-ref',
    'private://ai-graphics/external-beta/artifacts/schema.json',
    '--external-beta-storage-namespace-ref',
    'private://ai-graphics/external-beta/private-artifacts',
    '--external-beta-access-boundary-ref',
    'backend-evidence://ai-graphics/external-beta/artifacts/access-boundary.json',
    '--external-beta-encryption-policy-ref',
    'private://ai-graphics/external-beta/artifacts/encryption.json',
    '--external-beta-retention-policy-ref',
    'private://ai-graphics/external-beta/artifacts/retention.json',
    '--external-beta-artifact-telemetry-ref',
    'external-beta-evidence://ai-graphics/artifacts/telemetry.json',
  ]), 'private-manifest')
  const manifestPath = writeJson(path.join(tmpRoot, 'private-artifact-manifest.json'), manifest)
  const routeProof = parseJsonOutput(runNpm(routeProofScriptName, [
    '--external-beta-private-artifact-manifest-packet',
    manifestPath,
    '--external-beta-tool-route-policy-ref',
    'private://ai-graphics/external-beta/tool-route/policy.json',
    '--external-beta-tool-route-schema-ref',
    'private://ai-graphics/external-beta/tool-route/schema.json',
    '--external-beta-tool-route-admission-ref',
    'backend-evidence://ai-graphics/external-beta/tool-route/admission.json',
    '--external-beta-tool-route-authz-ref',
    'backend-evidence://ai-graphics/external-beta/tool-route/authz.json',
    '--external-beta-tool-route-rate-limit-ref',
    'backend-evidence://ai-graphics/external-beta/tool-route/rate-limit.json',
    '--external-beta-tool-route-audit-ref',
    'external-beta-evidence://ai-graphics/tool-route/audit.json',
    '--external-beta-tool-route-rollback-ref',
    'private://ai-graphics/external-beta/tool-route/rollback.json',
  ]), 'route-proof')
  const routeProofPath = writeJson(path.join(tmpRoot, 'tool-route-runtime-proof.json'), routeProof)

  const accepted = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-tool-route-runtime-proof-packet',
    routeProofPath,
    '--node-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
    '--browser-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
    '--satori-font-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
    '--gpu-runtime-proof-result-packet',
    'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
    '--external-beta-per-tool-runtime-proof-policy-ref',
    'private://ai-graphics/external-beta/runtime-proof/policy.json',
    '--external-beta-per-tool-runtime-proof-schema-ref',
    'private://ai-graphics/external-beta/runtime-proof/schema.json',
    '--external-beta-runtime-proof-evidence-ref',
    'backend-evidence://ai-graphics/external-beta/runtime-proof/evidence.json',
    '--external-beta-runtime-proof-telemetry-ref',
    'external-beta-evidence://ai-graphics/runtime-proof/telemetry.json',
    '--external-beta-runtime-proof-rollback-ref',
    'private://ai-graphics/external-beta/runtime-proof/rollback.json',
  ]), 'accepted')

  if (accepted.decision !== 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.runtimeProofAcceptedWithProvidedEvidenceTools !== 13) {
    fail(`accepted_runtime_proof_tools_not_13:${accepted.runtimeProofAcceptedWithProvidedEvidenceTools}`)
  }
  if (accepted.jsRuntimeProofAcceptedWithProvidedEvidenceTools !== 13) {
    fail(`accepted_js_tools_not_13:${accepted.jsRuntimeProofAcceptedWithProvidedEvidenceTools}`)
  }
  if (accepted.nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools !== 0) {
    fail('accepted_gpu_tools_should_be_0')
  }
  if (accepted.blockedPendingNativeGpuRuntimeProofTools !== 8) {
    fail(`accepted_gpu_blocked_not_8:${accepted.blockedPendingNativeGpuRuntimeProofTools}`)
  }
  if ((accepted.records ?? []).filter((record) => record.runtimeProofAcceptedWithProvidedEvidence).length !== 13) {
    fail('accepted_record_count_not_13')
  }
  for (const tool of jsTools) {
    const record = accepted.records?.find((entry) => entry.toolId === tool)
    if (!record) fail(`accepted_missing_js_record:${tool}`)
    if (record?.runtimeProofStatus !== 'runtime_proof_accepted_with_provided_evidence') {
      fail(`accepted_js_status:${tool}:${record?.runtimeProofStatus}`)
    }
  }
  for (const tool of gpuTools) {
    const record = accepted.records?.find((entry) => entry.toolId === tool)
    if (!record) fail(`accepted_missing_gpu_record:${tool}`)
    if (record?.runtimeProofStatus !== 'blocked_pending_native_gpu_runtime_proof') {
      fail(`accepted_gpu_status:${tool}:${record?.runtimeProofStatus}`)
    }
    if (!/NVIDIA L4 GPU runtime proof/.test(record?.blockedReason ?? '')) {
      fail(`accepted_gpu_missing_block_reason:${tool}`)
    }
  }
  for (const record of accepted.records ?? []) {
    if (record.routeExecutionApprovedNow !== false) fail(`record_route_execution_not_false:${record.toolId}`)
    if (record.workerDispatchApprovedNow !== false) fail(`record_worker_dispatch_not_false:${record.toolId}`)
    if (record.toolExecutionApprovedNow !== false) fail(`record_tool_execution_not_false:${record.toolId}`)
    if (record.gpuRuntimeShouldStartNow !== false) fail(`record_gpu_start_not_false:${record.toolId}`)
    if (record.publicArtifactAllowed !== false) fail(`record_public_allowed:${record.toolId}`)
    if (record.signedUrlAllowed !== false) fail(`record_signed_allowed:${record.toolId}`)
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }

  const acceptedPerToolPath = writeJson(path.join(tmpRoot, 'accepted-per-tool-runtime-proof.json'), accepted)
  const checksumPath = writeJson(path.join(tmpRoot, 'accepted-checksum-evidence.json'), acceptedChecksumEvidenceFixture())
  const manifestReviewPath = writeJson(
    path.join(tmpRoot, 'accepted-model-manifest-review.json'),
    acceptedModelWeightManifestReviewPacket(),
  )
  const gpuResultPath = writeJson(
    path.join(tmpRoot, 'accepted-gpu-runtime-result.json'),
    acceptedGpuRuntimeProofResultPacket(),
  )
  const collection = parseJsonOutput(runNpm(nativeGpuProofCollectionScriptName, [
    '--external-beta-per-tool-runtime-proof-packet',
    acceptedPerToolPath,
    '--gpu-runtime-proof-command-plan-packet',
    'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
    '--model-weight-checksum-evidence-packet',
    checksumPath,
    '--model-weight-manifest-review-packet',
    manifestReviewPath,
    '--gpu-runtime-proof-result-packet',
    gpuResultPath,
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
  ]), 'native-gpu-collection')
  if (collection.decision !== 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready') {
    fail(`native_gpu_collection_decision:${collection.decision}`)
  }
  if (collection.counts?.nativeGpuRuntimeProofAcceptedTools !== 8) {
    fail(`native_gpu_collection_accepted_tools_not_8:${collection.counts?.nativeGpuRuntimeProofAcceptedTools}`)
  }
  if (collection.counts?.blockedPendingNativeGpuRuntimeProofTools !== 0) {
    fail(`native_gpu_collection_blocked_tools_not_0:${collection.counts?.blockedPendingNativeGpuRuntimeProofTools}`)
  }
  if (collection.booleans?.readyForPerToolRuntimeProofRecheck !== true) {
    fail('native_gpu_collection_not_ready_for_recheck')
  }
  for (const key of falseGateKeys) {
    if (Object.hasOwn(collection.booleans ?? {}, key) && collection.booleans?.[key] !== false) {
      fail(`native_gpu_collection_false_gate_not_false:${key}`)
    }
  }
  const collectionPath = writeJson(path.join(tmpRoot, 'native-gpu-proof-collection.json'), collection)
  const acceptedAfterNativeGpuCollection = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-tool-route-runtime-proof-packet',
    routeProofPath,
    '--node-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
    '--browser-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
    '--satori-font-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
    '--gpu-runtime-proof-result-packet',
    'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
    '--external-beta-native-gpu-proof-collection-packet',
    collectionPath,
    '--external-beta-per-tool-runtime-proof-policy-ref',
    'private://ai-graphics/external-beta/runtime-proof/policy.json',
    '--external-beta-per-tool-runtime-proof-schema-ref',
    'private://ai-graphics/external-beta/runtime-proof/schema.json',
    '--external-beta-runtime-proof-evidence-ref',
    'backend-evidence://ai-graphics/external-beta/runtime-proof/evidence.json',
    '--external-beta-runtime-proof-telemetry-ref',
    'external-beta-evidence://ai-graphics/runtime-proof/telemetry.json',
    '--external-beta-runtime-proof-rollback-ref',
    'private://ai-graphics/external-beta/runtime-proof/rollback.json',
  ]), 'accepted-after-native-gpu-collection')
  if (acceptedAfterNativeGpuCollection.decision !== 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks') {
    fail(`accepted_after_native_gpu_collection_decision:${acceptedAfterNativeGpuCollection.decision}`)
  }
  if (acceptedAfterNativeGpuCollection.runtimeProofAcceptedWithProvidedEvidenceTools !== 21) {
    fail(`accepted_after_native_gpu_collection_tools_not_21:${acceptedAfterNativeGpuCollection.runtimeProofAcceptedWithProvidedEvidenceTools}`)
  }
  if (acceptedAfterNativeGpuCollection.nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools !== 8) {
    fail(`accepted_after_native_gpu_collection_gpu_tools_not_8:${acceptedAfterNativeGpuCollection.nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools}`)
  }
  if (acceptedAfterNativeGpuCollection.blockedPendingNativeGpuRuntimeProofTools !== 0) {
    fail(`accepted_after_native_gpu_collection_blocked_not_0:${acceptedAfterNativeGpuCollection.blockedPendingNativeGpuRuntimeProofTools}`)
  }
  if (acceptedAfterNativeGpuCollection.booleans?.sourceExternalBetaNativeGpuProofCollectionAccepted !== true) {
    fail('accepted_after_native_gpu_collection_source_collection_not_accepted')
  }
  for (const tool of gpuTools) {
    const record = acceptedAfterNativeGpuCollection.records?.find((entry) => entry.toolId === tool)
    if (!record) fail(`accepted_after_native_gpu_collection_missing_gpu_record:${tool}`)
    if (record?.runtimeProofStatus !== 'runtime_proof_accepted_with_provided_evidence') {
      fail(`accepted_after_native_gpu_collection_gpu_status:${tool}:${record?.runtimeProofStatus}`)
    }
    if (record?.gpuRuntimeShouldStartNow !== false) fail(`accepted_after_native_gpu_collection_gpu_start_not_false:${tool}`)
  }
  for (const key of falseGateKeys) {
    if (acceptedAfterNativeGpuCollection.booleans?.[key] !== false) {
      fail(`accepted_after_native_gpu_collection_false_gate_not_false:${key}`)
    }
  }

  const publicBlocked = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-tool-route-runtime-proof-packet',
    routeProofPath,
    '--node-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
    '--browser-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
    '--satori-font-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
    '--gpu-runtime-proof-result-packet',
    'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
    '--external-beta-per-tool-runtime-proof-policy-ref',
    'public://unsafe/policy.json',
    '--external-beta-per-tool-runtime-proof-schema-ref',
    'private://ai-graphics/external-beta/runtime-proof/schema.json',
    '--external-beta-runtime-proof-evidence-ref',
    'signed-url://unsafe/evidence.json',
    '--external-beta-runtime-proof-telemetry-ref',
    'https://example.invalid/telemetry.json',
    '--external-beta-runtime-proof-rollback-ref',
    'gs://unsafe/rollback.json',
  ]), 'public-blocked')
  if (publicBlocked.decision !== 'missing_external_beta_per_tool_runtime_proof_controls') {
    fail(`public_blocked_decision:${publicBlocked.decision}`)
  }
  if (publicBlocked.runtimeProofAcceptedWithProvidedEvidenceTools !== 0) {
    fail('public_blocked_records_accepted_not_0')
  }
  if (!JSON.stringify(publicBlocked.missingPerToolRuntimeProofControls ?? []).includes('not private')) {
    fail('public_blocked_missing_not_private_reason')
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const forbiddenDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /workerDispatchApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /gpuRuntimeApprovedNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
]) {
  if (pattern.test(forbiddenDocs)) fail(`forbidden_docs_claim:${pattern}`)
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
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
const trackedGenerated = changedFiles.filter((file) => (
  /(^|\/)(generated|render|renders|canvas|webgl|public-artifacts)(\/|$)/i.test(file) ||
  /\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)$/i.test(file)
))
if (trackedGenerated.length) fail(`generated_output_tracked:${trackedGenerated.join(',')}`)

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  acceptedDecision: 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks',
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  jsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
  blockedPendingNativeGpuRuntimeProofTools: 8,
  readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
  readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
  readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
