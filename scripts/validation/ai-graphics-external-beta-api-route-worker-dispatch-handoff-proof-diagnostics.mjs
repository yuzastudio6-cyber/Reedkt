import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs'

const tools = [
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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'externalBetaCallableNow',
  'apiRouteQueueSmokeApprovedNow',
  'apiRouteMountedNow',
  'apiRouteExecutionApprovedNow',
  'apiRouteExecutionPerformed',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'liveQueueWriteApprovedNow',
  'liveQueueWritePerformed',
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
  'workerEnqueuePerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueSmokePerformed',
  'serviceRoleTransactionPerformed',
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

function read(file) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function runJson(args) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', runScriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function runtimeForTool(toolId) {
  return gpuTools.includes(toolId)
    ? {
      runtimeTarget: `native_linux_amd64_nvidia_l4_${toolId}_runtime`,
      workerType: 'gpu_ai_worker',
      gpuRequiredForRuntime: true,
    }
    : {
      runtimeTarget: 'node_cpu_static',
      workerType: 'render_worker',
      gpuRequiredForRuntime: false,
    }
}

function routeQueueSmokeProofFixture(toolId, capabilityId, overrides = {}) {
  const runtime = runtimeForTool(toolId)
  const sourceAuthorizationCandidate = {
    toolId,
    capabilityId,
    routePath: '/api/ai-graphics/external-beta/tool-call',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
    idempotencyKey: `external-beta-idempotency-${toolId}`,
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: runtime.gpuRequiredForRuntime,
  }
  return {
    decision: 'ai_graphics_external_beta_api_route_queue_smoke_proof_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks',
    requestedToolId: toolId,
    capabilityId,
    proofAcceptedWithProvidedEvidence: true,
    apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence: 1,
    liveQueueRowsAcceptedWithProvidedEvidence: 1,
    liveQueueRowsPersistedAfterCleanup: 0,
    liveWorkerClaimsAcceptedWithProvidedEvidence: 0,
    liveWorkerDispatchesAcceptedWithProvidedEvidence: 0,
    liveToolExecutionsAcceptedWithProvidedEvidence: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceAuthorizationCandidate,
    savedApiRouteQueueSmokeResult: {
      toolId,
      capabilityId,
    },
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      apiRouteExecutionPerformed: false,
      liveQueueWritePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

function workerDispatchSmokeProofFixture(overrides = {}) {
  return {
    sourceDecision: 'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks',
    decision: 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks',
    proofAcceptedWithProvidedEvidence: true,
    acceptedTools: tools,
    acceptedGpuTools: gpuTools,
    counts: {
      workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
      sourceSmokeJobsCompletedWithProvidedEvidence: 21,
      sourceCapabilityScenariosCompletedWithProvidedEvidence: 12,
      sourceInMemoryLeaseRecordsCreated: 21,
      sourceInMemoryLeaseRecordsReleased: 21,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      sourceLiveWorkerLeasesCreatedNow: 0,
      sourceLiveWorkerDispatchesNow: 0,
      sourceLiveToolExecutionsNow: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    booleans: {
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      allInMemoryLeasesCreatedWithProvidedEvidence: true,
      allInMemoryLeasesReleasedWithProvidedEvidence: true,
      allToolRunResultsEmpty: true,
      allArtifactRecordsEmpty: true,
      allQualityGateResultsEmpty: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

function controlArgs() {
  return [
    '--external-beta-route-worker-dispatch-handoff-policy-ref',
    'external-beta-route-worker-dispatch://policy/handoff',
    '--external-beta-worker-lease-policy-ref',
    'external-beta-route-worker-dispatch://policy/lease',
    '--external-beta-worker-dispatch-policy-ref',
    'external-beta-route-worker-dispatch://policy/dispatch',
    '--external-beta-worker-idempotency-policy-ref',
    'external-beta-route-worker-dispatch://policy/idempotency',
    '--external-beta-gpu-on-demand-policy-ref',
    'external-beta-route-worker-dispatch://policy/gpu-on-demand',
    '--external-beta-private-artifact-policy-ref',
    'external-beta-route-worker-dispatch://policy/private-artifact',
    '--external-beta-telemetry-ref',
    'external-beta-route-worker-dispatch://telemetry/handoff',
    '--external-beta-rollback-plan-ref',
    'external-beta-route-worker-dispatch://rollback/handoff',
  ]
}

function proofArgs(routePath, workerPath, includeControls = true) {
  return [
    ...(routePath ? ['--external-beta-api-route-queue-smoke-proof-packet', routePath] : []),
    ...(workerPath ? ['--external-beta-worker-dispatch-smoke-proof-packet', workerPath] : []),
    ...(includeControls ? controlArgs() : []),
  ]
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseGateKeys) {
    if (booleans?.[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of [
  'server/tool-registry/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-worker-dispatch-smoke-proof.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== decision) fail(`docs_decision_mismatch:${docs.decision}`)
if (docs.status !== acceptedStatus) fail(`docs_status_mismatch:${docs.status}`)

for (const phrase of [
  'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked',
  '--external-beta-api-route-queue-smoke-proof-packet',
  '--external-beta-worker-dispatch-smoke-proof-packet',
  'validatesSavedProofPacketsOnly',
  'noLiveWorkerLeaseByHandoffProof',
  'noLiveWorkerDispatchByHandoffProof',
  'noGpuRuntimeStartByHandoffProof',
  'sourceWorkerDispatchSmokeProofCoversRequestedTool',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}

for (const block of [
  'live worker lease creation',
  'worker dispatch',
  'tool execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.some((entry) => entry.toLowerCase().includes(block.toLowerCase()))) {
    fail(`docs_missing_block:${block}`)
  }
  if (!docsMd.toLowerCase().includes(block.toLowerCase())) {
    fail(`docs_md_missing_block:${block}`)
  }
}
assertFalseBooleans('docs', docs.booleans)
if (!scorecard.includes('AI Graphics External-Beta API Route Worker Dispatch Handoff Proof')) {
  fail('scorecard_missing_section')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-route-worker-handoff-'))
try {
  const d3RoutePath = path.join(tmpRoot, 'd3-route-proof.json')
  const sam2RoutePath = path.join(tmpRoot, 'sam2-route-proof.json')
  const rejectedRoutePath = path.join(tmpRoot, 'rejected-route-proof.json')
  const workerPath = path.join(tmpRoot, 'worker-proof.json')
  const rejectedWorkerPath = path.join(tmpRoot, 'rejected-worker-proof.json')
  const missingToolWorkerPath = path.join(tmpRoot, 'missing-tool-worker-proof.json')

  writeJson(d3RoutePath, routeQueueSmokeProofFixture('d3', 'chart_overlay'))
  writeJson(sam2RoutePath, routeQueueSmokeProofFixture('sam2', 'background_removal'))
  writeJson(rejectedRoutePath, routeQueueSmokeProofFixture('d3', 'chart_overlay', {
    status: 'external_beta_api_route_queue_smoke_result_rejected',
    proofAcceptedWithProvidedEvidence: false,
  }))
  writeJson(workerPath, workerDispatchSmokeProofFixture())
  writeJson(rejectedWorkerPath, workerDispatchSmokeProofFixture({
    decision: 'external_beta_worker_dispatch_smoke_proof_rejected',
    proofAcceptedWithProvidedEvidence: false,
  }))
  writeJson(missingToolWorkerPath, workerDispatchSmokeProofFixture({
    acceptedTools: tools.filter((tool) => tool !== 'sam2'),
  }))

  const missingRoute = runJson([])
  if (missingRoute.status !== 'missing_external_beta_api_route_queue_smoke_proof') {
    fail('missing_route_wrong_status')
  }

  const rejectedRoute = runJson(proofArgs(rejectedRoutePath, workerPath))
  if (rejectedRoute.status !== 'external_beta_api_route_queue_smoke_proof_rejected') {
    fail('rejected_route_wrong_status')
  }

  const missingWorker = runJson(proofArgs(d3RoutePath, null))
  if (missingWorker.status !== 'missing_external_beta_worker_dispatch_smoke_proof') {
    fail('missing_worker_wrong_status')
  }

  const rejectedWorker = runJson(proofArgs(d3RoutePath, rejectedWorkerPath))
  if (rejectedWorker.status !== 'external_beta_worker_dispatch_smoke_proof_rejected') {
    fail('rejected_worker_wrong_status')
  }

  const missingControls = runJson(proofArgs(d3RoutePath, workerPath, false))
  if (missingControls.status !== 'missing_external_beta_route_worker_dispatch_handoff_controls') {
    fail('missing_controls_wrong_status')
  }

  const acceptedD3 = runJson(proofArgs(d3RoutePath, workerPath))
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.requestedToolId !== 'd3') fail('accepted_d3_tool_mismatch')
  if (acceptedD3.apiRouteWorkerDispatchHandoffPreparedRequestsWithProvidedEvidence !== 1) {
    fail('accepted_d3_handoff_count_not_1')
  }
  if (acceptedD3.sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
    fail('accepted_d3_worker_tools_not_21')
  }
  if (acceptedD3.handoffCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_should_be_false')
  }
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = runJson(proofArgs(sam2RoutePath, workerPath))
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.requestedToolId !== 'sam2') fail('accepted_sam2_tool_mismatch')
  if (acceptedSam2.handoffCandidate?.workerType !== 'gpu_ai_worker') {
    fail('accepted_sam2_worker_type_mismatch')
  }
  if (acceptedSam2.handoffCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('accepted_sam2_gpu_start_allowed_not_true')
  }
  if (acceptedSam2.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail('accepted_sam2_gpu_should_start_not_false')
  }
  assertFalseBooleans('accepted_sam2', acceptedSam2.booleans)

  const missingTool = runJson(proofArgs(sam2RoutePath, missingToolWorkerPath))
  if (missingTool.status !== 'external_beta_worker_dispatch_smoke_proof_rejected') {
    fail('missing_tool_wrong_status')
  }
  if (missingTool.booleans?.sourceWorkerDispatchSmokeProofCoversRequestedTool !== false) {
    fail('missing_tool_cover_boolean_not_false')
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const combinedDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /workerLeaseCreationApprovedNow["'`\s:]*true/i,
  /workerDispatchApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedDocs)) fail(`forbidden_docs_claim:${pattern}`)
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
  '+    "ai-graphics:external-beta-api-route-handler-contract": "tsx server/cli/ai-graphics-external-beta-api-route-handler-contract.ts",',
  '+    "ai-graphics:external-beta-api-route-handler-contract:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-handler-contract-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-handler-gateway-binding": "tsx server/cli/ai-graphics-external-beta-api-route-handler-gateway-binding.ts",',
  '+    "ai-graphics:external-beta-api-route-handler-gateway-binding:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-handler-gateway-binding-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-handler-gateway-full-proof": "tsx server/cli/ai-graphics-external-beta-api-route-handler-gateway-full-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-handler-gateway-full-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-handler-gateway-full-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-mount-readiness": "tsx server/cli/ai-graphics-external-beta-api-route-mount-readiness.ts",',
  '+    "ai-graphics:external-beta-api-route-mount-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-mount-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-mount-implementation-review": "tsx server/cli/ai-graphics-external-beta-api-route-mount-implementation-review.ts",',
  '+    "ai-graphics:external-beta-api-route-mount-implementation-review:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-mount-implementation-review-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-mount-implementation-qa": "tsx server/cli/ai-graphics-external-beta-api-route-mount-implementation-qa.ts",',
  '+    "ai-graphics:external-beta-api-route-mount-implementation-qa:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-mount-implementation-qa-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter-contract": "tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter-contract.ts",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter-contract:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-contract-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter": "tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter.ts",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter-smoke": "tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
])
for (const rawLine of packageDiff.split('\n')) {
  const line = rawLine.trimEnd()
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

const lockDiff = git(['diff', '--', 'package-lock.json'])
if (lockDiff.trim().length > 0) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only']).trim().split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (file.includes('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(generated|render|renders|canvas|webgl|public-artifacts)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_changed:${file}`)
  }
  if (/\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)$/i.test(file)) {
    fail(`media_artifact_changed:${file}`)
  }
}

if (failures.length > 0) {
  console.error(`AI graphics external-beta API route worker dispatch handoff proof diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: gpuTools.length,
  apiRouteWorkerDispatchHandoffPreparedRequestsWithProvidedEvidence: 1,
  sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
  sourceRouteQueueSmokeRowsAcceptedWithProvidedEvidence: 1,
  sourceRouteQueueRowsPersistedAfterCleanup: 0,
  sourceWorkerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence: 21,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
