import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision = 'ai_graphics_external_beta_api_route_boundary_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_boundary_candidate_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-boundary'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-boundary.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-api-route-boundary:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-boundary-diagnostics.mjs'

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

function controlArgs() {
  return [
    '--external-beta-api-route-policy-ref',
    'private://ai-graphics/external-beta/api-route/policy',
    '--external-beta-api-route-schema-ref',
    'private://ai-graphics/external-beta/api-route/schema',
    '--external-beta-api-route-authz-ref',
    'private://ai-graphics/external-beta/api-route/authz',
    '--external-beta-api-route-request-validation-ref',
    'private://ai-graphics/external-beta/api-route/request-validation',
    '--external-beta-approved-snapshot-resolver-ref',
    'private://ai-graphics/external-beta/api-route/approved-snapshot-resolver',
    '--external-beta-credit-reservation-resolver-ref',
    'private://ai-graphics/external-beta/api-route/credit-reservation-resolver',
    '--external-beta-api-route-rate-limit-ref',
    'private://ai-graphics/external-beta/api-route/rate-limit',
    '--external-beta-api-route-cost-guardrail-ref',
    'private://ai-graphics/external-beta/api-route/cost-guardrail',
    '--external-beta-api-route-idempotency-store-ref',
    'private://ai-graphics/external-beta/api-route/idempotency-store',
    '--external-beta-api-route-audit-log-ref',
    'private://ai-graphics/external-beta/api-route/audit-log',
    '--external-beta-api-route-private-network-ref',
    'private://ai-graphics/external-beta/api-route/private-network',
    '--external-beta-api-route-rollback-ref',
    'private://ai-graphics/external-beta/api-route/rollback',
    '--external-beta-api-route-incident-response-ref',
    'private://ai-graphics/external-beta/api-route/incident-response',
  ]
}

