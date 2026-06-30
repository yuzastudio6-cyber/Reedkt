import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision =
  'ai_graphics_production_controlled_per_tool_callable_result_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'production_controlled_per_tool_callable_result_proof_ready_no_execution'
const runScriptName =
  'ai-graphics:production-controlled-per-tool-callable-result-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts'
const diagnosticScriptName =
  'ai-graphics:production-controlled-per-tool-callable-result-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs'

const sourceHandoffDecision =
  'ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof_prepared_with_runtime_blocks'
const sourceHandoffStatus =
  'production_controlled_private_artifact_tool_route_handoff_ready_no_execution'

const all21Tools = [
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

const all12Capabilities = [
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-controlled-per-tool-callable-result-proof.ts',
  'server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts',
  'scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-controlled-per-tool-callable-result-proof.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-per-tool-callable-result-proof.md',
  'docs/tool-intelligence/ai-graphics/production-controlled-private-artifact-tool-route-handoff-proof.json',
  'server/tool-registry/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts',
  'docs/production-beta-readiness-scorecard.md',
  'server/tool-registry/index.ts',
  'package.json',
]

const trueAcceptedKeys = [
  'productionControlledPerToolCallableResultProofPrepared',
  'sourcePrivateArtifactToolRouteHandoffProofAccepted',
  'sourceAiGraphicsToolCallHandoffResultAccepted',
  'sourceInMemoryLeaseLifecycleAccepted',
  'sourcePrivateArtifactManifestPrepared',
  'sourceToolRouteHandoffPrepared',
  'perToolCallableResultAcceptedWithProvidedEvidence',
  'savedPerToolCallableResultAcceptedWithProvidedEvidence',
  'callableEnvelopeAcceptedWithProvidedEvidence',
  'privateArtifactManifestAcceptedWithProvidedEvidence',
  'toolRouteHandoffAcceptedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'productionControlledToolCallReadyNow',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'gpuRuntimeIdleAfterCleanup',
  'qaGateAcceptedWithProvidedEvidence',
  'telemetryAcceptedWithProvidedEvidence',
  'agentCanSelectForPlanning',
]

const falseKeysAlways = [
  'runtimeReadyForOnDemandProductionToolCall',
  'agentCanExecuteToolsNow',
  'externalBetaCallableNow',
  'externalBetaTrafficEnabledNow',
  'apiRouteExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'privateArtifactWriteApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeStartedForCallableResult',
  'gpuRuntimeReleasedAfterCallableResult',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'privateArtifactWritePerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreatedByResultProof',
  'workerDispatchPerformedByResultProof',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformedByResultProof',
  'gpuRuntimeShouldStartNowPerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const proofArgs = [
  '--per-tool-callable-result-evidence-ref',
  'private://ai-graphics/production/per-tool-callable-result/evidence',
  '--per-tool-callable-result-qa-ref',
  'backend://ai-graphics/production/per-tool-callable-result/qa',
  '--per-tool-callable-result-cost-ref',
  'production-evidence://ai-graphics/production/per-tool-callable-result/cost',
  '--per-tool-callable-result-rollback-ref',
  'private://ai-graphics/production/per-tool-callable-result/rollback',
  '--per-tool-callable-result-operator-review-ref',
  'backend://ai-graphics/production/per-tool-callable-result/operator-review',
]

const allowedPackageDiffLines = [
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-traffic-enablement-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-traffic-enablement-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-on-demand-status-bridge": "tsx server/cli/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts",',
  '+    "ai-graphics:external-beta-controlled-on-demand-status-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-on-demand-status-bridge-diagnostics.mjs",',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function runNpm(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function privateRefs(toolId) {
  return {
    privateInputManifestRef: `private://ai-graphics/production/private-artifact-handoff/${toolId}/input`,
    privateOutputManifestRef: `backend://ai-graphics/production/private-artifact-handoff/${toolId}/output`,
    privateTelemetryRef: `production-evidence://ai-graphics/production/private-artifact-handoff/${toolId}/telemetry`,
    privateLeaseAuditRef: `private://ai-graphics/production/private-artifact-handoff/${toolId}/lease-audit`,
    privateRouteHandoffRef: `backend://ai-graphics/production/private-artifact-handoff/${toolId}/route-handoff`,
    privateArtifactPolicyRef: `production-evidence://ai-graphics/production/private-artifact-handoff/${toolId}/artifact-policy`,
    privateArtifactRetentionRef: `private://ai-graphics/production/private-artifact-handoff/${toolId}/retention`,
    toolRoutePolicyRef: `backend://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-policy`,
    toolRouteSchemaRef: `production-evidence://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-schema`,
    toolRouteAdmissionRef: `private://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-admission`,
    toolRouteAuthzRef: `backend://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-authz`,
    toolRouteExecutionBlockRef: `production-evidence://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-execution-block`,
    toolRouteAuditRef: `private://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-audit`,
    toolRouteRollbackRef: `backend://ai-graphics/production/private-artifact-handoff/${toolId}/tool-route-rollback`,
    gpuOnDemandPolicyRef: `production-evidence://ai-graphics/production/private-artifact-handoff/${toolId}/gpu-on-demand`,
    modelWeightOrCacheManifestRef: gpuTools.includes(toolId)
      ? `private://ai-graphics/production/private-artifact-handoff/${toolId}/model-cache`
      : null,
  }
}

function sourceHandoffFixture(toolId, capabilityId, options) {
  const refs = privateRefs(toolId)
  const candidate = {
    handoffId:
      'ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof',
    toolId,
    productionToolId: options.productionToolId,
    capabilityId,
    futureRoutePath: '/api/ai-graphics/production/tool-call',
    futureRouteId: `ai-graphics-production-tool-route-${toolId}`,
    futureHandler: options.futureHandler,
    workerType: options.workerType,
    runtimeTarget: options.runtimeTarget,
    sourceRuntimeSmokeJobId: `ai-graphics-production-dispatch-smoke-${toolId}:runtime-smoke-dry-run`,
    sourceExecutionMode: 'dry_run',
    sourceRuntimeSmokeProofAccepted: true,
    sourceAiGraphicsToolCallHandoffResultCreated: true,
    sourceInMemoryLeaseLifecycleAccepted: true,
    sourceToolRunResultsEmpty: true,
    sourceArtifactRecordsEmpty: true,
    sourceQualityGateResultsEmpty: true,
    sourceFallbackDecisionsEmpty: true,
    ...refs,
    privateArtifactManifestPreparedWithProvidedEvidence: true,
    toolRouteHandoffPreparedWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: options.gpu,
    gpuRuntimeShouldStartNow: false,
    privateArtifactWriteApprovedNow: false,
    privateArtifactWritePerformedNow: false,
    routeExecutionApprovedNow: false,
    routeExecutionPerformedNow: false,
    workerDispatchApprovedNow: false,
    workerDispatchPerformedNow: false,
    toolExecutionApprovedNow: false,
    toolExecutionPerformedNow: false,
    providerRuntimePerformedNow: false,
    browserWebglCanvasRuntimePerformedNow: false,
    gpuRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
  return {
    decision: sourceHandoffDecision,
    sourceProductionControlledWorkerRuntimeSmokeProofDecision:
      'ai_graphics_production_controlled_worker_runtime_smoke_proof_dry_run_completed_with_runtime_blocks',
    status: sourceHandoffStatus,
    capabilityId,
    requestedToolId: toolId,
    sourceProductionControlledWorkerRuntimeSmokeProofAccepted: true,
    sourceAiGraphicsToolCallHandoffResultAccepted: true,
    sourceInMemoryLeaseLifecycleAccepted: true,
    sourceToolRunResultsEmpty: true,
    sourceArtifactRecordsEmpty: true,
    sourceQualityGateResultsEmpty: true,
    sourceFallbackDecisionsEmpty: true,
    productionControlledPrivateArtifactToolRouteHandoffControlsAccepted: true,
    privateArtifactManifestPreparedWithProvidedEvidence: true,
    toolRouteHandoffPreparedWithProvidedEvidence: true,
    privateArtifactToolRouteHandoffPreparedWithProvidedEvidence: true,
    missingHandoffControls: [],
    rejectionReasons: [],
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: 21,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    privateArtifactWritesNow: 0,
    routeExecutionsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    handoffCandidate: candidate,
    booleans: {
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function callableResultFromSource(source) {
  const candidate = source.handoffCandidate
  return {
    ok: true,
    decision:
      'ai_graphics_production_controlled_per_tool_callable_result_recorded_with_runtime_blocks',
    status:
      'production_controlled_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked',
    sourcePrivateArtifactToolRouteHandoffProofRef:
      `private://ai-graphics/production/per-tool-callable-result/${candidate.toolId}/source-handoff`,
    sourcePrivateArtifactToolRouteHandoffProofAccepted: true,
    toolId: candidate.toolId,
    productionToolId: candidate.productionToolId,
    capabilityId: candidate.capabilityId,
    routePath: candidate.futureRoutePath,
    routeId: candidate.futureRouteId,
    futureHandler: candidate.futureHandler,
    workerType: candidate.workerType,
    runtimeTarget: candidate.runtimeTarget,
    sourceRuntimeSmokeJobId: candidate.sourceRuntimeSmokeJobId,
    privateInputManifestRef: candidate.privateInputManifestRef,
    privateOutputManifestRef: candidate.privateOutputManifestRef,
    privateTelemetryRef: candidate.privateTelemetryRef,
    privateLeaseAuditRef: candidate.privateLeaseAuditRef,
    privateRouteHandoffRef: candidate.privateRouteHandoffRef,
    modelWeightOrCacheManifestRef: candidate.modelWeightOrCacheManifestRef,
    callableEnvelopeRecordedInPrivateNonProduction: true,
    callableEnvelopeValidated: true,
    sourceHandoffProofAcceptedCount: 1,
    sourceAiGraphicsToolCallHandoffAcceptedCount: 1,
    sourceInMemoryLeaseLifecycleAcceptedCount: 1,
    privateArtifactManifestAcceptedCount: 1,
    toolRouteHandoffAcceptedCount: 1,
    requestAdmittedCount: 1,
    toolExecutionCount: 0,
    routeExecutionCount: 0,
    workerDispatchCount: 0,
    privateArtifactWriteCount: 0,
    providerRuntimeCount: 0,
    browserWebglCanvasRuntimeCount: 0,
    gpuRuntimeStartedForCallableResult: false,
    gpuRuntimeReleasedAfterCallableResult: false,
    gpuRuntimeShouldStartNow: false,
    gpuRuntimeIdleAfterCleanup: true,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    qaGatePassedWithProvidedEvidence: true,
    telemetryCaptured: true,
    costWithinCeiling: true,
    rollbackReady: true,
    secretsRedactedFromOutput: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
}

function assertFalseKeys(record, label) {
  const booleans = record.booleans ?? {}
  const input = record.input ?? {}
  for (const key of falseKeysAlways) {
    if (booleans[key] !== false && input[key] !== false) {
      fail(`${label}_false_key_not_false:${key}`)
    }
  }
}

function assertAccepted(record, label, expected) {
  if (record.decision !== decision) fail(`${label}_decision:${record.decision}`)
  if (record.status !== acceptedStatus) fail(`${label}_status:${record.status}`)
  if (record.sourcePrivateArtifactToolRouteHandoffProofAccepted !== true) {
    fail(`${label}_source_handoff_not_true`)
  }
  if (record.callableResultProofAcceptedWithProvidedEvidence !== true) {
    fail(`${label}_proof_not_accepted`)
  }
  if (record.rejectionReasons?.length !== 0) fail(`${label}_rejections_not_empty`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_caps_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_tools_not_8`)
  if (record.externalBetaCallableNowTools !== 0) fail(`${label}_external_beta_callable_not_0`)
  if (record.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_not_0`)
  if (record.productionReadyNowTools !== 0) fail(`${label}_production_not_0`)
  if (record.toolExecutionAcceptedWithProvidedEvidence !== 0) {
    fail(`${label}_tool_execution_not_0`)
  }
  if (record.routeExecutionAcceptedWithProvidedEvidence !== 0) {
    fail(`${label}_route_execution_not_0`)
  }
  if (record.workerDispatchAcceptedWithProvidedEvidence !== 0) {
    fail(`${label}_worker_dispatch_not_0`)
  }
  if (record.privateArtifactWriteAcceptedWithProvidedEvidence !== 0) {
    fail(`${label}_private_artifact_write_not_0`)
  }
  const result = record.savedPerToolCallableResult
  if (!result) fail(`${label}_result_missing`)
  if (result?.toolId !== expected.toolId) fail(`${label}_tool_mismatch`)
  if (result?.productionToolId !== expected.productionToolId) {
    fail(`${label}_production_tool_mismatch`)
  }
  if (result?.capabilityId !== expected.capabilityId) fail(`${label}_capability_mismatch`)
  if (result?.routePath !== '/api/ai-graphics/production/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (result?.futureHandler !== expected.futureHandler) {
    fail(`${label}_future_handler_mismatch`)
  }
  if (result?.workerType !== expected.workerType) fail(`${label}_worker_type_mismatch`)
  if (result?.runtimeTarget !== expected.runtimeTarget) fail(`${label}_runtime_target_mismatch`)
  if (expected.gpu && !result?.modelWeightOrCacheManifestRef) {
    fail(`${label}_model_cache_missing`)
  }
  if (!expected.gpu && result?.modelWeightOrCacheManifestRef !== null) {
    fail(`${label}_model_cache_should_be_null`)
  }
  if (result?.toolExecutionCount !== 0) fail(`${label}_result_tool_exec_not_0`)
  if (result?.routeExecutionCount !== 0) fail(`${label}_result_route_exec_not_0`)
  if (result?.workerDispatchCount !== 0) fail(`${label}_result_worker_dispatch_not_0`)
  if (result?.privateArtifactWriteCount !== 0) fail(`${label}_result_artifact_write_not_0`)
  if (result?.gpuRuntimeStartedForCallableResult !== false) {
    fail(`${label}_result_gpu_started_not_false`)
  }
  if (result?.gpuRuntimeShouldStartNow !== false) {
    fail(`${label}_result_gpu_should_start_not_false`)
  }
  for (const key of trueAcceptedKeys) {
    if (record.booleans?.[key] !== true) fail(`${label}_true_key_not_true:${key}`)
  }
  assertFalseKeys(record, label)
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}
const packageDiff = git(['diff', '--unified=0', '--', 'package.json'])
for (const line of packageDiff.split('\n').filter((entry) => entry.startsWith('+    "'))) {
  if (!allowedPackageDiffLines.includes(line)) fail(`unexpected_package_json_addition:${line}`)
}
if (git(['diff', '--name-only', '--', 'package-lock.json']).trim().length > 0) {
  fail('package_lock_changed')
}

const indexTs = read('server/tool-registry/index.ts')
if (!indexTs.includes("export * from './ai-graphics-production-controlled-per-tool-callable-result-proof'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-controlled-per-tool-callable-result-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/production-controlled-per-tool-callable-result-proof.md')
const source = read('server/tool-registry/ai-graphics-production-controlled-per-tool-callable-result-proof.ts')
const cli = read('server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.coverage?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.coverage?.totalProductFacingCapabilities !== 12) fail('docs_caps_not_12')
if (docs.coverage?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_not_8')
if (docs.coverage?.externalBetaCallableNowTools !== 0) fail('docs_callable_tools_not_0')
if (docs.callableResultProof?.toolExecutionAcceptedWithProvidedEvidence !== 0) {
  fail('docs_tool_execution_not_0')
}
for (const tool of all21Tools) {
  if (!docs.toolCoverage?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuToolCoverage?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const capability of all12Capabilities) {
  if (!docs.capabilityCoverage?.includes(capability)) {
    fail(`docs_missing_capability:${capability}`)
  }
}
for (const citation of [
  'production-controlled-private-artifact-tool-route-handoff-proof.json',
  'production-controlled-worker-runtime-smoke-proof.json',
  'ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts',
  'production-worker-router.ts',
]) {
  if (!JSON.stringify(docs).includes(citation) || !docsMd.includes(citation)) {
    fail(`missing_citation:${citation}`)
  }
}
for (const key of trueAcceptedKeys) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_key_not_true:${key}`)
}
for (const key of falseKeysAlways) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_key_not_false:${key}`)
}
for (const phrase of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  '"routeExecutionPerformed": true',
  '"workerDispatchPerformed": true',
  '"toolExecutionPerformed": true',
  '"privateArtifactWritePerformed": true',
  '"gpuRuntimePerformedByResultProof": true',
  '"runtimeReadyNow": true',
  '"externalBetaReadyNow": true',
  '"productionReadyNow": true',
]) {
  if (docsMd.includes(phrase) || source.includes(phrase) || cli.includes(phrase)) {
    fail(`forbidden_claim:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics Production Controlled Per-Tool Callable Result Proof')) {
  fail('scorecard_missing_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

const tmpRoot = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-per-tool-callable-result-proof-`)
const sam2Source = sourceHandoffFixture('sam2', 'subject_segmentation', {
  productionToolId: 'sam2',
  workerType: 'gpu_ai_worker',
  runtimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  futureHandler: 'ai_graphics_gpu_model_tool_call_handoff',
  gpu: true,
})
const vegaLiteSource = sourceHandoffFixture('vega_lite', 'chart_overlay', {
  productionToolId: 'vega_lite',
  workerType: 'cpu_analysis_worker',
  runtimeTarget: 'node_cpu_static',
  futureHandler: 'ai_graphics_cpu_static_tool_call_handoff',
  gpu: false,
})
const sam2SourcePath = `${tmpRoot}/sam2-private-handoff-proof.json`
const vegaLiteSourcePath = `${tmpRoot}/vega-lite-private-handoff-proof.json`
const sam2ResultPath = `${tmpRoot}/sam2-callable-result.json`
const vegaLiteResultPath = `${tmpRoot}/vega-lite-callable-result.json`
writeJson(sam2SourcePath, sam2Source)
writeJson(vegaLiteSourcePath, vegaLiteSource)
writeJson(sam2ResultPath, callableResultFromSource(sam2Source))
writeJson(vegaLiteResultPath, callableResultFromSource(vegaLiteSource))

const sam2Accepted = runNpm(runScriptName, [
  '--source-private-artifact-tool-route-handoff-proof-packet',
  sam2SourcePath,
  '--per-tool-callable-result',
  sam2ResultPath,
  ...proofArgs,
])
assertAccepted(sam2Accepted, 'sam2', {
  toolId: 'sam2',
  productionToolId: 'sam2',
  capabilityId: 'subject_segmentation',
  workerType: 'gpu_ai_worker',
  runtimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  futureHandler: 'ai_graphics_gpu_model_tool_call_handoff',
  gpu: true,
})

const vegaLiteAccepted = runNpm(runScriptName, [
  '--source-private-artifact-tool-route-handoff-proof-packet',
  vegaLiteSourcePath,
  '--per-tool-callable-result',
  vegaLiteResultPath,
  ...proofArgs,
])
assertAccepted(vegaLiteAccepted, 'vega_lite', {
  toolId: 'vega_lite',
  productionToolId: 'vega_lite',
  capabilityId: 'chart_overlay',
  workerType: 'cpu_analysis_worker',
  runtimeTarget: 'node_cpu_static',
  futureHandler: 'ai_graphics_cpu_static_tool_call_handoff',
  gpu: false,
})

const noSource = runNpm(runScriptName, [
  '--per-tool-callable-result',
  sam2ResultPath,
  ...proofArgs,
])
if (noSource.status !== 'missing_production_controlled_private_artifact_tool_route_handoff_proof') {
  fail(`no_source_status:${noSource.status}`)
}
assertFalseKeys(noSource, 'no_source')

const publicEvidenceArgs = [...proofArgs]
const publicRefIndex = publicEvidenceArgs.indexOf('--per-tool-callable-result-evidence-ref') + 1
publicEvidenceArgs[publicRefIndex] = 'https://example.com/signed-url/public-artifact'
const publicEvidence = runNpm(runScriptName, [
  '--source-private-artifact-tool-route-handoff-proof-packet',
  sam2SourcePath,
  '--per-tool-callable-result',
  sam2ResultPath,
  ...publicEvidenceArgs,
])
if (publicEvidence.status !== 'production_controlled_per_tool_callable_result_rejected') {
  fail(`public_evidence_status:${publicEvidence.status}`)
}
if (!publicEvidence.rejectionReasons?.some((reason) => reason.includes('private'))) {
  fail('public_evidence_not_rejected')
}
assertFalseKeys(publicEvidence, 'public_evidence')

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/generated|render|browser|canvas|webgl|public-artifact|signed-url/i.test(file)) {
    if (!file.includes('production-controlled-per-tool-callable-result-proof')) {
      fail(`unexpected_generated_output_path:${file}`)
    }
  }
}
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts']).trim()
if (trackedLocalArtifacts.length > 0) fail('tracked_local_artifacts_present')

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  acceptedStatus,
  toolsCovered: 21,
  capabilitiesCovered: 12,
  gpuToolsCovered: 8,
  acceptedPaths: ['sam2', 'vega_lite'],
  sourcePrivateArtifactToolRouteHandoffProofAccepted: true,
  callableEnvelopeAcceptedWithProvidedEvidence: true,
  privateArtifactManifestAcceptedWithProvidedEvidence: true,
  toolRouteHandoffAcceptedWithProvidedEvidence: true,
  toolExecutionAcceptedWithProvidedEvidence: 0,
  routeExecutionAcceptedWithProvidedEvidence: 0,
  workerDispatchAcceptedWithProvidedEvidence: 0,
  privateArtifactWriteAcceptedWithProvidedEvidence: 0,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  packageLockUnchanged: true,
}, null, 2))
