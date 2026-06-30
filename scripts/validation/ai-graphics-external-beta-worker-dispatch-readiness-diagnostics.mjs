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
const runScriptName = 'ai-graphics:external-beta-worker-dispatch-readiness'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-worker-dispatch-readiness:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-worker-dispatch-readiness-diagnostics.mjs'

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

const sourceGatewayRuntimeAdmissionModesByTool = Object.fromEntries(
  allTools.map((toolId) => [
    toolId,
    toolId === 'd3' ? 'cpu_static_first_cohort' : 'all_tools_external_beta',
  ]),
)

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
  'serviceRoleQueueSmokeApprovedNow',
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
  'server/tool-registry/ai-graphics-external-beta-worker-dispatch-readiness.ts',
  'server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts',
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-proof.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-readiness.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-readiness.md',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-readiness.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-readiness.md')
const source = read('server/tool-registry/ai-graphics-external-beta-worker-dispatch-readiness.ts')
const cli = read('server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-worker-dispatch-readiness'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks') {
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
  sourceLiveQueueWritesAcceptedWithProvidedEvidence: 21,
  sourceWorkerClaimRowsAcceptedWithProvidedEvidence: 21,
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
  serviceRoleQueueSmokeAuthorizationRefRequired: true,
  sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
  sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence: 21,
  sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence: 1,
  sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0,
  sourceToolExecutionsAcceptedWithProvidedEvidence: 0,
  cleanupPersistedRowsAfterSmoke: 0,
  workerDispatchReadinessRecordsPrepared: 21,
  workerDispatchCapabilityScenariosPrepared: 12,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
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
  'externalBetaWorkerDispatchReadinessPrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
if (docs.booleans?.sourceServiceRoleQueueSmokeAuthorizationAccepted !== false) {
  fail('docs_source_service_role_queue_smoke_authorization_should_default_false')
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

for (const phrase of [
  '--external-beta-service-role-queue-smoke-proof-packet',
  '--external-beta-worker-lease-policy-ref',
  '--external-beta-worker-dispatch-policy-ref',
  '--external-beta-worker-idempotency-namespace-ref',
  '--external-beta-worker-telemetry-ref',
  '--external-beta-gpu-on-demand-policy-ref',
  '--external-beta-private-artifact-policy-ref',
  'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
  'sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort',
  'sourceRuntimeQueueServiceProofBridgeAccepted',
  'sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence',
  'serviceRoleQueueSmokeAuthorizationRef',
  'sourceServiceRoleQueueSmokeAuthorizationAccepted',
  'sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence',
  'noLiveWorkerLeaseByReadinessGate',
  'noLiveWorkerDispatchByReadinessGate',
  'noGpuRuntimeStartByReadinessGate',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta Worker Dispatch Readiness')) {
  fail('scorecard_missing_external_beta_worker_dispatch_readiness')
}

const missingOutput = parseJsonOutput(runNpm(runScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_service_role_queue_smoke_proof') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}
if (missingOutput.workerDispatchReadinessRecordsPrepared !== 21) {
  fail(`missing_records_prepared:${missingOutput.workerDispatchReadinessRecordsPrepared}`)
}
if (missingOutput.workerDispatchReadinessRecordsPreparedWithProvidedEvidence !== 0) {
  fail('missing_records_should_not_be_ready_with_evidence')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-worker-dispatch-readiness-'))
try {
  const proofPacketPath = writeJson(path.join(tmpRoot, 'service-role-queue-smoke-proof.json'), {
    decision: 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks',
    proofAcceptedWithProvidedEvidence: true,
    acceptedCpuStaticFirstCohortTools: ['d3'],
    counts: {
      serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: 21,
      sourceLiveQueueWritesAcceptedWithProvidedEvidence: 21,
      sourceWorkerClaimRowsAcceptedWithProvidedEvidence: 21,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence: 21,
      sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence: 1,
      sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0,
      sourceToolExecutionsAcceptedWithProvidedEvidence: 0,
      cleanupPersistedRowsAfterSmoke: 0,
    },
    evidence: {
      sourceGatewayRuntimeAdmissionModesByTool,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: true,
      serviceRoleQueueSmokeAuthorizationRef:
        'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: true,
    },
    booleans: {
      agentCanExecuteToolsNow: false,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  })
  const accepted = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-service-role-queue-smoke-proof-packet',
    proofPacketPath,
    '--external-beta-worker-lease-policy-ref',
    'private://ai-graphics/external-beta/worker-lease-policy.json',
    '--external-beta-worker-dispatch-policy-ref',
    'private://ai-graphics/external-beta/worker-dispatch-policy.json',
    '--external-beta-worker-idempotency-namespace-ref',
    'ai_graphics_external_beta_worker_dispatch',
    '--external-beta-worker-telemetry-ref',
    'private://ai-graphics/external-beta/worker-telemetry.json',
    '--external-beta-gpu-on-demand-policy-ref',
    'private://ai-graphics/external-beta/gpu-on-demand-policy.json',
    '--external-beta-private-artifact-policy-ref',
    'private://ai-graphics/external-beta/private-artifact-policy.json',
  ]), 'accepted')
  if (accepted.decision !== 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.workerDispatchReadinessRecordsPreparedWithProvidedEvidence !== 21) {
    fail(`accepted_records_not_21:${accepted.workerDispatchReadinessRecordsPreparedWithProvidedEvidence}`)
  }
  if (accepted.workerDispatchCapabilityScenariosPreparedWithProvidedEvidence !== 12) {
    fail(`accepted_capabilities_not_12:${accepted.workerDispatchCapabilityScenariosPreparedWithProvidedEvidence}`)
  }
  if (accepted.gpuRuntimeTargetedTools !== 8) {
    fail(`accepted_gpu_tools_not_8:${accepted.gpuRuntimeTargetedTools}`)
  }
  if (accepted.sourceServiceRoleQueueSmokeProofBridgeAccepted !== true) {
    fail('accepted_source_service_role_queue_smoke_proof_bridge_not_true')
  }
  if (accepted.sourceServiceRoleQueueSmokeAuthorizationAccepted !== true) {
    fail('accepted_source_service_role_queue_smoke_authorization_not_true')
  }
  if (
    accepted.acceptedSourceEvidence
      ?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence !== 21
  ) {
    fail('accepted_source_runtime_queue_service_proof_bridge_evidence_not_21')
  }
  if (
    accepted.acceptedSourceEvidence
      ?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence !== 21
  ) {
    fail('accepted_source_service_role_queue_smoke_authorization_evidence_not_21')
  }
  if (!accepted.acceptedSourceEvidence?.serviceRoleQueueSmokeAuthorizationRef) {
    fail('accepted_service_role_queue_smoke_authorization_ref_missing')
  }
  const d3Record = (accepted.records ?? []).find((record) => record.toolId === 'd3')
  if (d3Record?.sourceGatewayRuntimeAdmissionMode !== 'cpu_static_first_cohort') {
    fail('accepted_d3_source_mode_unexpected')
  }
  const sourceModeReady = (accepted.records ?? []).filter(
    (record) => typeof record.sourceGatewayRuntimeAdmissionMode === 'string',
  )
  if (sourceModeReady.length !== 21) {
    fail(`accepted_source_mode_record_count:${sourceModeReady.length}`)
  }
  const sourceProofBridgeReady = (accepted.records ?? []).filter(
    (record) => record.sourceRuntimeQueueServiceProofBridgeAccepted === true,
  )
  if (sourceProofBridgeReady.length !== 21) {
    fail(`accepted_source_proof_bridge_record_count:${sourceProofBridgeReady.length}`)
  }
  const sourceAuthorizationReady = (accepted.records ?? []).filter(
    (record) => record.sourceServiceRoleQueueSmokeAuthorizationAccepted === true,
  )
  if (sourceAuthorizationReady.length !== 21) {
    fail(`accepted_source_authorization_record_count:${sourceAuthorizationReady.length}`)
  }
  if (accepted.booleans?.sourceServiceRoleQueueSmokeAuthorizationAccepted !== true) {
    fail('accepted_boolean_source_service_role_queue_smoke_authorization_not_true')
  }
  if (accepted.liveWorkerLeasesCreatedNow !== 0) fail('accepted_live_leases_not_0')
  if (accepted.liveWorkerDispatchesNow !== 0) fail('accepted_live_dispatches_not_0')
  if (accepted.liveToolExecutionsNow !== 0) fail('accepted_live_tool_exec_not_0')
  const gpuStartAllowed = (accepted.records ?? []).filter(
    (record) => record.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
  )
  if (gpuStartAllowed.length !== 8) fail(`accepted_gpu_start_allowed_not_8:${gpuStartAllowed.length}`)
  if (gpuStartAllowed.some((record) => record.gpuRuntimeShouldStartNow !== false)) {
    fail('accepted_gpu_runtime_should_start_now_not_false')
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }

  const strippedProofBridgePacketPath = writeJson(
    path.join(tmpRoot, 'service-role-queue-smoke-proof-stripped-bridge.json'),
    {
      decision: 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks',
      proofAcceptedWithProvidedEvidence: true,
      acceptedCpuStaticFirstCohortTools: ['d3'],
      counts: {
        serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: 21,
        sourceLiveQueueWritesAcceptedWithProvidedEvidence: 21,
        sourceWorkerClaimRowsAcceptedWithProvidedEvidence: 21,
        sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 0,
        sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
        sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence: 21,
        sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence: 1,
        sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0,
        sourceToolExecutionsAcceptedWithProvidedEvidence: 0,
        cleanupPersistedRowsAfterSmoke: 0,
      },
      evidence: {
        sourceGatewayRuntimeAdmissionModesByTool,
        sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: false,
        serviceRoleQueueSmokeAuthorizationRef:
          'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
        sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: true,
      },
      booleans: {
        agentCanExecuteToolsNow: false,
        sourceRuntimeQueueServiceProofBridgeAccepted: false,
        sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      },
    },
  )
  const strippedProofBridge = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-service-role-queue-smoke-proof-packet',
    strippedProofBridgePacketPath,
    '--external-beta-worker-lease-policy-ref',
    'private://ai-graphics/external-beta/worker-lease-policy.json',
    '--external-beta-worker-dispatch-policy-ref',
    'private://ai-graphics/external-beta/worker-dispatch-policy.json',
    '--external-beta-worker-idempotency-namespace-ref',
    'ai_graphics_external_beta_worker_dispatch',
    '--external-beta-worker-telemetry-ref',
    'private://ai-graphics/external-beta/worker-telemetry.json',
    '--external-beta-gpu-on-demand-policy-ref',
    'private://ai-graphics/external-beta/gpu-on-demand-policy.json',
    '--external-beta-private-artifact-policy-ref',
    'private://ai-graphics/external-beta/private-artifact-policy.json',
  ]), 'stripped_proof_bridge')
  if (strippedProofBridge.decision !== 'external_beta_service_role_queue_smoke_proof_rejected') {
    fail(`stripped_proof_bridge_decision:${strippedProofBridge.decision}`)
  }
  if (strippedProofBridge.sourceServiceRoleQueueSmokeProofBridgeAccepted !== false) {
    fail('stripped_proof_bridge_unexpectedly_accepted')
  }

  const strippedAuthorizationPacketPath = writeJson(
    path.join(tmpRoot, 'service-role-queue-smoke-proof-stripped-authorization.json'),
    {
      decision: 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks',
      proofAcceptedWithProvidedEvidence: true,
      acceptedCpuStaticFirstCohortTools: ['d3'],
      counts: {
        serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: 21,
        sourceLiveQueueWritesAcceptedWithProvidedEvidence: 21,
        sourceWorkerClaimRowsAcceptedWithProvidedEvidence: 21,
        sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
        sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 0,
        sourceGatewayRuntimeAdmissionModesAcceptedWithProvidedEvidence: 21,
        sourceCpuStaticFirstCohortToolsAcceptedWithProvidedEvidence: 1,
        sourceWorkerDispatchesAcceptedWithProvidedEvidence: 0,
        sourceToolExecutionsAcceptedWithProvidedEvidence: 0,
        cleanupPersistedRowsAfterSmoke: 0,
      },
      evidence: {
        sourceGatewayRuntimeAdmissionModesByTool,
        sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: true,
        serviceRoleQueueSmokeAuthorizationRef: null,
        sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: false,
      },
      booleans: {
        agentCanExecuteToolsNow: false,
        sourceRuntimeQueueServiceProofBridgeAccepted: true,
        sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      },
    },
  )
  const strippedAuthorization = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-service-role-queue-smoke-proof-packet',
    strippedAuthorizationPacketPath,
    '--external-beta-worker-lease-policy-ref',
    'private://ai-graphics/external-beta/worker-lease-policy.json',
    '--external-beta-worker-dispatch-policy-ref',
    'private://ai-graphics/external-beta/worker-dispatch-policy.json',
    '--external-beta-worker-idempotency-namespace-ref',
    'ai_graphics_external_beta_worker_dispatch',
    '--external-beta-worker-telemetry-ref',
    'private://ai-graphics/external-beta/worker-telemetry.json',
    '--external-beta-gpu-on-demand-policy-ref',
    'private://ai-graphics/external-beta/gpu-on-demand-policy.json',
    '--external-beta-private-artifact-policy-ref',
    'private://ai-graphics/external-beta/private-artifact-policy.json',
  ]), 'stripped_authorization')
  if (strippedAuthorization.decision !== 'external_beta_service_role_queue_smoke_proof_rejected') {
    fail(`stripped_authorization_decision:${strippedAuthorization.decision}`)
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
  '+    "ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge": "tsx server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts",',
  '+    "ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-authorization-bridge": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-authorization-bridge.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-authorization-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-authorization-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-preflight-run-gate": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-preflight-run-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-runbook-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-runbook-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-result-capture-contract": "tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-result-capture-contract.ts",',
  '+    "ai-graphics:external-beta-route-bound-service-role-queue-smoke-result-capture-contract:diagnostics": "node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-result-capture-contract-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-worker-dispatch-smoke": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-private-artifact-manifest": "tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts",',
  '+    "ai-graphics:external-beta-private-artifact-manifest:diagnostics": "node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs",',
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
  acceptedDecision: 'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks',
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  gpuToolsCovered: gpuTools.length,
  workerDispatchReadinessRecordsPreparedWithProvidedEvidence: 21,
  workerDispatchCapabilityScenariosPreparedWithProvidedEvidence: 12,
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
