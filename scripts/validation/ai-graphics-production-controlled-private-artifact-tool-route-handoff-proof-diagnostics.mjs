import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision =
  'ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'production_controlled_private_artifact_tool_route_handoff_ready_no_execution'
const runScriptName =
  'ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts'
const diagnosticScriptName =
  'ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts',
  'server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts',
  'scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-controlled-private-artifact-tool-route-handoff-proof.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-private-artifact-tool-route-handoff-proof.md',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-proof.json',
  'server/workers/production/production-worker-router.ts',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-lease-manager.ts',
  'docs/production-beta-readiness-scorecard.md',
  'server/tool-registry/index.ts',
  'package.json',
]

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

const trueAcceptedKeys = [
  'productionControlledPrivateArtifactToolRouteHandoffProofPrepared',
  'sourceProductionControlledWorkerRuntimeSmokeProofAccepted',
  'sourceAiGraphicsToolCallHandoffResultAccepted',
  'sourceInMemoryLeaseLifecycleAccepted',
  'sourceToolRunResultsEmpty',
  'sourceArtifactRecordsEmpty',
  'sourceQualityGateResultsEmpty',
  'sourceFallbackDecisionsEmpty',
  'productionControlledPrivateArtifactToolRouteHandoffControlsAccepted',
  'privateArtifactManifestPreparedWithProvidedEvidence',
  'toolRouteHandoffPreparedWithProvidedEvidence',
  'privateArtifactToolRouteHandoffPreparedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'productionControlledToolCallReadyNow',
  'privateInputArtifactsRequired',
  'privateOutputArtifactsRequired',
  'privateTelemetryRequired',
  'privateLeaseAuditRequired',
  'toolRouteHandoffRequired',
  'publicArtifactRefsRejected',
  'signedUrlRefsRejected',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeysAlways = [
  'runtimeReadyForOnDemandProductionToolCall',
  'agentCanExecuteToolsNow',
  'directAgentToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'privateArtifactWriteApprovedNow',
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
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'privateArtifactWritePerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'gpuRuntimeShouldStartNowPerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const handoffArgs = [
  '--production-controlled-private-input-manifest-ref',
  'private://ai-graphics/production/private-artifact-handoff/input',
  '--production-controlled-private-output-manifest-ref',
  'backend://ai-graphics/production/private-artifact-handoff/output',
  '--production-controlled-private-telemetry-ref',
  'production-evidence://ai-graphics/production/private-artifact-handoff/telemetry',
  '--production-controlled-private-lease-audit-ref',
  'private://ai-graphics/production/private-artifact-handoff/lease-audit',
  '--production-controlled-private-route-handoff-ref',
  'backend://ai-graphics/production/private-artifact-handoff/route-handoff',
  '--production-controlled-private-artifact-policy-ref',
  'production-evidence://ai-graphics/production/private-artifact-handoff/artifact-policy',
  '--production-controlled-private-artifact-retention-ref',
  'private://ai-graphics/production/private-artifact-handoff/retention',
  '--production-controlled-tool-route-policy-ref',
  'backend://ai-graphics/production/private-artifact-handoff/tool-route-policy',
  '--production-controlled-tool-route-schema-ref',
  'production-evidence://ai-graphics/production/private-artifact-handoff/tool-route-schema',
  '--production-controlled-tool-route-admission-ref',
  'private://ai-graphics/production/private-artifact-handoff/tool-route-admission',
  '--production-controlled-tool-route-authz-ref',
  'backend://ai-graphics/production/private-artifact-handoff/tool-route-authz',
  '--production-controlled-tool-route-execution-block-ref',
  'production-evidence://ai-graphics/production/private-artifact-handoff/tool-route-execution-block',
  '--production-controlled-tool-route-audit-ref',
  'private://ai-graphics/production/private-artifact-handoff/tool-route-audit',
  '--production-controlled-tool-route-rollback-ref',
  'backend://ai-graphics/production/private-artifact-handoff/tool-route-rollback',
  '--production-controlled-gpu-on-demand-policy-ref',
  'production-evidence://ai-graphics/production/private-artifact-handoff/gpu-on-demand',
  '--production-controlled-model-weight-or-cache-manifest-ref',
  'private://ai-graphics/production/private-artifact-handoff/model-cache',
]

const allowedPackageDiffLines = [
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof": "tsx server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-traffic-enablement-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-traffic-enablement-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-on-demand-status-bridge": "tsx server/cli/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts",',
  '+    "ai-graphics:external-beta-controlled-on-demand-status-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-on-demand-status-bridge-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-handler-contract": "tsx server/cli/ai-graphics-external-beta-api-route-handler-contract.ts",',
  '+    "ai-graphics:external-beta-api-route-handler-contract:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-handler-contract-diagnostics.mjs",',
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

function sourceRuntimeSmokeProofFixture(toolId, capabilityId, options) {
  return {
    decision:
      'ai_graphics_production_controlled_worker_runtime_smoke_proof_dry_run_completed_with_runtime_blocks',
    sourceProductionControlledWorkerRuntimeSmokeAuthorizationDecision:
      'ai_graphics_production_controlled_worker_runtime_smoke_authorization_prepared_runtime_still_blocked',
    status: 'production_controlled_worker_runtime_smoke_dry_run_completed_no_tool_execution',
    capabilityId,
    requestedToolId: toolId,
    sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted: true,
    productionControlledWorkerRuntimeSmokeProofControlsAccepted: true,
    productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence: true,
    missingProofControls: [],
    rejectionReasons: [],
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: 21,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    inMemoryWorkerLeasesCreated: 1,
    inMemoryWorkerLeasesReleased: 1,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    runtimeSmokeProofRecord: {
      proofId: 'ai_graphics_production_controlled_worker_runtime_smoke_proof',
      toolId,
      productionToolId: options.productionToolId,
      capabilityId,
      workerType: options.workerType,
      runtimeTarget: options.runtimeTarget,
      jobId: `ai-graphics-production-dispatch-smoke-${toolId}:runtime-smoke-dry-run`,
      executionMode: 'dry_run',
      sourceAuthorizationAccepted: true,
      sourceAuthorizationRequiredDryRun: true,
      dispatcherEvaluated: true,
      dispatcherStatus: 'completed',
      gateHardBlockCount: 0,
      allGatesPassed: true,
      eventNames: [
        'job_created',
        'gates_started',
        'gates_passed',
        'job_claimed',
        'heartbeat',
        'job_started',
        'step_started',
        'step_completed',
        'job_completed',
      ],
      inMemoryLeaseCreated: true,
      inMemoryLeaseReleased: true,
      inMemoryLeaseCount: 1,
      liveWorkerLeaseCreatedNow: false,
      liveWorkerDispatchPerformedNow: false,
      routeOutputCreated: true,
      routeOutputFutureHandler: options.futureHandler,
      aiGraphicsToolCallHandoffResultCreated: true,
      toolRunResultsCreated: 0,
      artifactRecordsCreated: 0,
      qualityGateResultsCreated: 0,
      fallbackDecisionsCreated: 0,
      gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: options.gpu,
      gpuRuntimeShouldStartNow: false,
      gpuRuntimePerformedNow: false,
      toolExecutionPerformedNow: false,
      privateArtifactWritePerformedNow: false,
      publicArtifactCreatedNow: false,
      signedUrlCreatedNow: false,
      runtimeSmokeProofCompletedWithProvidedEvidence: true,
    },
    booleans: {
      agentCanExecuteToolsNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
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
  if (record.sourceProductionControlledWorkerRuntimeSmokeProofAccepted !== true) {
    fail(`${label}_source_proof_not_true`)
  }
  if (record.sourceAiGraphicsToolCallHandoffResultAccepted !== true) {
    fail(`${label}_source_handoff_not_true`)
  }
  if (record.sourceInMemoryLeaseLifecycleAccepted !== true) {
    fail(`${label}_source_lease_not_true`)
  }
  if (record.privateArtifactToolRouteHandoffPreparedWithProvidedEvidence !== true) {
    fail(`${label}_handoff_not_prepared`)
  }
  if (record.rejectionReasons?.length !== 0) fail(`${label}_rejections_not_empty`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_caps_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_not_8`)
  if (record.privateArtifactWritesNow !== 0) fail(`${label}_artifact_writes_not_0`)
  if (record.routeExecutionsNow !== 0) fail(`${label}_route_exec_not_0`)
  if (record.liveWorkerDispatchesNow !== 0) fail(`${label}_dispatch_not_0`)
  if (record.liveToolExecutionsNow !== 0) fail(`${label}_tools_exec_not_0`)
  const candidate = record.handoffCandidate
  if (!candidate) fail(`${label}_candidate_missing`)
  if (candidate?.toolId !== expected.toolId) fail(`${label}_tool_mismatch`)
  if (candidate?.productionToolId !== expected.productionToolId) {
    fail(`${label}_production_tool_mismatch`)
  }
  if (candidate?.capabilityId !== expected.capabilityId) fail(`${label}_capability_mismatch`)
  if (candidate?.workerType !== expected.workerType) fail(`${label}_worker_type_mismatch`)
  if (candidate?.runtimeTarget !== expected.runtimeTarget) fail(`${label}_runtime_target_mismatch`)
  if (candidate?.sourceExecutionMode !== 'dry_run') fail(`${label}_source_mode_not_dry_run`)
  if (candidate?.futureRoutePath !== '/api/ai-graphics/production/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (candidate?.futureHandler !== expected.futureHandler) {
    fail(`${label}_future_handler:${candidate?.futureHandler}`)
  }
  if (candidate?.sourceAiGraphicsToolCallHandoffResultCreated !== true) {
    fail(`${label}_candidate_source_handoff_not_true`)
  }
  if (candidate?.sourceInMemoryLeaseLifecycleAccepted !== true) {
    fail(`${label}_candidate_source_lease_not_true`)
  }
  if (candidate?.privateArtifactManifestPreparedWithProvidedEvidence !== true) {
    fail(`${label}_candidate_private_manifest_not_true`)
  }
  if (candidate?.toolRouteHandoffPreparedWithProvidedEvidence !== true) {
    fail(`${label}_candidate_tool_route_not_true`)
  }
  if (candidate?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob !== expected.gpu) {
    fail(`${label}_gpu_allowed_mismatch`)
  }
  if (expected.gpu && !candidate?.modelWeightOrCacheManifestRef) {
    fail(`${label}_model_cache_missing`)
  }
  if (!expected.gpu && candidate?.modelWeightOrCacheManifestRef !== null) {
    fail(`${label}_model_cache_should_be_null`)
  }
  for (const key of [
    'privateInputManifestRef',
    'privateOutputManifestRef',
    'privateTelemetryRef',
    'privateLeaseAuditRef',
    'privateRouteHandoffRef',
    'toolRoutePolicyRef',
    'toolRouteSchemaRef',
    'toolRouteAdmissionRef',
    'toolRouteAuthzRef',
    'toolRouteExecutionBlockRef',
    'toolRouteAuditRef',
    'toolRouteRollbackRef',
    'gpuOnDemandPolicyRef',
  ]) {
    const value = candidate?.[key]
    if (!/^(private|backend|production-evidence):\/\//.test(value ?? '')) {
      fail(`${label}_private_ref_invalid:${key}`)
    }
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
if (!indexTs.includes("export * from './ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-controlled-private-artifact-tool-route-handoff-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/production-controlled-private-artifact-tool-route-handoff-proof.md')
const source = read('server/tool-registry/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts')
const cli = read('server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.coverage?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.coverage?.totalProductFacingCapabilities !== 12) fail('docs_caps_not_12')
if (docs.coverage?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_not_8')
if (docs.coverage?.runtimeReadyForOnDemandProductionToolCallTools !== 0) {
  fail('docs_runtime_ready_tools_not_0')
}
if (docs.handoffProof?.privateArtifactWritesNow !== 0) fail('docs_artifact_writes_not_0')
if (docs.handoffProof?.routeExecutionsNow !== 0) fail('docs_route_exec_not_0')
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
  'production-controlled-worker-runtime-smoke-proof.json',
  'production-controlled-worker-runtime-smoke-authorization.json',
  'production-controlled-worker-dispatch-smoke-proof.json',
  'production-worker-router.ts',
  'production-worker-dispatcher.ts',
  'production-worker-gates.ts',
  'production-worker-lease-manager.ts',
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
  '"gpuRuntimePerformed": true',
  '"runtimeReadyNow": true',
  '"externalBetaReadyNow": true',
  '"productionReadyNow": true',
]) {
  if (docsMd.includes(phrase) || source.includes(phrase) || cli.includes(phrase)) {
    fail(`forbidden_claim:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics Production Controlled Private Artifact Tool Route Handoff Proof')) {
  fail('scorecard_missing_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

const tmpRoot = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-private-artifact-route-proof-`)
const sam2SourcePath = `${tmpRoot}/sam2-production-runtime-smoke-proof.json`
const vegaLiteSourcePath = `${tmpRoot}/vega-lite-production-runtime-smoke-proof.json`
writeJson(sam2SourcePath, sourceRuntimeSmokeProofFixture('sam2', 'subject_segmentation', {
  productionToolId: 'sam2',
  workerType: 'gpu_ai_worker',
  runtimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  futureHandler: 'ai_graphics_gpu_model_tool_call_handoff',
  gpu: true,
}))
writeJson(vegaLiteSourcePath, sourceRuntimeSmokeProofFixture('vega_lite', 'chart_overlay', {
  productionToolId: 'vega_lite',
  workerType: 'cpu_analysis_worker',
  runtimeTarget: 'node_cpu_static',
  futureHandler: 'ai_graphics_cpu_static_tool_call_handoff',
  gpu: false,
}))

const sam2Accepted = runNpm(runScriptName, [
  '--source-production-controlled-worker-runtime-smoke-proof-packet',
  sam2SourcePath,
  ...handoffArgs,
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
  '--source-production-controlled-worker-runtime-smoke-proof-packet',
  vegaLiteSourcePath,
  ...handoffArgs,
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

const noSource = runNpm(runScriptName, handoffArgs)
if (noSource.status !== 'missing_production_controlled_worker_runtime_smoke_proof') {
  fail(`no_source_status:${noSource.status}`)
}
assertFalseKeys(noSource, 'no_source')

const publicEvidenceArgs = [...handoffArgs]
const publicRefIndex =
  publicEvidenceArgs.indexOf('--production-controlled-private-input-manifest-ref') + 1
publicEvidenceArgs[publicRefIndex] = 'https://example.com/signed-url/public-artifact'
const publicEvidence = runNpm(runScriptName, [
  '--source-production-controlled-worker-runtime-smoke-proof-packet',
  sam2SourcePath,
  ...publicEvidenceArgs,
])
if (
  publicEvidence.status !==
  'awaiting_production_controlled_private_artifact_tool_route_handoff_controls'
) {
  fail(`public_evidence_status:${publicEvidence.status}`)
}
if (!publicEvidence.rejectionReasons?.some((reason) => reason.includes('private/backend'))) {
  fail('public_evidence_not_rejected')
}
assertFalseKeys(publicEvidence, 'public_evidence')

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/generated|render|browser|canvas|webgl|public-artifact|signed-url/i.test(file)) {
    if (!file.includes('production-controlled-private-artifact-tool-route-handoff-proof')) {
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
  sourceRuntimeSmokeProofAccepted: true,
  privateArtifactManifestPreparedWithProvidedEvidence: true,
  toolRouteHandoffPreparedWithProvidedEvidence: true,
  privateArtifactWritesNow: 0,
  routeExecutionsNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
  packageLockUnchanged: true,
}, null, 2))
