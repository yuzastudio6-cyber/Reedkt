import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision =
  'ai_graphics_production_controlled_worker_runtime_smoke_authorization_prepared_runtime_still_blocked'
const acceptedStatus =
  'production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks'
const runScriptName =
  'ai-graphics:production-controlled-worker-runtime-smoke-authorization'
const runScriptCommand =
  'tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts'
const diagnosticScriptName =
  'ai-graphics:production-controlled-worker-runtime-smoke-authorization:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts',
  'server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts',
  'scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-authorization.md',
  'docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/production-controlled-dispatch-authorization-proof.json',
  'docs/tool-intelligence/ai-graphics/production-service-role-queue-transaction-dry-proof.json',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-router.ts',
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
  'productionControlledWorkerRuntimeSmokeAuthorizationPrepared',
  'sourceProductionControlledWorkerDispatchSmokeProofAccepted',
  'productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted',
  'productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence',
  'nonProductionDryRunWorkerRuntimeSmokeAuthorizationPrepared',
  'sourceWorkerModeGateBlockedDispatch',
  'sourceBlockedBeforeWorkerLease',
  'sourceBlockedBeforeRouteOutput',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'productionControlledToolCallReadyNow',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'futureSmokeMustUsePrivateNonProductionDryRun',
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

const privateRuntimeSmokeArgs = [
  '--production-controlled-worker-runtime-smoke-authorization-ref',
  'private://ai-graphics/production/runtime-smoke-authorization',
  '--production-controlled-worker-runtime-smoke-runbook-ref',
  'backend://ai-graphics/production/runtime-smoke-runbook',
  '--production-controlled-worker-runtime-smoke-environment-ref',
  'production-evidence://ai-graphics/production/runtime-smoke-private-non-production-environment',
  '--production-controlled-worker-runtime-smoke-dry-run-mode-ref',
  'private://ai-graphics/production/runtime-smoke-dry-run-mode',
  '--production-controlled-worker-runtime-smoke-lease-policy-ref',
  'backend://ai-graphics/production/runtime-smoke-lease-policy',
  '--production-controlled-worker-runtime-smoke-dispatch-policy-ref',
  'production-evidence://ai-graphics/production/runtime-smoke-dispatch-policy',
  '--production-controlled-worker-runtime-smoke-gpu-on-demand-ref',
  'private://ai-graphics/production/runtime-smoke-gpu-on-demand',
  '--production-controlled-worker-runtime-smoke-artifact-sandbox-ref',
  'backend://ai-graphics/production/runtime-smoke-private-artifact-sandbox',
  '--production-controlled-worker-runtime-smoke-telemetry-ref',
  'production-evidence://ai-graphics/production/runtime-smoke-telemetry',
  '--production-controlled-worker-runtime-smoke-cost-guardrail-ref',
  'private://ai-graphics/production/runtime-smoke-cost-guardrail',
  '--production-controlled-worker-runtime-smoke-rollback-ref',
  'backend://ai-graphics/production/runtime-smoke-rollback',
  '--production-controlled-worker-runtime-smoke-cleanup-ref',
  'production-evidence://ai-graphics/production/runtime-smoke-cleanup',
  '--production-controlled-worker-runtime-smoke-post-review-ref',
  'private://ai-graphics/production/runtime-smoke-post-review',
  '--production-controlled-worker-runtime-smoke-operator-role',
  'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR',
]

