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
const routeScriptName = 'ai-graphics:external-beta-tool-route-runtime-proof'
const routeScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const routeDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const routeDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'
const sourceSmokeScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke'
const sourceProofScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke-proof'
const privateManifestScriptName = 'ai-graphics:external-beta-private-artifact-manifest'

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

function refIsPrivate(value) {
  return [
    'private://',
    'reeditpro-private://',
    'backend-evidence://',
    'external-beta-evidence://',
  ].some((prefix) => String(value).startsWith(prefix))
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-tool-route-runtime-proof.ts',
  'server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts',
  'server/tool-registry/ai-graphics-external-beta-private-artifact-manifest.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-tool-route-runtime-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[routeScriptName] !== routeScriptCommand) fail(`missing_package_script:${routeScriptName}`)
if (pkg.scripts?.[routeDiagnosticScriptName] !== routeDiagnosticScriptCommand) {
  fail(`missing_package_script:${routeDiagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-tool-route-runtime-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_tool_route_runtime_proof_prepared_with_runtime_blocks') {
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
  if (!docs.forbiddenRouteRefPatterns?.includes(forbidden)) fail(`docs_missing_forbidden_ref:${forbidden}`)
}
for (const [key, expected] of Object.entries({
  sourcePrivateArtifactManifestAccepted: true,
  toolRouteRecordsPrepared: 21,
  toolRouteRecordsReadyWithProvidedEvidence: 21,
  gpuRuntimeTargetedTools: 8,
  privateArtifactManifestAccepted: true,
  toolRoutePolicyRequired: true,
  toolRouteSchemaRequired: true,
  toolRouteAdmissionRequired: true,
  toolRouteAuthzRequired: true,
  toolRouteRateLimitRequired: true,
  toolRouteAuditRequired: true,
  toolRouteRollbackRequired: true,
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
  'externalBetaToolRouteRuntimeProofPrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'all21ToolRouteRecordsPrepared',
  'privateInputArtifactsRequired',
  'privateOutputArtifactsRequired',
  'privateTelemetryRequired',
  'privateLeaseAuditRequired',
  'toolRoutePolicyRequired',
  'toolRouteSchemaRequired',
  'toolRouteAdmissionRequired',
  'toolRouteAuthzRequired',
  'toolRouteRateLimitRequired',
  'toolRouteAuditRequired',
  'toolRouteRollbackRequired',
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

for (const phrase of [
  '--external-beta-private-artifact-manifest-packet',
  '--external-beta-tool-route-policy-ref',
  '--external-beta-tool-route-schema-ref',
  '--external-beta-tool-route-admission-ref',
  '--external-beta-tool-route-authz-ref',
  '--external-beta-tool-route-rate-limit-ref',
  '--external-beta-tool-route-audit-ref',
  '--external-beta-tool-route-rollback-ref',
  'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks',
  'runtimeProofOnlyNoRouteExecution',
  'publicArtifactAllowed: false',
  'signedUrlAllowed: false',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta Tool Route Runtime Proof')) {
  fail('scorecard_missing_external_beta_tool_route_runtime_proof')
}

const missingOutput = parseJsonOutput(runNpm(routeScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_private_artifact_manifest') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}
if (missingOutput.toolRouteRecordsPrepared !== 21) fail(`missing_records_not_21:${missingOutput.toolRouteRecordsPrepared}`)
if (missingOutput.toolRouteRecordsReadyWithProvidedEvidence !== 0) fail('missing_records_ready_should_be_0')

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-tool-route-runtime-proof-'))
try {
  const readinessPacketPath = writeJson(path.join(tmpRoot, 'worker-dispatch-readiness.json'), {
    decision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
    workerDispatchReadinessPreparedWithProvidedEvidence: true,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
    gpuRuntimeTargetedTools: 8,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    booleans: {
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
  const accepted = parseJsonOutput(runNpm(routeScriptName, [
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
  ]), 'accepted')

  if (accepted.decision !== 'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.toolRouteRecordsReadyWithProvidedEvidence !== 21) {
    fail(`accepted_ready_records_not_21:${accepted.toolRouteRecordsReadyWithProvidedEvidence}`)
  }
  if (accepted.gpuRuntimeTargetedTools !== 8) fail(`accepted_gpu_tools_not_8:${accepted.gpuRuntimeTargetedTools}`)
  if (accepted.records?.length !== 21) fail(`accepted_records_not_21:${accepted.records?.length}`)
  if ((accepted.records ?? []).filter((record) => record.gpuRuntimeTargeted).length !== 8) {
    fail('accepted_gpu_record_count_not_8')
  }
  for (const record of accepted.records ?? []) {
    if (record.toolRouteRuntimeProofReadyWithProvidedEvidence !== true) fail(`record_not_ready:${record.toolId}`)
    if (record.privateArtifactManifestAccepted !== true) fail(`record_manifest_not_accepted:${record.toolId}`)
    if (record.routeMode !== 'runtime_proof_only') fail(`record_route_mode_unexpected:${record.toolId}`)
    if (record.publicArtifactAllowed !== false) fail(`record_public_allowed:${record.toolId}`)
    if (record.signedUrlAllowed !== false) fail(`record_signed_allowed:${record.toolId}`)
    if (record.routeExecutionApprovedNow !== false) fail(`record_route_execution_not_false:${record.toolId}`)
    if (record.workerDispatchApprovedNow !== false) fail(`record_worker_dispatch_not_false:${record.toolId}`)
    if (record.toolExecutionApprovedNow !== false) fail(`record_tool_execution_not_false:${record.toolId}`)
    if (record.gpuRuntimeShouldStartNow !== false) fail(`record_gpu_start_not_false:${record.toolId}`)
    for (const ref of [
      record.privateInputManifestRef,
      record.privateOutputManifestRef,
      record.privateTelemetryRef,
      record.privateLeaseAuditRef,
      record.modelWeightOrCacheManifestRef,
      record.toolRoutePolicyRef,
      record.toolRouteSchemaRef,
      record.toolRouteAdmissionRef,
      record.toolRouteAuthzRef,
      record.toolRouteRateLimitRef,
      record.toolRouteAuditRef,
      record.toolRouteRollbackRef,
    ].filter(Boolean)) {
      if (!refIsPrivate(ref)) fail(`record_ref_not_private:${record.toolId}:${ref}`)
    }
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }

  const publicBlocked = parseJsonOutput(runNpm(routeScriptName, [
    '--external-beta-private-artifact-manifest-packet',
    manifestPath,
    '--external-beta-tool-route-policy-ref',
    'public://unsafe/policy.json',
    '--external-beta-tool-route-schema-ref',
    'private://ai-graphics/external-beta/tool-route/schema.json',
    '--external-beta-tool-route-admission-ref',
    'signed-url://unsafe/admission.json',
    '--external-beta-tool-route-authz-ref',
    'backend-evidence://ai-graphics/external-beta/tool-route/authz.json',
    '--external-beta-tool-route-rate-limit-ref',
    'gs://unsafe-public-bucket/rate-limit.json',
    '--external-beta-tool-route-audit-ref',
    'https://example.invalid/audit.json',
    '--external-beta-tool-route-rollback-ref',
    'private://ai-graphics/external-beta/tool-route/rollback.json',
  ]), 'public-blocked')
  if (publicBlocked.decision !== 'missing_external_beta_tool_route_runtime_proof_controls') {
    fail(`public_blocked_decision:${publicBlocked.decision}`)
  }
  if (publicBlocked.toolRouteRecordsReadyWithProvidedEvidence !== 0) {
    fail('public_blocked_records_ready_not_0')
  }
  if (!JSON.stringify(publicBlocked.missingToolRouteRuntimeProofControls ?? []).includes('not private')) {
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
  `+    "${routeScriptName}": "${routeScriptCommand}",`,
  `+    "${routeDiagnosticScriptName}": "${routeDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
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
  acceptedDecision: 'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks',
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuToolsCovered: gpuTools.length,
  toolRouteRecordsReadyWithProvidedEvidence: 21,
  routeExecutionApprovedNow: false,
  workerDispatchApprovedNow: false,
  toolExecutionApprovedNow: false,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
