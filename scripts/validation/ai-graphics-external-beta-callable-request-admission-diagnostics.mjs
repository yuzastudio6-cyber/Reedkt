import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_callable_request_admission_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_callable_request_admission_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-callable-request-admission'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-callable-request-admission.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-callable-request-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-callable-request-admission-diagnostics.mjs'

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

const capabilityByTool = {
  torch_torchvision: ['model_runtime_foundation', 'tensor_image_ops'],
  transformers: ['model_runtime_foundation'],
  sam2: ['subject_segmentation', 'background_removal'],
  birefnet: ['background_removal', 'subject_segmentation'],
  real_esrgan: ['upscaling'],
  kornia: ['tensor_image_ops'],
  rembg: ['background_removal'],
  transparent_background: ['background_removal'],
  d3: ['chart_overlay', 'data_visualization', 'svg_graphics'],
  echarts: ['chart_overlay', 'data_visualization'],
  vega_lite: ['chart_overlay', 'data_visualization'],
  vega: ['chart_overlay', 'data_visualization'],
  satori: ['svg_graphics'],
  svgdotjs_svg_js: ['svg_graphics'],
  viz_js: ['diagram_graphics', 'svg_graphics'],
  lottie_web: ['animation_overlay'],
  animejs: ['animation_overlay'],
  three_js: ['webgl_3d_scene'],
  pixi_js: ['canvas_scene', 'webgl_3d_scene'],
  konva: ['canvas_scene'],
  babylonjs: ['webgl_3d_scene'],
}

const failures = []
function fail(message) {
  failures.push(message)
}

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8')
}

function json(file) {
  return JSON.parse(read(file))
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
}