const allowedPackageDiffLines = [
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof": "tsx server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs",',
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

function sourceDispatchSmokeFixture(toolId, capabilityId, gpuRequired) {
  return {
    decision: 'ai_graphics_production_controlled_worker_dispatch_smoke_proof_blocked_before_runtime',
    sourceProductionControlledDispatchAuthorizationProofDecision:
      'ai_graphics_production_controlled_dispatch_authorization_proof_recorded_dispatch_blocked',
    status: 'production_controlled_worker_dispatch_smoke_blocked_by_worker_mode',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceProductionControlledDispatchAuthorizationProofAccepted: true,
    productionControlledWorkerDispatchSmokeControlsAccepted: true,
    productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence: true,
    missingSmokeControls: [],
    rejectionReasons: [],
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: 21,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    productionReadyNowTools: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    controlledWorkerDispatchSmokeRecord: {
      smokeId: 'ai_graphics_production_controlled_worker_dispatch_smoke_proof',
      toolId,
      capabilityId,
      workerType: gpuRequired ? 'gpu_ai_worker' : 'render_worker',
      runtimeTarget: gpuRequired
        ? `native_linux_amd64_nvidia_l4_${toolId}_runtime`
        : 'node_cpu_static',
      jobId: `ai-graphics-production-dispatch-smoke-${toolId}`,
      sourceAuthorizationAccepted: true,
      sourceWorkerModeGateBlocksDispatch: true,
      payloadShapeValid: true,
      dispatcherEvaluated: true,
      dispatcherStatus: 'blocked',
      workerModeGateStatus: 'blocked',
      hardGateBlockCount: 1,
      eventNames: ['job_created', 'gates_started', 'gates_failed', 'job_blocked'],
      blockedBeforeLease: true,
      blockedBeforeRouteOutput: true,
      inMemoryLeaseCreated: false,
      inMemoryLeaseReleased: false,
      toolRunResultsCreated: 0,
      artifactRecordsCreated: 0,
      qualityGateResultsCreated: 0,
      gpuRuntimeShouldStartNow: false,
      workerDispatchSmokeCompletedWithProvidedEvidence: true,
      liveWorkerLeaseCreatedNow: false,
      liveWorkerDispatchPerformedNow: false,
      toolExecutionPerformedNow: false,
    },
    booleans: {
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      runtimeReadyNow: false,
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

function assertAccepted(record, label, expectedToolId, expectedCapabilityId, gpuExpected) {
  if (record.decision !== decision) fail(`${label}_decision:${record.decision}`)
  if (record.status !== acceptedStatus) fail(`${label}_status:${record.status}`)
  if (record.sourceProductionControlledWorkerDispatchSmokeProofAccepted !== true) {
    fail(`${label}_source_smoke_not_true`)
  }
  if (record.productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted !== true) {
    fail(`${label}_controls_not_true`)
  }
  if (record.productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence !== true) {
    fail(`${label}_prepared_not_true`)
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
  const candidate = record.runtimeSmokeAuthorizationCandidate
  if (!candidate) fail(`${label}_candidate_missing`)
  if (candidate?.toolId !== expectedToolId) fail(`${label}_tool_mismatch`)
  if (candidate?.capabilityId !== expectedCapabilityId) fail(`${label}_capability_mismatch`)
  if (candidate?.requiredOperatorRole !== 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR') {
    fail(`${label}_operator_role_mismatch`)
  }
  if (candidate?.requiredFutureWorkerExecutionMode !== 'dry_run') {
    fail(`${label}_future_mode_not_dry_run`)
  }
  if (candidate?.requiredFutureEnvironment !== 'private_non_production_runtime_smoke') {
    fail(`${label}_future_environment_mismatch`)
  }
  if (candidate?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob !== gpuExpected) {
    fail(`${label}_gpu_allowed_mismatch`)
  }
  if (candidate?.gpuRuntimeShouldStartNow !== false) {
    fail(`${label}_gpu_should_start_not_false`)
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
if (!indexTs.includes("export * from './ai-graphics-production-controlled-worker-runtime-smoke-authorization'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-authorization.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-authorization.md')
const source = read('server/tool-registry/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts')
const cli = read('server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.coverage?.runtimeReadyForOnDemandProductionToolCallTools !== 0) {
  fail('docs_runtime_ready_tools_not_0')
}
if (docs.authorization?.requiredOperatorRole !== 'AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR') {
  fail('docs_operator_role_mismatch')
}
if (docs.authorization?.requiredFutureWorkerExecutionMode !== 'dry_run') {
  fail('docs_future_mode_not_dry_run')
}
if (docs.authorization?.requiredFutureEnvironment !== 'private_non_production_runtime_smoke') {
  fail('docs_future_environment_mismatch')
}
if (docs.authorization?.futureDryRunSmokeMayRemoveProductionBlockedOnlyInNonProduction !== true) {
  fail('docs_missing_future_non_production_constraint')
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
  'production-controlled-worker-dispatch-smoke-proof.json',
  'production-controlled-dispatch-authorization-proof.json',
  'production-service-role-queue-transaction-dry-proof.json',
  'production-worker-queue-admission.json',
  'production-tool-call-gateway-handoff.json',
  'production-worker-dispatcher.ts',
  'production-worker-gates.ts',
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
if (!scorecard.includes('AI Graphics Production Controlled Worker Runtime Smoke Authorization')) {
  fail('scorecard_missing_section')
}
if (!scorecard.includes(decision)) fail('scorecard_missing_decision')

const tmpRoot = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-worker-runtime-smoke-auth-`)
const sam2SourcePath = `${tmpRoot}/sam2-production-worker-dispatch-smoke-proof.json`
const vegaLiteSourcePath = `${tmpRoot}/vega-lite-production-worker-dispatch-smoke-proof.json`
writeJson(sam2SourcePath, sourceDispatchSmokeFixture('sam2', 'subject_segmentation', true))
writeJson(vegaLiteSourcePath, sourceDispatchSmokeFixture('vega_lite', 'chart_overlay', false))

const sam2Accepted = runNpm(runScriptName, [
  '--source-production-controlled-worker-dispatch-smoke-proof-packet',
  sam2SourcePath,
  ...privateRuntimeSmokeArgs,
])
assertAccepted(sam2Accepted, 'sam2', 'sam2', 'subject_segmentation', true)

const vegaLiteAccepted = runNpm(runScriptName, [
  '--source-production-controlled-worker-dispatch-smoke-proof-packet',
  vegaLiteSourcePath,
  ...privateRuntimeSmokeArgs,
])
assertAccepted(vegaLiteAccepted, 'vega_lite', 'vega_lite', 'chart_overlay', false)

const noSource = runNpm(runScriptName, privateRuntimeSmokeArgs)
if (noSource.status !== 'missing_production_controlled_worker_dispatch_smoke_proof') {
  fail(`no_source_status:${noSource.status}`)
}
assertFalseKeys(noSource, 'no_source')

const publicEvidenceArgs = [...privateRuntimeSmokeArgs]
const publicRefIndex =
  publicEvidenceArgs.indexOf('--production-controlled-worker-runtime-smoke-authorization-ref') + 1
publicEvidenceArgs[publicRefIndex] = 'https://example.com/signed-url/public-artifact'
const publicEvidence = runNpm(runScriptName, [
  '--source-production-controlled-worker-dispatch-smoke-proof-packet',
  sam2SourcePath,
  ...publicEvidenceArgs,
])
if (publicEvidence.status !== 'awaiting_production_controlled_worker_runtime_smoke_authorization_controls') {
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
    if (!file.includes('production-controlled-worker-runtime-smoke-authorization')) {
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
  sourceDispatchSmokeAccepted: true,
  nonProductionDryRunWorkerRuntimeSmokeAuthorizationPrepared: true,
  futureWorkerExecutionMode: 'dry_run',
  workerLeaseCreated: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  runtimeReadyNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
  packageLockUnchanged: true,
}, null, 2))
