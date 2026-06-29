import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_queue_smoke_authorization_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-queue-smoke-authorization'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-queue-smoke-authorization:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-authorization-diagnostics.mjs'

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
    maxBuffer: 20 * 1024 * 1024,
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

function authorizationArgs() {
  return [
    '--external-beta-api-route-queue-smoke-authorization-granted',
    '--external-beta-api-route-queue-smoke-authorization-ref',
    'external-beta-route-queue-smoke://authorization/fixture',
    '--external-beta-api-route-queue-smoke-operator-role',
    'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR',
    '--external-beta-api-route-queue-insertion-proof-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/source-route-queue-proof',
    '--external-beta-service-role-queue-smoke-authorization-ref',
    'external-beta-service-role-smoke://authorization/fixture',
    '--external-beta-api-route-queue-smoke-non-production-environment-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/non-production-environment',
    '--external-beta-api-route-queue-smoke-route-execution-window-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/route-execution-window',
    '--external-beta-api-route-queue-smoke-queue-write-window-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/queue-write-window',
    '--external-beta-api-route-queue-smoke-cleanup-plan-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/cleanup-plan',
    '--external-beta-api-route-queue-smoke-rollback-plan-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/rollback-plan',
    '--external-beta-api-route-queue-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/telemetry',
    '--external-beta-api-route-queue-smoke-cost-ceiling-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/cost-ceiling',
    '--external-beta-api-route-queue-smoke-private-network-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/private-network',
    '--external-beta-api-route-queue-smoke-incident-response-ref',
    'private://ai-graphics/external-beta/route-queue-smoke/incident-response',
  ]
}

