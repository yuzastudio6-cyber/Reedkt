import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const nativeGpuProofCollectionScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection'
const nativeGpuProofCollectionScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts'
const nativeGpuProofCollectionDiagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
const nativeGpuProofCollectionDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-collection-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const manifestScriptName = 'ai-graphics:external-beta-private-artifact-manifest'
const manifestScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts'
const manifestDiagnosticScriptName =
  'ai-graphics:external-beta-private-artifact-manifest:diagnostics'
const manifestDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs'
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
const sourceSmokeScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke'
const sourceProofScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke-proof'

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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-private-artifact-manifest.ts',
  'server/cli/ai-graphics-external-beta-private-artifact-manifest.ts',
  'server/tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.json',
  'docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.md',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.md')
const source = read('server/tool-registry/ai-graphics-external-beta-private-artifact-manifest.ts')
const cli = read('server/cli/ai-graphics-external-beta-private-artifact-manifest.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[manifestScriptName] !== manifestScriptCommand) fail(`missing_package_script:${manifestScriptName}`)
if (pkg.scripts?.[manifestDiagnosticScriptName] !== manifestDiagnosticScriptCommand) {
  fail(`missing_package_script:${manifestDiagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-private-artifact-manifest'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_private_artifact_manifest_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const namespace of ['private://', 'reeditpro-private://', 'backend-evidence://', 'external-beta-evidence://']) {
  if (!docs.acceptedPrivateRefNamespaces?.includes(namespace)) fail(`docs_missing_private_namespace:${namespace}`)
}
for (const forbidden of ['http://', 'https://', 'signed-url://', 'public://', 'gs://', 'gcs://']) {
  if (!docs.forbiddenArtifactRefPatterns?.includes(forbidden)) fail(`docs_missing_forbidden_ref:${forbidden}`)
}
for (const [key, expected] of Object.entries({
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
  manifestRecordsPrepared: 21,
  manifestRecordsReadyWithProvidedEvidence: 21,
  gpuRuntimeTargetedTools: 8,
  privateInputArtifactsRequired: true,
  privateOutputArtifactsRequired: true,
  privateTelemetryRequired: true,
  privateLeaseAuditRequired: true,
  publicArtifactRefsRejected: true,
  signedUrlRefsRejected: true,
  rawHttpRefsRejected: true,
  rawGcsPublicRefsRejected: true,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.acceptanceCriteria?.[key] !== expected) {
    fail(`unexpected_docs_acceptance:${key}:${docs.acceptanceCriteria?.[key]}`)
  }
}
for (const key of [
  'externalBetaPrivateArtifactManifestPrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'all21PrivateArtifactManifestRecordsPrepared',
  'privateInputArtifactsRequired',
  'privateOutputArtifactsRequired',
  'privateTelemetryRequired',
  'privateLeaseAuditRequired',
  'privateOrBackendArtifactRefsRequired',
  'publicArtifactRefsRejected',
  'signedUrlRefsRejected',
  'rawHttpRefsRejected',
  'rawGcsPublicRefsRejected',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
if (docs.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted !== false) {
  fail('docs_source_runtime_queue_service_proof_bridge_not_false')
}

for (const phrase of [
  '--external-beta-worker-dispatch-smoke-proof-packet',
  '--external-beta-private-artifact-policy-ref',
  '--external-beta-artifact-manifest-schema-ref',
  '--external-beta-storage-namespace-ref',
  '--external-beta-access-boundary-ref',
  '--external-beta-encryption-policy-ref',
  '--external-beta-retention-policy-ref',
  '--external-beta-artifact-telemetry-ref',
  'external_beta_private_artifact_manifest_ready_with_runtime_blocks',
  'publicArtifactAllowed: false',
  'signedUrlAllowed: false',
  'manifestOnlyNoStorageMutation',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta Private Artifact Manifest')) {
  fail('scorecard_missing_external_beta_private_artifact_manifest')
}

const missingOutput = parseJsonOutput(runNpm(manifestScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_worker_dispatch_smoke_proof') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}
if (missingOutput.manifestRecordsPrepared !== 21) fail(`missing_records_not_21:${missingOutput.manifestRecordsPrepared}`)
if (missingOutput.manifestRecordsReadyWithProvidedEvidence !== 0) fail('missing_records_ready_should_be_0')

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-private-artifact-manifest-'))
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
  const accepted = parseJsonOutput(runNpm(manifestScriptName, [
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
  ]), 'accepted')

  if (accepted.decision !== 'external_beta_private_artifact_manifest_ready_with_runtime_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.manifestRecordsReadyWithProvidedEvidence !== 21) {
    fail(`accepted_ready_records_not_21:${accepted.manifestRecordsReadyWithProvidedEvidence}`)
  }
  if (accepted.sourceWorkerDispatchSmokeProofBridgeAccepted !== true) {
    fail('accepted_source_worker_dispatch_smoke_proof_bridge_not_true')
  }
  if (accepted.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence !== 21) {
    fail('accepted_source_runtime_queue_service_proof_bridge_count_not_21')
  }
  if (accepted.gpuRuntimeTargetedTools !== 8) fail(`accepted_gpu_tools_not_8:${accepted.gpuRuntimeTargetedTools}`)
  if (accepted.records?.length !== 21) fail(`accepted_records_not_21:${accepted.records?.length}`)
  if ((accepted.records ?? []).filter((record) => record.gpuRuntimeTargeted).length !== 8) {
    fail('accepted_gpu_record_count_not_8')
  }
  for (const record of accepted.records ?? []) {
    if (record.manifestReadyWithProvidedEvidence !== true) fail(`record_not_ready:${record.toolId}`)
    if (record.privateInputArtifactRequired !== true) fail(`record_input_not_required:${record.toolId}`)
    if (record.privateOutputArtifactRequired !== true) fail(`record_output_not_required:${record.toolId}`)
    if (record.publicArtifactAllowed !== false) fail(`record_public_allowed:${record.toolId}`)
    if (record.signedUrlAllowed !== false) fail(`record_signed_allowed:${record.toolId}`)
    if (record.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
      fail(`record_source_runtime_queue_service_proof_bridge_not_true:${record.toolId}`)
    }
    if (record.toolExecutionApprovedNow !== false) fail(`record_tool_execution_not_false:${record.toolId}`)
    if (record.workerDispatchApprovedNow !== false) fail(`record_worker_dispatch_not_false:${record.toolId}`)
    if (record.gpuRuntimeShouldStartNow !== false) fail(`record_gpu_start_not_false:${record.toolId}`)
    for (const ref of [
      record.inputManifestRef,
      record.outputManifestRef,
      record.telemetryRef,
      record.leaseAuditRef,
      record.modelWeightOrCacheManifestRef,
    ].filter(Boolean)) {
      if (!String(ref).startsWith('private://')) fail(`record_ref_not_private:${record.toolId}:${ref}`)
    }
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }
  if (accepted.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
    fail('accepted_source_runtime_queue_service_proof_bridge_boolean_not_true')
  }

  const strippedBridgeProofPath = writeJson(
    path.join(tmpRoot, 'stripped-bridge-worker-dispatch-smoke-proof.json'),
    {
      ...proof,
      counts: {
        ...proof.counts,
        sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 0,
      },
      evidence: {
        ...proof.evidence,
        sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: false,
      },
      booleans: {
        ...proof.booleans,
        sourceRuntimeQueueServiceProofBridgeAccepted: false,
      },
    },
  )
  const strippedBridge = parseJsonOutput(runNpm(manifestScriptName, [
    '--external-beta-worker-dispatch-smoke-proof-packet',
    strippedBridgeProofPath,
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
  ]), 'stripped-bridge')
  if (strippedBridge.decision !== 'external_beta_worker_dispatch_smoke_proof_rejected') {
    fail(`stripped_bridge_decision:${strippedBridge.decision}`)
  }
  if (strippedBridge.sourceWorkerDispatchSmokeProofBridgeAccepted !== false) {
    fail('stripped_bridge_source_worker_dispatch_smoke_proof_bridge_not_false')
  }

  const publicBlocked = parseJsonOutput(runNpm(manifestScriptName, [
    '--external-beta-worker-dispatch-smoke-proof-packet',
    proofPath,
    '--external-beta-private-artifact-policy-ref',
    'public://unsafe/policy.json',
    '--external-beta-artifact-manifest-schema-ref',
    'private://ai-graphics/external-beta/artifacts/schema.json',
    '--external-beta-storage-namespace-ref',
    'signed-url://unsafe/private-artifacts',
    '--external-beta-access-boundary-ref',
    'backend-evidence://ai-graphics/external-beta/artifacts/access-boundary.json',
    '--external-beta-encryption-policy-ref',
    'private://ai-graphics/external-beta/artifacts/encryption.json',
    '--external-beta-retention-policy-ref',
    'gs://unsafe-public-bucket/retention.json',
    '--external-beta-artifact-telemetry-ref',
    'https://example.invalid/telemetry.json',
  ]), 'public-blocked')
  if (publicBlocked.decision !== 'missing_external_beta_private_artifact_manifest_controls') {
    fail(`public_blocked_decision:${publicBlocked.decision}`)
  }
  if (publicBlocked.manifestRecordsReadyWithProvidedEvidence !== 0) {
    fail('public_blocked_records_ready_not_0')
  }
  if (!JSON.stringify(publicBlocked.missingPrivateArtifactControls ?? []).includes('not private')) {
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
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
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
  `+    "${manifestScriptName}": "${manifestScriptCommand}",`,
  `+    "${manifestDiagnosticScriptName}": "${manifestDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
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
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  acceptedDecision: 'external_beta_private_artifact_manifest_ready_with_runtime_blocks',
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuToolsCovered: gpuTools.length,
  manifestRecordsReadyWithProvidedEvidence: 21,
  publicArtifactRefsRejected: true,
  signedUrlRefsRejected: true,
  rawHttpRefsRejected: true,
  rawGcsPublicRefsRejected: true,
  storageMutationPerformed: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
