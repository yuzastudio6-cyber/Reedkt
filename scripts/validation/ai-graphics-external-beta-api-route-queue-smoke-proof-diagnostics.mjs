import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_queue_smoke_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks'
const runScriptName = 'ai-graphics:external-beta-api-route-queue-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs'

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

const gpuTools = new Set([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

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
    maxBuffer: 20 * 1024 * 1024,
  })
}

function runJson(args) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', runScriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 20 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function runtimeForTool(toolId) {
  return gpuTools.has(toolId)
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

function candidateForTool(toolId, capabilityId) {
  const runtime = runtimeForTool(toolId)
  return {
    authorizationId: 'ai_graphics_external_beta_api_route_queue_smoke_authorization',
    routeId: 'ai_graphics_external_beta_tool_call',
    method: 'POST',
    routePath: '/api/ai-graphics/external-beta/tool-call',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    queueJobStatus: 'prepared_not_submitted',
    toolId,
    capabilityId,
    workspaceId: 'external-beta-workspace-fixture',
    projectId: 'external-beta-project-fixture',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
    traceId: 'external-beta-trace-fixture',
    idempotencyKey: `external-beta-idempotency-key-${toolId}`,
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    sourceApiRouteQueueInsertionProofAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    apiRouteQueueSmokeAuthorizationCandidateWithProvidedEvidence: true,
    apiRouteQueueSmokeAuthorizationRecordedWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: runtime.gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    apiRouteQueueSmokeApprovedNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    apiRouteExecutionPerformed: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchApprovedNow: false,
    workerDispatchPerformed: false,
    toolExecutionApprovedNow: false,
    toolExecutionPerformed: false,
  }
}

