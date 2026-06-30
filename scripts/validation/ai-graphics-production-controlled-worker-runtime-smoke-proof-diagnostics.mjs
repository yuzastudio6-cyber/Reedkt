import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision =
  'ai_graphics_production_controlled_worker_runtime_smoke_proof_dry_run_completed_with_runtime_blocks'
const acceptedStatus =
  'production_controlled_worker_runtime_smoke_dry_run_completed_no_tool_execution'
const runScriptName =
  'ai-graphics:production-controlled-worker-runtime-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:production-controlled-worker-runtime-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts',
  'server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts',
  'scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-authorization.json',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-router.ts',
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
  'productionControlledWorkerRuntimeSmokeProofPrepared',
  'sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted',
  'productionControlledWorkerRuntimeSmokeProofControlsAccepted',
  'productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence',
  'productionWorkerDispatcherDryRunExercised',
  'dryRunWorkerModeAllowed',
  'allWorkerGatesPassed',
  'inMemoryWorkerLeaseCreated',
  'inMemoryWorkerLeaseReleased',
  'aiGraphicsToolCallHandoffRouteOutputCreated',
  'allToolRunResultsEmpty',
  'allArtifactRecordsEmpty',
  'allQualityGateResultsEmpty',
  'allFallbackDecisionsEmpty',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'productionControlledToolCallReadyNow',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'futureSmokeUsedPrivateNonProductionDryRun',
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
  'nonProductionWorkerRuntimeSmokeAuthorizedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'liveQueueWriteApprovedNow',
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

const proofArgs = [
  '--production-controlled-worker-runtime-smoke-proof-ref',
  'private://ai-graphics/production/runtime-smoke-proof',
  '--production-controlled-worker-runtime-smoke-telemetry-ref',
  'backend://ai-graphics/production/runtime-smoke-proof-telemetry',
  '--production-controlled-worker-runtime-smoke-lease-lifecycle-audit-ref',
  'production-evidence://ai-graphics/production/runtime-smoke-proof-lease-lifecycle',
  '--production-controlled-worker-runtime-smoke-route-output-audit-ref',
  'private://ai-graphics/production/runtime-smoke-proof-route-output',
  '--production-controlled-worker-runtime-smoke-private-artifact-write-block-ref',
  'backend://ai-graphics/production/runtime-smoke-proof-artifact-write-block',
  '--production-controlled-worker-runtime-smoke-gpu-lifecycle-audit-ref',
  'production-evidence://ai-graphics/production/runtime-smoke-proof-gpu-lifecycle',
  '--production-controlled-worker-runtime-smoke-cleanup-ref',
  'private://ai-graphics/production/runtime-smoke-proof-cleanup',
  '--production-controlled-worker-runtime-smoke-worker-instance-ref',
  'backend://ai-graphics/production/runtime-smoke-proof-worker-instance',
]

