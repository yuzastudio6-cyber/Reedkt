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
const proofScriptName = 'ai-graphics:external-beta-worker-dispatch-smoke-proof'
const proofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts'
const proofDiagnosticScriptName =
  'ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics'
const proofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs'
const privateArtifactManifestScriptName =
  'ai-graphics:external-beta-private-artifact-manifest'
const privateArtifactManifestScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts'
const privateArtifactManifestDiagnosticScriptName =
  'ai-graphics:external-beta-private-artifact-manifest:diagnostics'
const privateArtifactManifestDiagnosticScriptCommand =
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
  'server/tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts',
  'server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts',
  'server/tool-registry/ai-graphics-external-beta-worker-dispatch-smoke.ts',
  'server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-readiness.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[proofScriptName] !== proofScriptCommand) fail(`missing_package_script:${proofScriptName}`)
if (pkg.scripts?.[proofDiagnosticScriptName] !== proofDiagnosticScriptCommand) {
  fail(`missing_package_script:${proofDiagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-worker-dispatch-smoke-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks') {
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
for (const [key, expected] of Object.entries({
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
  serviceRoleQueueSmokeAuthorizationRefRequired: true,
  sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
  smokeJobsPrepared: 21,
  smokeJobsCompletedWithProvidedEvidence: 21,
  smokeCapabilityScenariosPrepared: 12,
  smokeCapabilityScenariosCompletedWithProvidedEvidence: 12,
  gpuRuntimeTargetedTools: 8,
  inMemoryLeaseRecordsCreated: 21,
  inMemoryLeaseRecordsReleased: 21,
  recordsCovered: 21,
  gpuWorkerRecords: 8,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.acceptanceCriteria?.[key] !== expected) {
    fail(`unexpected_docs_acceptance:${key}:${docs.acceptanceCriteria?.[key]}`)
  }
}
for (const key of [
  'externalBetaWorkerDispatchSmokeProofPrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'allToolRunResultsEmpty',
  'allArtifactRecordsEmpty',
  'allQualityGateResultsEmpty',
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
  '--external-beta-worker-dispatch-smoke-result',
  '--external-beta-worker-dispatch-smoke-evidence-ref',
  '--external-beta-worker-dispatch-smoke-telemetry-ref',
  '--external-beta-worker-dispatch-smoke-lease-audit-ref',
  '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
  'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks',
  'external_beta_worker_dispatch_smoke_completed_without_tool_execution',
  'validatesSavedWorkerDispatchSmokeResultOnly',
  'noLiveWorkerLeaseByProofValidator',
  'noLiveProductionWorkerDispatchByProofValidator',
  'noToolExecutionByProofValidator',
  'noGpuRuntimeStartByProofValidator',
  'sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence',
  'serviceRoleQueueSmokeAuthorizationRef',
  'sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta Worker Dispatch Smoke Proof')) {
  fail('scorecard_missing_external_beta_worker_dispatch_smoke_proof')
}

const missingOutput = parseJsonOutput(runNpm(proofScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_worker_dispatch_smoke_result') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-worker-dispatch-smoke-proof-'))
try {
  const readinessPacketPath = writeJson(path.join(tmpRoot, 'worker-dispatch-readiness.json'), {
    decision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
    sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    workerDispatchReadinessPreparedWithProvidedEvidence: true,
    workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
    workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
    gpuRuntimeTargetedTools: 8,
    acceptedSourceEvidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      serviceRoleQueueSmokeAuthorizationRef:
        'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
    },
    records: allTools.map((toolId) => ({
      toolId,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    })),
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    booleans: {
      sourceServiceRoleQueueSmokeProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  })
  const smokeOutput = runNpm(sourceSmokeScriptName, [
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
  ])
  const smokeResult = parseJsonOutput(smokeOutput, 'source-smoke')
  const smokeResultPath = writeJson(path.join(tmpRoot, 'worker-dispatch-smoke-result.json'), smokeResult)
  const accepted = parseJsonOutput(runNpm(proofScriptName, [
    '--external-beta-worker-dispatch-smoke-result',
    smokeResultPath,
    '--external-beta-worker-dispatch-smoke-evidence-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/evidence.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/cleanup.json',
  ]), 'accepted')

  if (accepted.decision !== 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.counts?.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
    fail('accepted_tools_not_21')
  }
  if (accepted.counts?.sourceSmokeJobsCompletedWithProvidedEvidence !== 21) {
    fail('accepted_smoke_jobs_not_21')
  }
  if (accepted.counts?.sourceCapabilityScenariosCompletedWithProvidedEvidence !== 12) {
    fail('accepted_capabilities_not_12')
  }
  if (accepted.counts?.sourceInMemoryLeaseRecordsCreated !== 21) {
    fail('accepted_leases_created_not_21')
  }
  if (accepted.counts?.sourceInMemoryLeaseRecordsReleased !== 21) {
    fail('accepted_leases_released_not_21')
  }
  if (accepted.counts?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence !== 21) {
    fail('accepted_source_runtime_queue_service_proof_bridge_count_not_21')
  }
  if (
    accepted.counts?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence !== 21
  ) {
    fail('accepted_source_service_role_queue_smoke_authorization_count_not_21')
  }
  if (accepted.counts?.sourceLiveWorkerLeasesCreatedNow !== 0) fail('accepted_live_leases_not_0')
  if (accepted.counts?.sourceLiveWorkerDispatchesNow !== 0) fail('accepted_live_dispatches_not_0')
  if (accepted.counts?.sourceLiveToolExecutionsNow !== 0) fail('accepted_live_tool_exec_not_0')
  if (accepted.evidence?.sourceAllRoutesMockOnly !== true) fail('accepted_routes_not_mock_only')
  if (accepted.evidence?.sourceAllRoutesAiGraphicsToolCallHandoff !== true) fail('accepted_routes_not_handoff')
  if (
    accepted.evidence?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence !== true
  ) {
    fail('accepted_source_runtime_queue_service_proof_bridge_evidence_not_true')
  }
  if (
    accepted.evidence?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence !== true
  ) {
    fail('accepted_source_service_role_queue_smoke_authorization_evidence_not_true')
  }
  if (!accepted.evidence?.serviceRoleQueueSmokeAuthorizationRef) {
    fail('accepted_service_role_queue_smoke_authorization_ref_missing')
  }
  if (accepted.policy?.validatesSavedWorkerDispatchSmokeResultOnly !== true) {
    fail('accepted_not_saved_result_only')
  }
  if (accepted.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
    fail('accepted_source_runtime_queue_service_proof_bridge_boolean_not_true')
  }
  if (accepted.booleans?.sourceServiceRoleQueueSmokeAuthorizationAccepted !== true) {
    fail('accepted_source_service_role_queue_smoke_authorization_boolean_not_true')
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }

  const badResultPath = writeJson(path.join(tmpRoot, 'bad-worker-dispatch-smoke-result.json'), {
    ...smokeResult,
    smokeJobsCompletedWithProvidedEvidence: 20,
    records: smokeResult.records.slice(1),
  })
  const rejected = parseJsonOutput(runNpm(proofScriptName, [
    '--external-beta-worker-dispatch-smoke-result',
    badResultPath,
    '--external-beta-worker-dispatch-smoke-evidence-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/evidence.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/cleanup.json',
  ]), 'rejected')
  if (rejected.decision !== 'external_beta_worker_dispatch_smoke_proof_rejected') {
    fail(`rejected_decision:${rejected.decision}`)
  }
  if (!JSON.stringify(rejected.rejectionReasons ?? []).includes('21 jobs')) {
    fail('rejected_missing_21_job_reason')
  }

  const strippedBridgeResultPath = writeJson(
    path.join(tmpRoot, 'stripped-bridge-worker-dispatch-smoke-result.json'),
    {
      ...smokeResult,
      sourceWorkerDispatchReadinessProofBridgeAccepted: false,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 0,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence:
        smokeResult.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence,
      serviceRoleQueueSmokeAuthorizationRef:
        smokeResult.serviceRoleQueueSmokeAuthorizationRef,
      records: smokeResult.records.map((record) => ({
        ...record,
        sourceRuntimeQueueServiceProofBridgeAccepted: false,
      })),
      booleans: {
        ...smokeResult.booleans,
        sourceRuntimeQueueServiceProofBridgeAccepted: false,
        sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      },
    },
  )
  const strippedBridgeRejected = parseJsonOutput(runNpm(proofScriptName, [
    '--external-beta-worker-dispatch-smoke-result',
    strippedBridgeResultPath,
    '--external-beta-worker-dispatch-smoke-evidence-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/evidence.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/cleanup.json',
  ]), 'stripped-bridge-rejected')
  if (
    strippedBridgeRejected.decision !==
      'external_beta_worker_dispatch_smoke_proof_rejected'
  ) {
    fail(`stripped_bridge_rejected_decision:${strippedBridgeRejected.decision}`)
  }
  if (
    !JSON.stringify(strippedBridgeRejected.rejectionReasons ?? [])
      .includes('proof bridge')
  ) {
    fail('stripped_bridge_rejected_missing_proof_bridge_reason')
  }

  const strippedAuthorizationResultPath = writeJson(
    path.join(tmpRoot, 'stripped-authorization-worker-dispatch-smoke-result.json'),
    {
      ...smokeResult,
      serviceRoleQueueSmokeAuthorizationRef: null,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 0,
      records: smokeResult.records.map((record) => ({
        ...record,
        sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
      })),
      booleans: {
        ...smokeResult.booleans,
        sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
      },
    },
  )
  const strippedAuthorizationRejected = parseJsonOutput(runNpm(proofScriptName, [
    '--external-beta-worker-dispatch-smoke-result',
    strippedAuthorizationResultPath,
    '--external-beta-worker-dispatch-smoke-evidence-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/evidence.json',
    '--external-beta-worker-dispatch-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/telemetry.json',
    '--external-beta-worker-dispatch-smoke-lease-audit-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/lease-audit.json',
    '--external-beta-worker-dispatch-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/worker-dispatch-smoke-proof/cleanup.json',
  ]), 'stripped-authorization-rejected')
  if (
    strippedAuthorizationRejected.decision !==
      'external_beta_worker_dispatch_smoke_proof_rejected'
  ) {
    fail(`stripped_authorization_rejected_decision:${strippedAuthorizationRejected.decision}`)
  }
  if (
    !JSON.stringify(strippedAuthorizationRejected.rejectionReasons ?? [])
      .includes('authorization')
  ) {
    fail('stripped_authorization_rejected_missing_authorization_reason')
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
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
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
  `+    "${proofScriptName}": "${proofScriptCommand}",`,
  `+    "${proofDiagnosticScriptName}": "${proofDiagnosticScriptCommand}",`,
  `+    "${privateArtifactManifestScriptName}": "${privateArtifactManifestScriptCommand}",`,
  `+    "${privateArtifactManifestDiagnosticScriptName}": "${privateArtifactManifestDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-end-to-end-readiness": "tsx server/cli/ai-graphics-external-beta-end-to-end-readiness.ts",',
  '+    "ai-graphics:external-beta-end-to-end-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-end-to-end-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-preflight": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-preflight.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-preflight:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-preflight-diagnostics.mjs",',
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
  acceptedDecision: 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks',
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuToolsCovered: gpuTools.length,
  sourceSmokeJobsAcceptedWithProvidedEvidence: 21,
  sourceCapabilityScenariosAcceptedWithProvidedEvidence: 12,
  sourceInMemoryLeaseRecordsCreated: 21,
  sourceInMemoryLeaseRecordsReleased: 21,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