function assertFalseBooleans(label, booleans) {
  for (const key of [
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
    'serviceRoleQueueSmokeApprovedNow',
    'liveServiceRoleQueueSmokeExecutedNow',
    'liveQueueWriteApprovedNow',
    'liveJobBatchInsertApprovedNow',
    'liveJobInsertApprovedNow',
    'liveWorkerClaimInsertApprovedNow',
    'liveWorkerEventInsertApprovedNow',
    'liveAuditEventInsertApprovedNow',
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

function routeQueueInsertionProofFixture(toolId, capabilityId, overrides = {}) {
  const runtime = runtimeForTool(toolId)
  const gpuStartAllowed = runtime.gpuRequiredForRuntime
  const candidate = {
    proofId: 'ai_graphics_external_beta_api_route_queue_insertion_proof',
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
    gatewayCandidateRef: `external-beta-worker-enqueue-candidate://${toolId}`,
    sourceAdapterCandidateRef: `external-beta-worker-enqueue-candidate://${toolId}`,
    traceId: 'external-beta-trace-fixture',
    idempotencyKey: 'external-beta-idempotency-key-fixture',
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionPerformed: false,
    routeExecutionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
  return {
    decision: 'ai_graphics_external_beta_api_route_queue_insertion_proof_prepared_with_runtime_blocks',
    sourceExternalBetaApiRouteBoundaryDecision:
      'ai_graphics_external_beta_api_route_boundary_prepared_with_runtime_blocks',
    sourceExternalBetaBackendQueueSubmissionDecision:
      'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_queue_insertion_proof_ready_runtime_still_blocked',
    requestedToolId: toolId,
    capabilityId,
    sourceExternalBetaApiRouteBoundaryAccepted: true,
    sourceExternalBetaBackendQueueSubmissionAccepted: true,
    externalBetaRouteQueueInsertionControlsSatisfied: true,
    missingRouteQueueInsertionControls: [],
    routeQueueMatchReport: {
      toolIdMatches: true,
      capabilityIdMatches: true,
      workspaceIdMatches: true,
      approvedSnapshotMatches: true,
      creditReservationMatches: true,
      idempotencyKeyMatches: true,
      runtimeTargetMatches: true,
      workerTypeMatches: true,
      sourceCandidateRefMatches: true,
      queuePreparedNotSubmitted: true,
      routeAndQueueMatch: true,
      mismatches: [],
    },
    externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence: true,
    externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence: 1,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
    gpuRuntimeShouldStartNow: false,
    sourceExternalBetaApiRouteBoundary: null,
    sourceExternalBetaBackendQueueSubmission: null,
    sourceApiRouteCandidate: null,
    sourceBackendQueueSubmissionEnvelope: null,
    routeQueueInsertionCandidate: candidate,
    routeQueueInsertionPolicy: {
      sideEffectFreeInsertionProof: true,
      nonProductionOnly: true,
      routeBoundaryRequired: true,
      backendQueueSubmissionEnvelopeRequired: true,
      routeQueuePolicyRefRequired: true,
      routeQueueSchemaRefRequired: true,
      serviceRoleAuthorizationRefRequired: true,
      idempotencyBindingRequired: true,
      approvedSnapshotBindingRequired: true,
      creditReservationBindingRequired: true,
      privateArtifactManifestBindingRequired: true,
      auditEnvelopeRequired: true,
      rollbackPlanRequired: true,
      poisonQueuePolicyRequired: true,
      privateNetworkRequired: true,
      liveQueueWriteBlockedNow: true,
      workerDispatchBlockedNow: true,
      onDemandGpuOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    allowedProofActions: ['record one side-effect-free API-route-to-queue insertion proof candidate'],
    blockedRuntimeActions: ['API route execution', 'live queue write', 'GPU/model runtime execution now'],
    nextMilestones: ['implement the private non-production API route queue smoke runner behind explicit operator confirmation'],
    booleans: {
      externalBetaApiRouteQueueInsertionProofPrepared: true,
      sourceExternalBetaApiRouteBoundaryAccepted: true,
      sourceExternalBetaBackendQueueSubmissionAccepted: true,
      externalBetaRouteQueueInsertionControlsSatisfied: true,
      routeAndQueueMatch: true,
      externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence: true,
      approvedPlanSnapshotBindingAccepted: true,
      creditReservationBindingAccepted: true,
      privateArtifactManifestBindingAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
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

function serviceRoleSmokeAuthorizationFixture(overrides = {}) {
  return {
    decision: 'ai_graphics_external_beta_service_role_queue_smoke_authorization_prepared_with_runtime_blocks',
    sourceExternalBetaLiveEnqueueAuthorizationDecision:
      'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks',
    sourceExternalBetaServiceRoleQueueSmokeReadinessDecision:
      'ai_graphics_external_beta_service_role_queue_smoke_readiness_prepared_with_runtime_blocks',
    sourceExternalBetaServiceRoleQueueSmokePreflightDecision:
      'ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_runtime_blocks',
    status: 'external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
    sourceServiceRoleQueueSmokeReadinessAcceptedWithProvidedEvidenceRequests: 1,
    sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests: 1,
    serviceRoleQueueSmokeAuthorizationCandidateToolsWithProvidedEvidence: 21,
    serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence: 21,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    heavyToolsIncorrectlyTargetingCpu: 0,
    serviceRoleQueueSmokeApprovedNowTools: 0,
    liveQueueWritesApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceExternalBetaLiveEnqueueAuthorization: null,
    sourceExternalBetaServiceRoleQueueSmokeReadiness: null,
    sourceExternalBetaServiceRoleQueueSmokePreflight: null,
    serviceRoleQueueSmokeAuthorizationRecord: {
      accepted: true,
      operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR',
      authorizationRef: 'external-beta-service-role-smoke://authorization/fixture',
      smokeReadinessRef: 'private://ai-graphics/service-role-smoke/readiness',
      smokePreflightRef: 'private://ai-graphics/service-role-smoke/preflight',
      nonProductionEnvironmentRef: 'private://ai-graphics/service-role-smoke/non-production',
      queueWriteWindowRef: 'private://ai-graphics/service-role-smoke/queue-window',
      cleanupPlanRef: 'private://ai-graphics/service-role-smoke/cleanup',
      rollbackPlanRef: 'private://ai-graphics/service-role-smoke/rollback',
      telemetryRef: 'private://ai-graphics/service-role-smoke/telemetry',
      costCeilingRef: 'private://ai-graphics/service-role-smoke/cost',
      authorizesServiceRoleQueueSmokeNow: false,
      authorizesLiveQueueWriteNow: false,
      authorizesWorkerDispatchNow: false,
      authorizesToolExecutionNow: false,
      authorizesRuntimeNow: false,
    },
    allowedServiceRoleQueueSmokeAuthorizationActions: ['record non-production service-role queue smoke authorization metadata'],
    blockedRuntimeActions: ['service-role queue smoke execution now', 'live Supabase queue write', 'worker dispatch'],
    toolScopes: [],
    nextMilestones: ['run the explicitly confirmed non-production service-role queue write smoke in a private environment'],
    booleans: {
      externalBetaServiceRoleQueueSmokeAuthorizationPrepared: true,
      sourceExternalBetaLiveEnqueueAuthorizationAccepted: true,
      sourceExternalBetaServiceRoleQueueSmokeReadinessAccepted: true,
      sourceExternalBetaServiceRoleQueueSmokePreflightAccepted: true,
      serviceRoleQueueSmokeAuthorizationRecordAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ServiceRoleQueueSmokeAuthorizationScopesPrepared: true,
      all21ServiceRoleQueueSmokeAuthorizationScopesRecordedWithProvidedEvidence: true,
      gpuHeavyToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedOnlyForAcceptedJobs: true,
      gpuRuntimeShouldStartNow: false,
      cpuFallbackAllowedForHeavyTools: false,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      cleanupRequired: true,
      rollbackRequired: true,
      telemetryRequired: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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
  'server/tool-registry/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts',
  'server/cli/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-authorization-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-authorization.md',
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
if (!index.includes("export * from './ai-graphics-external-beta-api-route-queue-smoke-authorization'")) {
  fail('missing_index_export')
}

const source = read('server/tool-registry/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts')
for (const required of [
  decision,
  acceptedStatus,
  'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR',
  'apiRouteQueueSmokeApprovedNow: false',
  'apiRouteExecutionPerformed: false',
  'liveQueueWritePerformed: false',
  'workerDispatchPerformed: false',
  'toolExecutionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}
for (const forbidden of [
  'apiRouteQueueSmokeApprovedNow: true',
  'apiRouteExecutionPerformed: true',
  'routeExecutionApprovedNow: true',
  'backendQueueSubmissionApprovedNow: true',
  'liveQueueWriteApprovedNow: true',
  'liveQueueWritePerformed: true',
  'workerDispatchApprovedNow: true',
  'toolExecutionApprovedNow: true',
  'agentCanExecuteToolsNow: true',
  'gpuRuntimeShouldStartNow: true',
  'externalBetaReadyNow: true',
  'productionReadyNow: true',
  'dry_run_passed',
  'generated_local_fixture_passed',
]) {
  if (source.includes(forbidden)) fail(`source_forbidden_claim:${forbidden}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-authorization.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-smoke-authorization.md')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence !== 1) {
  fail('docs_recorded_request_count_not_1')
}
for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const blocked of [
  'API route queue smoke execution now',
  'API route execution',
  'live queue write',
  'worker dispatch',
  'tool execution',
  'GPU/model runtime execution now',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(blocked)) fail(`docs_missing_block:${blocked}`)
  if (!docsMd.includes(blocked)) fail(`docs_md_missing_block:${blocked}`)
}
assertFalseBooleans('docs', docs.booleans)

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-route-queue-smoke-auth-'))
try {
  const d3ProofPath = path.join(tmpRoot, 'route-queue-proof-d3.json')
  const sam2ProofPath = path.join(tmpRoot, 'route-queue-proof-sam2.json')
  const rejectedProofPath = path.join(tmpRoot, 'rejected-proof.json')
  const serviceRoleAuthPath = path.join(tmpRoot, 'service-role-auth.json')
  const rejectedServiceRoleAuthPath = path.join(tmpRoot, 'rejected-service-role-auth.json')
  writeJson(d3ProofPath, routeQueueInsertionProofFixture('d3', 'chart_overlay'))
  writeJson(sam2ProofPath, routeQueueInsertionProofFixture('sam2', 'background_removal'))
  writeJson(rejectedProofPath, routeQueueInsertionProofFixture('d3', 'chart_overlay', {
    status: 'missing_external_beta_route_to_queue_controls',
    externalBetaRouteQueueInsertionControlsSatisfied: false,
  }))
  writeJson(serviceRoleAuthPath, serviceRoleSmokeAuthorizationFixture())
  writeJson(rejectedServiceRoleAuthPath, serviceRoleSmokeAuthorizationFixture({
    status: 'awaiting_external_beta_service_role_queue_smoke_authorization',
    serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence: 0,
  }))

  const missingProof = runJson([])
  if (missingProof.status !== 'missing_external_beta_api_route_queue_insertion_proof') {
    fail('missing_proof_case_wrong_status')
  }

  const rejectedProof = runJson([
    '--external-beta-api-route-queue-insertion-proof-packet',
    rejectedProofPath,
    '--external-beta-service-role-queue-smoke-authorization-packet',
    serviceRoleAuthPath,
    ...authorizationArgs(),
  ])
  if (rejectedProof.status !== 'external_beta_api_route_queue_insertion_proof_rejected') {
    fail('rejected_proof_case_wrong_status')
  }

  const missingServiceRole = runJson([
    '--external-beta-api-route-queue-insertion-proof-packet',
    d3ProofPath,
    ...authorizationArgs(),
  ])
  if (missingServiceRole.status !== 'missing_external_beta_service_role_queue_smoke_authorization') {
    fail('missing_service_role_case_wrong_status')
  }

  const rejectedServiceRole = runJson([
    '--external-beta-api-route-queue-insertion-proof-packet',
    d3ProofPath,
    '--external-beta-service-role-queue-smoke-authorization-packet',
    rejectedServiceRoleAuthPath,
    ...authorizationArgs(),
  ])
  if (rejectedServiceRole.status !== 'external_beta_service_role_queue_smoke_authorization_rejected') {
    fail('rejected_service_role_case_wrong_status')
  }

  const awaitingAuthorization = runJson([
    '--external-beta-api-route-queue-insertion-proof-packet',
    d3ProofPath,
    '--external-beta-service-role-queue-smoke-authorization-packet',
    serviceRoleAuthPath,
  ])
  if (awaitingAuthorization.status !== 'awaiting_external_beta_api_route_queue_smoke_authorization') {
    fail('awaiting_authorization_case_wrong_status')
  }

  const acceptedD3 = runJson([
    '--external-beta-api-route-queue-insertion-proof-packet',
    d3ProofPath,
    '--external-beta-service-role-queue-smoke-authorization-packet',
    serviceRoleAuthPath,
    ...authorizationArgs(),
  ])
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence !== 1) {
    fail('accepted_d3_recorded_count_not_1')
  }
  if (acceptedD3.apiRouteQueueSmokeAuthorizationCandidate?.queueJobStatus !== 'prepared_not_submitted') {
    fail('accepted_d3_queue_status_mismatch')
  }
  if (acceptedD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests !== 0) {
    fail('accepted_d3_gpu_start_allowed_count_should_be_0')
  }
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = runJson([
    '--external-beta-api-route-queue-insertion-proof-packet',
    sam2ProofPath,
    '--external-beta-service-role-queue-smoke-authorization-packet',
    serviceRoleAuthPath,
    ...authorizationArgs(),
  ])
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.apiRouteQueueSmokeAuthorizationCandidate?.toolId !== 'sam2') {
    fail('accepted_sam2_tool_mismatch')
  }
  if (acceptedSam2.gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests !== 1) {
    fail('accepted_sam2_gpu_start_allowed_count_not_1')
  }
  if (acceptedSam2.apiRouteQueueSmokeAuthorizationCandidate?.gpuRuntimeShouldStartNow !== false) {
    fail('accepted_sam2_gpu_should_start_not_false')
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
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
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
  console.error(`AI graphics external-beta API route queue smoke authorization diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: gpuTools.size,
  apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence: 1,
  apiRouteQueueSmokeApprovedNowRequests: 0,
  apiRouteExecutionsPerformedNowRequests: 0,
  liveQueueWritesPerformedNowRequests: 0,
  workerDispatchPerformedNowRequests: 0,
  toolExecutionPerformedNowRequests: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