const allowedPackageDiffLines = [
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof": "tsx server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-traffic-enablement-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-traffic-enablement-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-traffic-enablement-proof-diagnostics.mjs",',
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

function sourceAuthorizationFixture(toolId, capabilityId, options) {
  return {
    decision:
      'ai_graphics_production_controlled_worker_runtime_smoke_authorization_prepared_runtime_still_blocked',
    sourceProductionControlledWorkerDispatchSmokeProofDecision:
      'ai_graphics_production_controlled_worker_dispatch_smoke_proof_blocked_before_runtime',
    status: 'production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    sourceProductionControlledWorkerDispatchSmokeProofAccepted: true,
    productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted: true,
    productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: true,
    missingAuthorizationControls: [],
    rejectionReasons: [],
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: 21,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    runtimeSmokeAuthorizationCandidate: {
      authorizationId:
        'ai_graphics_production_controlled_worker_runtime_smoke_authorization',
      toolId,
      capabilityId,
      workerType: options.workerType,
      runtimeTarget: options.runtimeTarget,
      jobId: `ai-graphics-production-dispatch-smoke-${toolId}`,
      requiredOperatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR',
      requiredFutureWorkerExecutionMode: 'dry_run',
      requiredFutureEnvironment: 'private_non_production_runtime_smoke',
      sourceDispatchSmokeAccepted: true,
      sourceWorkerModeGateBlockedDispatch: true,
      sourceBlockedBeforeLease: true,
      sourceBlockedBeforeRouteOutput: true,
      runtimeSmokeAuthorizationPreparedWithProvidedEvidence: true,
      runtimeSmokeAuthorizationRef:
        'private://ai-graphics/production/runtime-smoke-authorization',
      runbookRef: 'backend://ai-graphics/production/runtime-smoke-runbook',
      environmentRef:
        'production-evidence://ai-graphics/production/runtime-smoke-env',
      dryRunModeRef: 'private://ai-graphics/production/runtime-smoke-dry-run',
      leasePolicyRef:
        'backend://ai-graphics/production/runtime-smoke-lease-policy',
      dispatchPolicyRef:
        'production-evidence://ai-graphics/production/runtime-smoke-dispatch-policy',
      gpuOnDemandRef: 'private://ai-graphics/production/runtime-smoke-gpu',
      artifactSandboxRef:
        'backend://ai-graphics/production/runtime-smoke-artifact-sandbox',
      telemetryRef:
        'production-evidence://ai-graphics/production/runtime-smoke-telemetry',
      costGuardrailRef:
        'private://ai-graphics/production/runtime-smoke-cost-guardrail',
      rollbackRef: 'backend://ai-graphics/production/runtime-smoke-rollback',
      cleanupRef:
        'production-evidence://ai-graphics/production/runtime-smoke-cleanup',
      postReviewRef:
        'private://ai-graphics/production/runtime-smoke-post-review',
      gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: options.gpu,
      gpuRuntimeShouldStartNow: false,
      nonProductionWorkerRuntimeSmokeAuthorizedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      publicArtifactCreatedNow: false,
      signedUrlCreatedNow: false,
    },
    booleans: {
      nonProductionWorkerRuntimeSmokeAuthorizedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
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
  if (record.sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted !== true) {
    fail(`${label}_source_authorization_not_true`)
  }
  if (record.productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence !== true) {
    fail(`${label}_proof_not_complete`)
  }
  if (record.rejectionReasons?.length !== 0) fail(`${label}_rejections_not_empty`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_caps_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_not_8`)
  if (record.runtimeReadyForOnDemandProductionToolCallTools !== 0) {
    fail(`${label}_runtime_ready_tools_not_0`)
  }
  if (record.externalBetaReadyNowTools !== 0) fail(`${label}_external_beta_tools_not_0`)
  if (record.productionReadyNowTools !== 0) fail(`${label}_production_tools_not_0`)
  if (record.inMemoryWorkerLeasesCreated !== 1) fail(`${label}_in_memory_leases_created_not_1`)
  if (record.inMemoryWorkerLeasesReleased !== 1) fail(`${label}_in_memory_leases_released_not_1`)
  if (record.liveWorkerLeasesCreatedNow !== 0) fail(`${label}_live_leases_not_0`)
  if (record.liveWorkerDispatchesNow !== 0) fail(`${label}_live_dispatch_not_0`)
  if (record.liveToolExecutionsNow !== 0) fail(`${label}_live_tools_not_0`)
  const proof = record.runtimeSmokeProofRecord
  if (!proof) fail(`${label}_proof_record_missing`)
  if (proof?.toolId !== expected.toolId) fail(`${label}_tool_mismatch`)
  if (proof?.productionToolId !== expected.productionToolId) fail(`${label}_production_tool_mismatch`)
  if (proof?.capabilityId !== expected.capabilityId) fail(`${label}_capability_mismatch`)
  if (proof?.workerType !== expected.workerType) fail(`${label}_worker_type_mismatch`)
  if (proof?.runtimeTarget !== expected.runtimeTarget) fail(`${label}_runtime_target_mismatch`)
  if (proof?.executionMode !== 'dry_run') fail(`${label}_execution_mode_not_dry_run`)
  if (proof?.dispatcherStatus !== 'completed') fail(`${label}_dispatcher_not_completed`)
  if (proof?.gateHardBlockCount !== 0) fail(`${label}_gate_hard_blocks_not_0`)
  if (proof?.allGatesPassed !== true) fail(`${label}_gates_not_passed`)
  if (proof?.inMemoryLeaseCreated !== true) fail(`${label}_lease_not_created`)
  if (proof?.inMemoryLeaseReleased !== true) fail(`${label}_lease_not_released`)
  if (proof?.inMemoryLeaseCount !== 1) fail(`${label}_lease_count_not_1`)
  if (proof?.routeOutputCreated !== true) fail(`${label}_route_output_missing`)
  if (proof?.aiGraphicsToolCallHandoffResultCreated !== true) {
    fail(`${label}_handoff_output_missing`)
  }
  if (proof?.routeOutputFutureHandler !== expected.futureHandler) {
    fail(`${label}_future_handler:${proof?.routeOutputFutureHandler}`)
  }
  if (proof?.toolRunResultsCreated !== 0) fail(`${label}_tool_results_not_0`)
  if (proof?.artifactRecordsCreated !== 0) fail(`${label}_artifacts_not_0`)
  if (proof?.qualityGateResultsCreated !== 0) fail(`${label}_quality_not_0`)
  if (proof?.fallbackDecisionsCreated !== 0) fail(`${label}_fallbacks_not_0`)
  if (proof?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob !== expected.gpu) {
    fail(`${label}_gpu_allowed_mismatch`)
  }
  if (proof?.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_should_start_not_false`)
  for (const event of [
    'job_created',
    'gates_started',
    'gates_passed',
    'job_claimed',
    'heartbeat',
    'job_started',
    'step_started',
    'step_completed',
    'job_completed',
  ]) {
    if (!proof?.eventNames?.includes(event)) fail(`${label}_missing_event:${event}`)
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
if (!indexTs.includes("export * from './ai-graphics-production-controlled-worker-runtime-smoke-proof'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-proof.md')
const source = read('server/tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts')
const cli = read('server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.coverage?.runtimeReadyForOnDemandProductionToolCallTools !== 0) {
  fail('docs_runtime_ready_tools_not_0')
}
if (docs.runtimeSmokeProof?.workerExecutionMode !== 'dry_run') {
  fail('docs_worker_mode_not_dry_run')
}
if (docs.runtimeSmokeProof?.dispatcherStatus !== 'completed') {
  fail('docs_dispatcher_not_completed')
}
if (docs.runtimeSmokeProof?.inMemoryLeaseCreated !== true) {
  fail('docs_in_memory_lease_not_created')
}
if (docs.runtimeSmokeProof?.inMemoryLeaseReleased !== true) {
  fail('docs_in_memory_lease_not_released')
}
if (docs.runtimeSmokeProof?.toolRunResultsCreated !== 0) {
  fail('docs_tool_results_not_0')
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
  'production-controlled-worker-runtime-smoke-authorization.json',
  'production-controlled-worker-dispatch-smoke-proof.json',
  'production-controlled-dispatch-authorization-proof.json',
  'production-service-role-queue-transaction-dry-proof.json',
  'production-worker-dispatcher.ts',
  'production-worker-gates.ts',
  'production-worker-router.ts',
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
  '"workerLeaseCreated": true',
  '"workerDispatchPerformed": true',
  '"toolExecutionPerformed": true',
  '"gpuRuntimePerformed": true',
  '"runtimeReadyNow": true',
  '"externalBetaReadyNow": true',
  '"productionReadyNow": true',
]) {
  if (docsMd.includes(phrase) || source.includes(phrase) || cli.includes(phrase)) {
    fail(`forbidden_claim:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics Production Controlled Worker Runtime Smoke Proof')) {
  fail('scorecard_missing_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

const tmpRoot = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-worker-runtime-smoke-proof-`)
const sam2SourcePath = `${tmpRoot}/sam2-production-runtime-smoke-authorization.json`
const vegaLiteSourcePath = `${tmpRoot}/vega-lite-production-runtime-smoke-authorization.json`
writeJson(sam2SourcePath, sourceAuthorizationFixture('sam2', 'subject_segmentation', {
  workerType: 'gpu_ai_worker',
  runtimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  gpu: true,
}))
writeJson(vegaLiteSourcePath, sourceAuthorizationFixture('vega_lite', 'chart_overlay', {
  workerType: 'cpu_analysis_worker',
  runtimeTarget: 'node_cpu_static',
  gpu: false,
}))

const sam2Accepted = runNpm(runScriptName, [
  '--source-production-controlled-worker-runtime-smoke-authorization-packet',
  sam2SourcePath,
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
  '--source-production-controlled-worker-runtime-smoke-authorization-packet',
  vegaLiteSourcePath,
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

const noSource = runNpm(runScriptName, proofArgs)
if (noSource.status !== 'missing_production_controlled_worker_runtime_smoke_authorization') {
  fail(`no_source_status:${noSource.status}`)
}
assertFalseKeys(noSource, 'no_source')

const publicEvidenceArgs = [...proofArgs]
const publicRefIndex =
  publicEvidenceArgs.indexOf('--production-controlled-worker-runtime-smoke-proof-ref') + 1
publicEvidenceArgs[publicRefIndex] = 'https://example.com/signed-url/public-artifact'
const publicEvidence = runNpm(runScriptName, [
  '--source-production-controlled-worker-runtime-smoke-authorization-packet',
  sam2SourcePath,
  ...publicEvidenceArgs,
])
if (publicEvidence.status !== 'awaiting_production_controlled_worker_runtime_smoke_proof_controls') {
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
    if (!file.includes('production-controlled-worker-runtime-smoke-proof')) {
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
  sourceAuthorizationAccepted: true,
  workerExecutionMode: 'dry_run',
  dispatcherStatus: 'completed',
  inMemoryLeaseCreated: true,
  inMemoryLeaseReleased: true,
  liveWorkerLeasesCreatedNow: 0,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
  packageLockUnchanged: true,
}, null, 2))