function runJson(args) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', runScriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function assertFalseBooleans(label, booleans) {
  for (const key of [
    'agentCanExecuteToolsNow',
    'externalBetaCallableNow',
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
    'workerEnqueuePerformed',
    'routeExecutionPerformed',
    'backendQueueSubmissionPerformed',
    'serviceRoleQueueSmokePerformed',
    'serviceRoleTransactionPerformed',
    'supabaseMutationPerformed',
    'liveQueueWritePerformed',
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
  ]) {
    if (booleans?.[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

function callableScopeFixture(overrides = {}) {
  const callableScopes = tools.map((toolId) => ({
    toolId,
    productionToolId: `ai_graphics_${toolId}`,
    workerType: gpuTools.has(toolId) ? 'gpu_ai_worker' : 'render_worker',
    runtimeTarget: gpuTools.has(toolId)
      ? `native_linux_amd64_nvidia_l4_${toolId}_runtime`
      : 'node_cpu_static',
    capabilityIds: capabilityByTool[toolId] ?? ['blocked_or_deferred'],
    gpuRequiredForRuntime: gpuTools.has(toolId),
    sourceLaunchGoNoGoApprovedWithProvidedEvidence: true,
    sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence: true,
    sourceWorkerDispatchSmokeProofAcceptedWithProvidedEvidence: true,
    externalBetaCallableCandidateWithProvidedEvidence: true,
    externalBetaCallableNow: false,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuTools.has(toolId),
    gpuRuntimeShouldStartNow: false,
    missingEvidenceBeforeCallable: [],
    blockedRuntimeActions: ['agent/tool execution', 'GPU/model runtime execution now'],
    nextExternalBetaMilestone: gpuTools.has(toolId)
      ? 'prove accepted GPU worker dispatch against private runtime, with GPU start only at job claim time'
      : 'prove accepted CPU/static worker dispatch against private runtime before external-beta traffic',
  }))
  return {
    decision: 'ai_graphics_external_beta_callable_scope_prepared_with_runtime_blocks',
    sourceExternalBetaLaunchGoNoGoDecision:
      'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks',
    sourceExternalBetaLiveEnqueueAuthorizationDecision:
      'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks',
    sourceExternalBetaWorkerDispatchSmokeProofDecision:
      'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks',
    status: 'external_beta_callable_scope_candidate_recorded_runtime_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    heavyToolsIncorrectlyTargetingCpu: 0,
    sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
    sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
    externalBetaCallableCandidateToolsWithProvidedEvidence: 21,
    externalBetaCallableCandidateCapabilitiesWithProvidedEvidence: 12,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceExternalBetaLaunchGoNoGo: null,
    sourceExternalBetaLiveEnqueueAuthorization: null,
    sourceExternalBetaWorkerDispatchSmokeProof: null,
    callableScopes,
    allowedCallableScopeActions: ['record all 21 AI graphics tools as external-beta callable candidates with provided evidence'],
    blockedRuntimeActions: ['agent/tool execution', 'GPU/model runtime execution now'],
    nextMilestones: ['Bind this callable scope to a real external-beta tool-call API admission layer with approved plan snapshot and credit reservation checks.'],
    booleans: {
      externalBetaCallableScopePrepared: true,
      sourceExternalBetaLaunchGoNoGoAccepted: true,
      sourceExternalBetaLiveEnqueueAuthorizationAccepted: true,
      sourceExternalBetaWorkerDispatchSmokeProofAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      all21ExternalBetaCallableCandidatesWithProvidedEvidence: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    ...overrides,
  }
}

function gatewayFixture(toolId, capabilityId, overrides = {}) {
  const gpu = gpuTools.has(toolId)
  const candidate = {
    candidateRef: `external-beta-worker-enqueue-candidate://${toolId}`,
    requestId: 'external-beta-request-fixture',
    workspaceId: 'external-beta-workspace-fixture',
    toolId,
    productionToolId: `ai_graphics_${toolId}`,
    workerType: gpu ? 'gpu_ai_worker' : 'render_worker',
    capabilityId,
    runtimeTarget: gpu ? `native_linux_amd64_nvidia_l4_${toolId}_runtime` : 'node_cpu_static',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
    artifactBoundaryApprovalRef: 'artifact_boundary_approval_external_beta_fixture',
    toolRouteApprovalRef: 'tool_route_approval_external_beta_fixture',
    workerApprovalRef: 'worker_approval_external_beta_fixture',
    runtimeEnqueueApprovalRef: 'runtime_enqueue_approval_external_beta_fixture',
    ownerRuntimeApprovalRef: 'owner_runtime_approval_external_beta_fixture',
    gpuRequiredForRuntime: gpu,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    idempotencyKey: 'external-beta-idempotency-key-fixture',
    traceId: 'external-beta-trace-fixture',
    workerQueueApprovedNow: false,
    workerEnqueuePerformed: false,
  }
  return {
    decision: 'external_beta_worker_enqueue_candidate_ready',
    sourceDecision: 'ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks',
    sourceExternalBetaRuntimeAdmissionDecision:
      'ai_graphics_external_beta_runtime_admission_contract_prepared_with_runtime_blocks',
    sourceRuntimeAdmissionMode: 'all_tools_external_beta',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceExternalBetaRuntimeAdmission: {
      onDemandRuntimeAdmission: {
        selectedTool: {
          toolId,
          productionToolId: `ai_graphics_${toolId}`,
          workerType: candidate.workerType,
          runtimeTarget: candidate.runtimeTarget,
          gpuRequiredForRuntime: gpu,
        },
      },
    },
    sourceExternalBetaRuntimeAdmissionAccepted: true,
    sourceExternalBetaRuntimeAdmissionProofBridgeAccepted: true,
    sourceExternalBetaCpuStaticRuntimeAdmissionAccepted: false,
    missingGatewayControls: [],
    externalBetaGatewayControlsSatisfied: true,
    externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: true,
    externalBetaWorkerEnqueueCandidate: candidate,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gatewayPolicy: {
      sideEffectFreeGatewayCheck: true,
      externalBetaUserAndWorkspaceRequired: true,
      featureFlagEvaluationRequired: true,
      rolloutAssignmentRequired: true,
      rateLimitDecisionRequired: true,
      costCeilingDecisionRequired: true,
      auditTraceRequired: true,
      idempotencyKeyRequired: true,
      workerEnqueueCandidateOnly: true,
      onDemandGpuOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    booleans: {
      externalBetaToolCallGatewayPrepared: true,
      sourceExternalBetaRuntimeAdmissionAccepted: true,
      sourceExternalBetaRuntimeAdmissionProofBridgeAccepted: true,
      externalBetaGatewayControlsSatisfied: true,
      externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      externalBetaFeatureFlagEvaluated: true,
      externalBetaRolloutAssignmentAccepted: true,
      externalBetaRateLimitAccepted: true,
      externalBetaCostCeilingAccepted: true,
      externalBetaAuditTracePrepared: true,
      externalBetaIdempotencyKeyAccepted: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    ...overrides,
  }
}

for (const file of [
  'server/tool-registry/ai-graphics-external-beta-callable-request-admission.ts',
  'server/cli/ai-graphics-external-beta-callable-request-admission.ts',
  'scripts/validation/ai-graphics-external-beta-callable-request-admission-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.md',
]) {
  if (!fs.existsSync(path.join(process.cwd(), file))) fail(`missing_file:${file}`)
}

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('missing_run_package_script')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('missing_diagnostic_package_script')
}

const index = read('server/tool-registry/index.ts')
if (!index.includes("export * from './ai-graphics-external-beta-callable-request-admission'")) {
  fail('missing_index_export')
}

const source = read('server/tool-registry/ai-graphics-external-beta-callable-request-admission.ts')
for (const required of [
  decision,
  'external_beta_callable_request_admission_ready_runtime_still_blocked',
  'approvedPlanSnapshotAccepted',
  'creditReservationAccepted',
  'gpuRuntimeShouldStartNow: false',
  'workerEnqueuePerformed: false',
  'toolExecutionPerformed: false',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}
for (const forbidden of [
  'gpuRuntimeShouldStartNow: true',
  'agentCanExecuteToolsNow: true',
  'workerEnqueuePerformed: true',
  'toolExecutionPerformed: true',
  'externalBetaReadyNow: true',
  'productionReadyNow: true',
  'dry_run_passed',
  'generated_local_fixture_passed',
]) {
  if (source.includes(forbidden)) fail(`source_forbidden_claim:${forbidden}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-callable-request-admission.md')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.scope?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.scope?.productFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.scope?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.scope?.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence !== 1) {
  fail('docs_request_admission_ready_count_not_1')
}
if (docs.scope?.externalBetaCallableNowTools !== 0) fail('docs_callable_now_not_zero')
if (docs.scope?.externalBetaReadyNowTools !== 0) fail('docs_external_beta_ready_not_zero')
if (docs.scope?.productionReadyNowTools !== 0) fail('docs_production_ready_not_zero')
for (const toolId of tools) {
  if (!docs.tools?.includes(toolId)) fail(`docs_missing_tool:${toolId}`)
}
for (const toolId of gpuTools) {
  if (!docs.gpuRuntimeTools?.includes(toolId)) fail(`docs_missing_gpu_tool:${toolId}`)
}
for (const text of [
  'approved plan snapshot',
  'credit reservation',
  'private artifact manifest',
  'GPU startup as on-demand only',
]) {
  if (!docs.requestAdmissionRequires?.some((item) => item.includes(text))) {
    fail(`docs_missing_requirement:${text}`)
  }
}
for (const blocked of [
  'Tool Route execution',
  'live queue write',
  'Worker execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(blocked)) fail(`docs_missing_block:${blocked}`)
  if (!docsMd.includes(blocked)) fail(`docs_md_missing_block:${blocked}`)
}
assertFalseBooleans('docs', docs.booleans)

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-callable-request-admission-'))
try {
  const scopePath = path.join(tmpRoot, 'scope.json')
  const rejectedScopePath = path.join(tmpRoot, 'rejected-scope.json')
  const gatewayD3Path = path.join(tmpRoot, 'gateway-d3.json')
  const gatewaySam2Path = path.join(tmpRoot, 'gateway-sam2.json')
  const rejectedGatewayPath = path.join(tmpRoot, 'rejected-gateway.json')
  const mismatchGatewayPath = path.join(tmpRoot, 'mismatch-gateway.json')

  writeJson(scopePath, callableScopeFixture())
  writeJson(rejectedScopePath, callableScopeFixture({
    status: 'external_beta_callable_scope_candidate_recorded_runtime_still_blocked',
    externalBetaCallableCandidateToolsWithProvidedEvidence: 20,
  }))
  writeJson(gatewayD3Path, gatewayFixture('d3', 'chart_overlay'))
  writeJson(gatewaySam2Path, gatewayFixture('sam2', 'background_removal'))
  writeJson(rejectedGatewayPath, gatewayFixture('d3', 'chart_overlay', {
    decision: 'missing_external_beta_gateway_controls',
    externalBetaGatewayControlsSatisfied: false,
    externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: false,
    booleans: {
      ...gatewayFixture('d3', 'chart_overlay').booleans,
      externalBetaGatewayControlsSatisfied: false,
      externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: false,
    },
  }))
  writeJson(mismatchGatewayPath, gatewayFixture('d3', 'upscaling'))

  const missing = runJson([])
  if (missing.status !== 'missing_external_beta_callable_scope') {
    fail('missing_case_wrong_status')
  }

  const missingGateway = runJson(['--external-beta-callable-scope-packet', scopePath])
  if (missingGateway.status !== 'missing_external_beta_tool_call_gateway') {
    fail('missing_gateway_case_wrong_status')
  }

  const rejectedScope = runJson([
    '--external-beta-callable-scope-packet',
    rejectedScopePath,
    '--external-beta-tool-call-gateway-packet',
    gatewayD3Path,
  ])
  if (rejectedScope.status !== 'external_beta_callable_scope_rejected') {
    fail('rejected_scope_case_wrong_status')
  }

  const rejectedGateway = runJson([
    '--external-beta-callable-scope-packet',
    scopePath,
    '--external-beta-tool-call-gateway-packet',
    rejectedGatewayPath,
  ])
  if (rejectedGateway.status !== 'external_beta_tool_call_gateway_rejected') {
    fail('rejected_gateway_case_wrong_status')
  }

  const mismatch = runJson([
    '--external-beta-callable-scope-packet',
    scopePath,
    '--external-beta-tool-call-gateway-packet',
    mismatchGatewayPath,
  ])
  if (mismatch.status !== 'requested_tool_not_in_callable_scope') {
    fail('mismatch_case_wrong_status')
  }

  const acceptedD3 = runJson([
    '--external-beta-callable-scope-packet',
    scopePath,
    '--external-beta-tool-call-gateway-packet',
    gatewayD3Path,
  ])
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence !== 1) {
    fail('accepted_d3_ready_count_not_1')
  }
  if (acceptedD3.callableRequestCandidate?.toolId !== 'd3') fail('accepted_d3_tool_mismatch')
  if (acceptedD3.callableRequestCandidate?.creditReservationId !== 'credit_reservation_external_beta_fixture') {
    fail('accepted_d3_credit_reservation_missing')
  }
  if (acceptedD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_should_be_false')
  }
  if (acceptedD3.gpuRuntimeShouldStartNow !== false) fail('accepted_d3_gpu_should_start_not_false')
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = runJson([
    '--external-beta-callable-scope-packet',
    scopePath,
    '--external-beta-tool-call-gateway-packet',
    gatewaySam2Path,
  ])
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.callableRequestCandidate?.toolId !== 'sam2') fail('accepted_sam2_tool_mismatch')
  if (acceptedSam2.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('accepted_sam2_gpu_start_allowed_not_true')
  }
  if (acceptedSam2.gpuRuntimeShouldStartNow !== false) fail('accepted_sam2_gpu_should_start_not_false')
  if (acceptedSam2.booleans.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('accepted_sam2_gpu_boolean_not_true')
  }
  assertFalseBooleans('accepted_sam2', acceptedSam2.booleans)
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
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
  '+    "ai-graphics:external-beta-controlled-on-demand-status-bridge": "tsx server/cli/ai-graphics-external-beta-controlled-on-demand-status-bridge.ts",',
  '+    "ai-graphics:external-beta-controlled-on-demand-status-bridge:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-on-demand-status-bridge-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-boundary": "tsx server/cli/ai-graphics-external-beta-api-route-boundary.ts",',
  '+    "ai-graphics:external-beta-api-route-boundary:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-boundary-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-insertion-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-insertion-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-insertion-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-insertion-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-callable-request-admission": "tsx server/cli/ai-graphics-external-beta-callable-request-admission.ts",',
  '+    "ai-graphics:external-beta-callable-request-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-callable-request-admission-diagnostics.mjs",',
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
  console.error(`AI graphics external-beta callable request admission diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: 21,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: 8,
  externalBetaCallableCandidateToolsWithProvidedEvidence: 21,
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: 1,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