function assertFalseBooleans(label, booleans) {
  for (const key of [
    'agentCanExecuteToolsNow',
    'externalBetaCallableNow',
    'apiRouteMountedNow',
    'apiRouteExecutionPerformed',
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

function admissionFixture(toolId, capabilityId, overrides = {}) {
  const gpu = gpuTools.has(toolId)
  const candidate = {
    toolId,
    capabilityId,
    productionToolId: `ai_graphics_${toolId}`,
    workerType: gpu ? 'gpu_ai_worker' : 'render_worker',
    runtimeTarget: gpu ? `native_linux_amd64_nvidia_l4_${toolId}_runtime` : 'node_cpu_static',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
    gatewayCandidateRef: `external-beta-worker-enqueue-candidate://${toolId}`,
    requestId: 'external-beta-request-fixture',
    workspaceId: 'external-beta-workspace-fixture',
    traceId: 'external-beta-trace-fixture',
    idempotencyKey: 'external-beta-idempotency-key-fixture',
    gpuRequiredForRuntime: gpu,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    workerQueueApprovedNow: false,
    workerEnqueuePerformed: false,
    toolExecutionPerformed: false,
  }
  return {
    decision: 'ai_graphics_external_beta_callable_request_admission_prepared_with_runtime_blocks',
    sourceExternalBetaCallableScopeDecision:
      'ai_graphics_external_beta_callable_scope_prepared_with_runtime_blocks',
    sourceExternalBetaToolCallGatewayDecision:
      'ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks',
    status: 'external_beta_callable_request_admission_ready_runtime_still_blocked',
    requestedToolId: toolId,
    capabilityId,
    sourceCallableScopeAccepted: true,
    sourceToolCallGatewayAccepted: true,
    requestedToolPresentInCallableScope: true,
    requestedCapabilityPresentInCallableScope: true,
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: true,
    externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: 1,
    externalBetaCallableCandidateToolsWithProvidedEvidence: 21,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
    gpuRuntimeShouldStartNow: false,
    sourceExternalBetaCallableScope: null,
    sourceExternalBetaToolCallGateway: null,
    sourceCallableScopeTool: null,
    callableRequestCandidate: candidate,
    allowedAdmissionActions: ['record one external-beta callable request-admission candidate with provided evidence'],
    blockedRuntimeActions: ['agent/tool execution', 'GPU/model runtime execution now'],
    nextMilestones: ['Bind this request-admission candidate to the real external-beta API route handler.'],
    booleans: {
      externalBetaCallableRequestAdmissionPrepared: true,
      sourceExternalBetaCallableScopeAccepted: true,
      sourceExternalBetaToolCallGatewayAccepted: true,
      requestedToolPresentInCallableScope: true,
      requestedCapabilityPresentInCallableScope: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      gatewayControlsAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpu,
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

for (const file of [
  'server/tool-registry/ai-graphics-external-beta-api-route-boundary.ts',
  'server/cli/ai-graphics-external-beta-api-route-boundary.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-boundary-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-boundary.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-boundary.md',
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
if (!index.includes("export * from './ai-graphics-external-beta-api-route-boundary'")) {
  fail('missing_index_export')
}

const source = read('server/tool-registry/ai-graphics-external-beta-api-route-boundary.ts')
for (const required of [
  decision,
  acceptedStatus,
  'mounted API route creation',
  'apiRouteMountedNow: false',
  'apiRouteExecutionPerformed: false',
  'routeExecutionApprovedNow: false',
  'gpuRuntimeShouldStartNow: false',
  'approvedPlanSnapshotAccepted',
  'creditReservationAccepted',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}
for (const forbidden of [
  'apiRouteMountedNow: true',
  'apiRouteExecutionPerformed: true',
  'routeExecutionApprovedNow: true',
  'agentCanExecuteToolsNow: true',
  'gpuRuntimeShouldStartNow: true',
  'externalBetaReadyNow: true',
  'productionReadyNow: true',
  'dry_run_passed',
  'generated_local_fixture_passed',
]) {
  if (source.includes(forbidden)) fail(`source_forbidden_claim:${forbidden}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-boundary.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-boundary.md')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.scope?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.scope?.productFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.scope?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.scope?.externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence !== 1) {
  fail('docs_route_boundary_candidate_count_not_1')
}
if (docs.futureRoute?.mountedNow !== false) fail('docs_future_route_mounted_not_false')
if (docs.futureRoute?.executedNow !== false) fail('docs_future_route_executed_not_false')
for (const required of [
  'accepted external-beta callable request-admission packet',
  'future API route policy reference',
  'future API route schema reference',
  'future API route authorization reference',
  'approved snapshot resolver reference',
  'credit reservation resolver reference',
  'GPU startup as on-demand only',
]) {
  if (!docs.routeBoundaryRequires?.includes(required)) {
    fail(`docs_missing_requirement:${required}`)
  }
}
for (const blocked of [
  'mounted API route creation',
  'API route execution',
  'Tool Route execution',
  'live queue write',
  'Worker execution',
  'GPU/model runtime execution now',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(blocked)) fail(`docs_missing_block:${blocked}`)
  if (!docsMd.includes(blocked)) fail(`docs_md_missing_block:${blocked}`)
}
assertFalseBooleans('docs', docs.booleans)

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-api-route-boundary-'))
try {
  const d3AdmissionPath = path.join(tmpRoot, 'admission-d3.json')
  const sam2AdmissionPath = path.join(tmpRoot, 'admission-sam2.json')
  const rejectedAdmissionPath = path.join(tmpRoot, 'rejected-admission.json')
  writeJson(d3AdmissionPath, admissionFixture('d3', 'chart_overlay'))
  writeJson(sam2AdmissionPath, admissionFixture('sam2', 'background_removal'))
  writeJson(rejectedAdmissionPath, admissionFixture('d3', 'chart_overlay', {
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: false,
  }))

  const missing = runJson([])
  if (missing.status !== 'missing_external_beta_callable_request_admission') {
    fail('missing_case_wrong_status')
  }

  const rejected = runJson([
    '--external-beta-callable-request-admission-packet',
    rejectedAdmissionPath,
    ...controlArgs(),
  ])
  if (rejected.status !== 'external_beta_callable_request_admission_rejected') {
    fail('rejected_admission_case_wrong_status')
  }

  const missingControls = runJson([
    '--external-beta-callable-request-admission-packet',
    d3AdmissionPath,
  ])
  if (missingControls.status !== 'missing_external_beta_api_route_boundary_controls') {
    fail('missing_controls_case_wrong_status')
  }
  if (!missingControls.missingApiRouteBoundaryControls?.includes('external beta API route policy reference is missing')) {
    fail('missing_controls_does_not_list_policy')
  }

  const acceptedD3 = runJson([
    '--external-beta-callable-request-admission-packet',
    d3AdmissionPath,
    ...controlArgs(),
  ])
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence !== 1) {
    fail('accepted_d3_candidate_count_not_1')
  }
  if (acceptedD3.apiRouteCandidate?.routePath !== '/api/ai-graphics/external-beta/tool-call') {
    fail('accepted_d3_route_path_mismatch')
  }
  if (acceptedD3.apiRouteCandidate?.apiRouteMountedNow !== false) {
    fail('accepted_d3_route_mounted_not_false')
  }
  if (acceptedD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_should_be_false')
  }
  if (acceptedD3.gpuRuntimeShouldStartNow !== false) fail('accepted_d3_gpu_should_start_not_false')
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = runJson([
    '--external-beta-callable-request-admission-packet',
    sam2AdmissionPath,
    ...controlArgs(),
  ])
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.apiRouteCandidate?.toolId !== 'sam2') fail('accepted_sam2_tool_mismatch')
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
  '+    "ai-graphics:external-beta-api-route-backend-adapter-smoke": "tsx server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts",',
  '+    "ai-graphics:external-beta-api-route-backend-adapter-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-backend-adapter-smoke-diagnostics.mjs",',
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
  console.error(`AI graphics external-beta API route boundary diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: 21,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: 8,
  externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence: 1,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  apiRouteMountedNow: false,
  apiRouteExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