function authorizationFixture(toolId, capabilityId, overrides = {}) {
  const candidate = candidateForTool(toolId, capabilityId)
  return {
    decision: 'ai_graphics_external_beta_api_route_queue_smoke_authorization_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    sourceApiRouteQueueInsertionProofReadyRequestsWithProvidedEvidence: 1,
    sourceServiceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence: 21,
    apiRouteQueueSmokeAuthorizationCandidateRequestsWithProvidedEvidence: 1,
    apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence: 1,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests:
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob ? 1 : 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    apiRouteQueueSmokeAuthorizationCandidate: candidate,
    booleans: {
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      gpuHeavyToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      apiRouteQueueSmokeApprovedNow: false,
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

function resultForCandidate(candidate, overrides = {}) {
  return {
    ok: true,
    decision: 'ai_graphics_external_beta_api_route_queue_smoke_passed_with_cleanup',
    status: 'external_beta_api_route_queue_smoke_passed_with_cleanup_no_worker_or_tool_execution',
    sourceApiRouteQueueSmokeAuthorizationRef:
      'external-beta-route-queue-smoke://authorization/fixture',
    sourceApiRouteQueueSmokeAuthorizationAccepted: true,
    routeId: candidate.routeId,
    method: candidate.method,
    routePath: candidate.routePath,
    queueName: candidate.queueName,
    queueJobType: candidate.queueJobType,
    queueJobStatus: 'inserted_then_cleaned_up_private_non_production_smoke',
    toolId: candidate.toolId,
    capabilityId: candidate.capabilityId,
    workspaceId: candidate.workspaceId,
    projectId: candidate.projectId,
    approvedPlanSnapshotId: candidate.approvedPlanSnapshotId,
    creditReservationId: candidate.creditReservationId,
    privateArtifactManifestRef: candidate.privateArtifactManifestRef,
    traceId: candidate.traceId,
    idempotencyKey: candidate.idempotencyKey,
    runtimeTarget: candidate.runtimeTarget,
    workerType: candidate.workerType,
    gpuRequiredForRuntime: candidate.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    apiRouteQueueSmokeExecutedInPrivateNonProduction: true,
    apiRouteInvocationCount: 1,
    liveQueueRowsInserted: 1,
    liveQueueRowsPersistedAfterCleanup: 0,
    liveWorkerClaimsReturned: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    routeExecutionWindowSatisfied: true,
    queueWriteWindowSatisfied: true,
    cleanupCompleted: true,
    rollbackReady: true,
    telemetryCaptured: true,
    costWithinCeiling: true,
    privateNetworkUsed: true,
    secretsRedactedFromOutput: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    ...overrides,
  }
}

function proofArgs(authorizationPath, resultPath) {
  return [
    ...(authorizationPath
      ? ['--external-beta-api-route-queue-smoke-authorization-packet', authorizationPath]
      : []),
    ...(resultPath ? ['--external-beta-api-route-queue-smoke-result', resultPath] : []),
    '--external-beta-api-route-queue-smoke-evidence-ref',
    'external-beta-route-queue-smoke://proof/evidence',
    '--external-beta-api-route-queue-smoke-telemetry-ref',
    'external-beta-route-queue-smoke://proof/telemetry',
    '--external-beta-api-route-queue-smoke-cleanup-proof-ref',
    'external-beta-route-queue-smoke://proof/cleanup',
  ]
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseGateKeys) {
    if (booleans?.[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of [
  'server/tool-registry/ai-graphics-external-beta-api-route-queue-smoke-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-authorization.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-queue-smoke-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-api-route-queue-smoke-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== decision) fail(`docs_decision_mismatch:${docs.decision}`)
if (docs.status !== acceptedStatus) fail(`docs_status_mismatch:${docs.status}`)

for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeTargetedTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const phrase of [
  'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks',
  'external_beta_api_route_queue_smoke_passed_with_cleanup_no_worker_or_tool_execution',
  '--external-beta-api-route-queue-smoke-authorization-packet',
  '--external-beta-api-route-queue-smoke-result',
  'validatesSavedSmokeResultOnly',
  'noLiveApiRouteExecutionByProofValidator',
  'noLiveQueueWriteByProofValidator',
  'noGpuRuntimeStartByProofValidator',
  'inserted_then_cleaned_up_private_non_production_smoke',
  'liveQueueRowsPersistedAfterCleanup',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests',
  'API route queue smoke execution by this validator',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
for (const block of [
  'API route queue smoke execution by this validator',
  'worker dispatch',
  'tool execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.some((entry) => entry.includes(block))) {
    fail(`docs_missing_block:${block}`)
  }
  if (!docsMd.toLowerCase().includes(block.toLowerCase())) {
    fail(`docs_md_missing_block:${block}`)
  }
}
assertFalseBooleans('docs', docs.booleans)
if (!scorecard.includes('AI Graphics External-Beta API Route Queue Smoke Proof')) {
  fail('scorecard_missing_section')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-route-queue-smoke-proof-'))
try {
  const d3Authorization = authorizationFixture('d3', 'chart_overlay')
  const sam2Authorization = authorizationFixture('sam2', 'background_removal')
  const rejectedAuthorization = authorizationFixture('d3', 'chart_overlay', {
    status: 'awaiting_external_beta_api_route_queue_smoke_authorization',
    apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence: 0,
  })
  const d3AuthorizationPath = path.join(tmpRoot, 'd3-authorization.json')
  const sam2AuthorizationPath = path.join(tmpRoot, 'sam2-authorization.json')
  const rejectedAuthorizationPath = path.join(tmpRoot, 'rejected-authorization.json')
  const d3ResultPath = path.join(tmpRoot, 'd3-smoke-result.json')
  const sam2ResultPath = path.join(tmpRoot, 'sam2-smoke-result.json')
  const badResultPath = path.join(tmpRoot, 'bad-smoke-result.json')
  const mismatchedResultPath = path.join(tmpRoot, 'mismatched-smoke-result.json')
  writeJson(d3AuthorizationPath, d3Authorization)
  writeJson(sam2AuthorizationPath, sam2Authorization)
  writeJson(rejectedAuthorizationPath, rejectedAuthorization)
  writeJson(d3ResultPath, resultForCandidate(d3Authorization.apiRouteQueueSmokeAuthorizationCandidate))
  writeJson(sam2ResultPath, resultForCandidate(sam2Authorization.apiRouteQueueSmokeAuthorizationCandidate))
  writeJson(badResultPath, resultForCandidate(d3Authorization.apiRouteQueueSmokeAuthorizationCandidate, {
    publicArtifactCreated: true,
  }))
  writeJson(mismatchedResultPath, resultForCandidate(d3Authorization.apiRouteQueueSmokeAuthorizationCandidate, {
    toolId: 'sam2',
  }))

  const missingAuthorization = runJson([])
  if (missingAuthorization.status !== 'missing_external_beta_api_route_queue_smoke_authorization') {
    fail('missing_authorization_wrong_status')
  }

  const rejectedAuthorizationOutput = runJson(proofArgs(rejectedAuthorizationPath, d3ResultPath))
  if (rejectedAuthorizationOutput.status !== 'external_beta_api_route_queue_smoke_authorization_rejected') {
    fail('rejected_authorization_wrong_status')
  }

  const missingResult = runJson(proofArgs(d3AuthorizationPath, null))
  if (missingResult.status !== 'missing_external_beta_api_route_queue_smoke_result') {
    fail('missing_result_wrong_status')
  }

  const acceptedD3 = runJson(proofArgs(d3AuthorizationPath, d3ResultPath))
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.requestedToolId !== 'd3') fail('accepted_d3_tool_mismatch')
  if (acceptedD3.apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence !== 1) {
    fail('accepted_d3_proof_count_not_1')
  }
  if (acceptedD3.liveQueueRowsAcceptedWithProvidedEvidence !== 1) {
    fail('accepted_d3_queue_rows_not_1')
  }
  if (acceptedD3.liveQueueRowsPersistedAfterCleanup !== 0) {
    fail('accepted_d3_cleanup_not_0')
  }
  if (acceptedD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests !== 0) {
    fail('accepted_d3_gpu_start_allowed_should_be_0')
  }
  if (acceptedD3.booleans?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_boolean_should_be_false')
  }
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = runJson(proofArgs(sam2AuthorizationPath, sam2ResultPath))
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.requestedToolId !== 'sam2') fail('accepted_sam2_tool_mismatch')
  if (acceptedSam2.gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests !== 1) {
    fail('accepted_sam2_gpu_start_allowed_not_1')
  }
  if (acceptedSam2.booleans?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('accepted_sam2_gpu_start_allowed_boolean_not_true')
  }
  if (acceptedSam2.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail('accepted_sam2_gpu_should_start_not_false')
  }
  assertFalseBooleans('accepted_sam2', acceptedSam2.booleans)

  const badResult = runJson(proofArgs(d3AuthorizationPath, badResultPath))
  if (badResult.status !== 'external_beta_api_route_queue_smoke_result_rejected') {
    fail('bad_result_wrong_status')
  }
  if (!JSON.stringify(badResult.rejectionReasons ?? []).includes('public artifacts')) {
    fail('bad_result_missing_public_artifact_reason')
  }

  const mismatchedResult = runJson(proofArgs(d3AuthorizationPath, mismatchedResultPath))
  if (mismatchedResult.status !== 'external_beta_api_route_queue_smoke_result_rejected') {
    fail('mismatched_result_wrong_status')
  }
  if (!JSON.stringify(mismatchedResult.rejectionReasons ?? []).includes('tool id mismatch')) {
    fail('mismatched_result_missing_tool_reason')
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const combinedDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /apiRouteQueueSmokeApprovedNow["'`\s:]*true/i,
  /apiRouteExecutionApprovedNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
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
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
])
for (const rawLine of packageDiff.split('\n')) {
  const line = rawLine.trimEnd()
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

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
  console.error(`AI graphics external-beta API route queue smoke proof diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: gpuTools.size,
  apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence: 1,
  liveQueueRowsAcceptedWithProvidedEvidence: 1,
  liveQueueRowsPersistedAfterCleanup: 0,
  liveWorkerDispatchesAcceptedWithProvidedEvidence: 0,
  liveToolExecutionsAcceptedWithProvidedEvidence: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
