import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_queue_insertion_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_queue_insertion_proof_ready_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-api-route-queue-insertion-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-queue-insertion-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-queue-insertion-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-queue-insertion-proof-diagnostics.mjs'

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

function controlArgs() {
  return [
    '--external-beta-route-queue-insertion-policy-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/policy',
    '--external-beta-route-queue-insertion-schema-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/schema',
    '--external-beta-route-queue-service-role-authorization-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/service-role-authorization',
    '--external-beta-route-queue-idempotency-binding-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/idempotency-binding',
    '--external-beta-route-queue-approved-snapshot-binding-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/approved-snapshot-binding',
    '--external-beta-route-queue-credit-reservation-binding-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/credit-reservation-binding',
    '--external-beta-route-queue-private-artifact-manifest-binding-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/private-artifact-manifest-binding',
    '--external-beta-route-queue-audit-envelope-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/audit-envelope',
    '--external-beta-route-queue-rollback-plan-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/rollback-plan',
    '--external-beta-route-queue-poison-queue-policy-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/poison-queue-policy',
    '--external-beta-route-queue-non-production-environment-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/non-production-environment',
    '--external-beta-route-queue-private-network-ref',
    'private://ai-graphics/external-beta/route-queue-insertion/private-network',
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
    'serviceRoleQueueTransactionApprovedNow',
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

function routeBoundaryFixture(toolId, capabilityId, overrides = {}) {
  const runtime = runtimeForTool(toolId)
  const gpuStartAllowed = runtime.gpuRequiredForRuntime
  const routeCandidate = {
    routeId: 'ai_graphics_external_beta_tool_call',
    method: 'POST',
    routePath: '/api/ai-graphics/external-beta/tool-call',
    toolId,
    capabilityId,
    requestId: 'external-beta-request-fixture',
    workspaceId: 'external-beta-workspace-fixture',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
    gatewayCandidateRef: `external-beta-worker-enqueue-candidate://${toolId}`,
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
    workerEnqueuePerformed: false,
    toolExecutionPerformed: false,
  }
  return {
    decision: 'ai_graphics_external_beta_api_route_boundary_prepared_with_runtime_blocks',
    sourceExternalBetaCallableRequestAdmissionDecision:
      'ai_graphics_external_beta_callable_request_admission_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_boundary_candidate_ready_runtime_still_blocked',
    requestedToolId: toolId,
    capabilityId,
    sourceCallableRequestAdmissionAccepted: true,
    externalBetaApiRouteBoundaryControlsSatisfied: true,
    missingApiRouteBoundaryControls: [],
    externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence: true,
    externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence: 1,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
    gpuRuntimeShouldStartNow: false,
    sourceExternalBetaCallableRequestAdmission: null,
    sourceCallableRequestCandidate: null,
    apiRouteCandidate: routeCandidate,
    apiRouteBoundaryPolicy: {
      futureRouteOnly: true,
      mountedRouteNotCreated: true,
      sideEffectFreeBoundaryCheck: true,
      policyRefRequired: true,
      schemaRefRequired: true,
      authorizationRefRequired: true,
      requestValidationRefRequired: true,
      approvedSnapshotResolverRequired: true,
      creditReservationResolverRequired: true,
      rateLimitAndCostGuardrailRequired: true,
      idempotencyAndAuditRequired: true,
      privateNetworkRequired: true,
      rollbackAndIncidentResponseRequired: true,
      onDemandGpuOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    allowedBoundaryActions: ['record one future external-beta API route boundary candidate'],
    blockedRuntimeActions: ['API route execution', 'live queue write', 'GPU/model runtime execution now'],
    nextMilestones: ['Run private non-production API-route-to-queue insertion proof before any external-beta user traffic.'],
    booleans: {
      externalBetaApiRouteBoundaryPrepared: true,
      sourceExternalBetaCallableRequestAdmissionAccepted: true,
      externalBetaApiRouteBoundaryControlsSatisfied: true,
      externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
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

function backendQueueSubmissionFixture(toolId, capabilityId, overrides = {}) {
  const runtime = runtimeForTool(toolId)
  const gpuStartAllowed = runtime.gpuRequiredForRuntime
  const payload = {
    jobId: `external-beta-ai-graphics-${toolId}-job`,
    workspaceId: 'external-beta-workspace-fixture',
    projectId: 'external-beta-project-fixture',
    approvedSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    toolExecutionPlanId: `external-beta-${toolId}-tool-plan`,
    workerType: runtime.workerType,
    productionToolId: `ai_graphics_${toolId}`,
    toolId,
    capabilityId,
    idempotencyKey: 'external-beta-idempotency-key-fixture',
    metadata: {
      sourceGatewayTraceId: 'external-beta-trace-fixture',
      sourceGatewayRuntimeAdmissionProofBridgeAccepted: true,
    },
  }
  const queueEnvelope = {
    toolId,
    productionToolId: `ai_graphics_${toolId}`,
    workerType: runtime.workerType,
    runtimeTarget: runtime.runtimeTarget,
    capabilityId,
    queueName: 'ai_graphics_external_beta_tool_runtime',
    backendQueueSubmissionRef: 'private://ai-graphics/external-beta/backend-queue/submission',
    queueSubmissionSchemaRef: 'private://ai-graphics/external-beta/backend-queue/schema',
    serviceRoleTransactionEnvelopeRef:
      'private://ai-graphics/external-beta/backend-queue/service-role-transaction',
    queueWriteAuthorizationRef:
      'private://ai-graphics/external-beta/backend-queue/write-authorization',
    sourceAdapterCandidateRef: `external-beta-worker-enqueue-candidate://${toolId}`,
    sourceAdapterProofBridgeAccepted: true,
    productionWorkerJobPayload: payload,
    queueBatchCandidate: {
      batchId: 'external-beta-ai-graphics-batch-fixture',
      workspaceId: 'external-beta-workspace-fixture',
      projectId: 'external-beta-project-fixture',
      queueName: 'ai_graphics_external_beta_tool_runtime',
      jobCount: 1,
      status: 'prepared_not_submitted',
      serviceRoleRequired: true,
      liveInsertPerformed: false,
    },
    queueJobCandidate: {
      jobId: payload.jobId,
      jobType: 'ai_graphics_tool_runtime',
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      approvedSnapshotId: payload.approvedSnapshotId,
      creditReservationId: payload.creditReservationId,
      toolExecutionPlanId: payload.toolExecutionPlanId,
      workerType: runtime.workerType,
      runtimeTarget: runtime.runtimeTarget,
      idempotencyKey: payload.idempotencyKey,
      payload,
      status: 'prepared_not_submitted',
      liveInsertPerformed: false,
    },
    queueAuditCandidate: {
      auditEventRef: 'private://ai-graphics/external-beta/backend-queue/audit',
      eventName: 'external_beta_ai_graphics_queue_submission_prepared',
      toolId,
      capabilityId,
      queueName: 'ai_graphics_external_beta_tool_runtime',
      traceId: 'external-beta-trace-fixture',
      liveInsertPerformed: false,
    },
    sourceAdapterPayloadReadyWithProvidedEvidence: true,
    submissionEnvelopeShapeValid: true,
    submissionEnvelopeReadyWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
    gpuRuntimeShouldStartNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
  return {
    decision: 'external_beta_backend_queue_submission_envelope_ready',
    sourceDecision: 'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks',
    sourceExternalBetaWorkerEnqueueAdapterDecision:
      'ai_graphics_external_beta_worker_enqueue_adapter_payload_prepared_with_runtime_blocks',
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    sourceExternalBetaWorkerEnqueueAdapter: null,
    sourceExternalBetaWorkerEnqueueAdapterAccepted: true,
    sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted: true,
    missingQueueSubmissionControls: [],
    externalBetaQueueSubmissionControlsSatisfied: true,
    externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: true,
    externalBetaBackendQueueSubmissionEnvelope: queueEnvelope,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
    gpuRuntimeShouldStartNow: false,
    liveBackendQueueSubmissionsNow: 0,
    liveServiceRoleTransactionsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    submissionPolicy: {
      sideEffectFreeSubmissionCheck: true,
      sourceAdapterPayloadRequired: true,
      queueSubmissionRefRequired: true,
      queueSubmissionSchemaRequired: true,
      serviceRoleTransactionEnvelopeRequired: true,
      queueWriteAuthorizationRequired: true,
      approvedSnapshotPersistenceRequired: true,
      creditReservationPersistenceRequired: true,
      privateArtifactPersistenceRequired: true,
      auditEnvelopeRequired: true,
      rollbackPlanRequired: true,
      queueSubmissionEnvelopeOnly: true,
      onDemandGpuOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    booleans: {
      externalBetaBackendQueueSubmissionEnvelopePrepared: true,
      sourceExternalBetaWorkerEnqueueAdapterAccepted: true,
      sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted: true,
      externalBetaQueueSubmissionControlsSatisfied: true,
      externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      queueSubmissionEnvelopeShapeValid: true,
      queueSubmissionRefAccepted: true,
      queueSubmissionSchemaAccepted: true,
      serviceRoleTransactionEnvelopeAccepted: true,
      queueWriteAuthorizationAccepted: true,
      approvedSnapshotPersistenceAccepted: true,
      creditReservationPersistenceAccepted: true,
      privateArtifactPersistenceAccepted: true,
      auditEnvelopeAccepted: true,
      rollbackPlanAccepted: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob: gpuStartAllowed,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
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
      serviceRoleTransactionPerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
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
  'server/tool-registry/ai-graphics-external-beta-api-route-queue-insertion-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-queue-insertion-proof.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-queue-insertion-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-insertion-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-insertion-proof.md',
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
if (!index.includes("export * from './ai-graphics-external-beta-api-route-queue-insertion-proof'")) {
  fail('missing_index_export')
}

const source = read('server/tool-registry/ai-graphics-external-beta-api-route-queue-insertion-proof.ts')
for (const required of [
  decision,
  acceptedStatus,
  'routeAndQueueMatch',
  'queueJobStatus: \'prepared_not_submitted\'',
  'liveQueueWritePerformed: false',
  'backendQueueSubmissionPerformed: false',
  'serviceRoleTransactionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
  'private network reference is missing',
]) {
  if (!source.includes(required)) fail(`source_missing:${required}`)
}
for (const forbidden of [
  'apiRouteMountedNow: true',
  'apiRouteExecutionPerformed: true',
  'routeExecutionApprovedNow: true',
  'backendQueueSubmissionApprovedNow: true',
  'liveQueueWriteApprovedNow: true',
  'liveQueueWritePerformed: true',
  'agentCanExecuteToolsNow: true',
  'gpuRuntimeShouldStartNow: true',
  'externalBetaReadyNow: true',
  'productionReadyNow: true',
  'dry_run_passed',
  'generated_local_fixture_passed',
]) {
  if (source.includes(forbidden)) fail(`source_forbidden_claim:${forbidden}`)
}

const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-insertion-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-insertion-proof.md')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail('docs_status_mismatch')
if (docs.scope?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.scope?.productFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.scope?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.scope?.externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence !== 1) {
  fail('docs_candidate_count_not_1')
}
if (docs.routeQueueInsertionCandidate?.queueJobStatus !== 'prepared_not_submitted') {
  fail('docs_queue_status_not_prepared')
}
for (const required of [
  'accepted external-beta API route boundary packet',
  'accepted external-beta backend queue submission envelope packet',
  'route candidate and queue envelope match the same approved snapshot',
  'external beta route-to-queue service-role authorization reference',
  'external beta route-to-queue non-production environment reference',
  'external beta route-to-queue private network reference',
  'GPU startup as on-demand only',
]) {
  if (!docs.routeQueueInsertionRequires?.includes(required)) {
    fail(`docs_missing_requirement:${required}`)
  }
}
for (const blocked of [
  'mounted API route creation',
  'API route execution',
  'Tool Route execution',
  'live queue write',
  'backend queue submission',
  'service-role transaction',
  'Worker queue enqueue',
  'GPU/model runtime execution now',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.includes(blocked)) fail(`docs_missing_block:${blocked}`)
  if (!docsMd.includes(blocked)) fail(`docs_md_missing_block:${blocked}`)
}
assertFalseBooleans('docs', docs.booleans)

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-route-queue-proof-'))
try {
  const d3RoutePath = path.join(tmpRoot, 'route-d3.json')
  const d3QueuePath = path.join(tmpRoot, 'queue-d3.json')
  const sam2RoutePath = path.join(tmpRoot, 'route-sam2.json')
  const sam2QueuePath = path.join(tmpRoot, 'queue-sam2.json')
  const rejectedRoutePath = path.join(tmpRoot, 'rejected-route.json')
  const rejectedQueuePath = path.join(tmpRoot, 'rejected-queue.json')
  const mismatchedQueuePath = path.join(tmpRoot, 'mismatched-queue.json')

  writeJson(d3RoutePath, routeBoundaryFixture('d3', 'chart_overlay'))
  writeJson(d3QueuePath, backendQueueSubmissionFixture('d3', 'chart_overlay'))
  writeJson(sam2RoutePath, routeBoundaryFixture('sam2', 'background_removal'))
  writeJson(sam2QueuePath, backendQueueSubmissionFixture('sam2', 'background_removal'))
  writeJson(rejectedRoutePath, routeBoundaryFixture('d3', 'chart_overlay', {
    status: 'missing_external_beta_api_route_boundary_controls',
    externalBetaApiRouteBoundaryControlsSatisfied: false,
  }))
  writeJson(rejectedQueuePath, backendQueueSubmissionFixture('d3', 'chart_overlay', {
    decision: 'missing_external_beta_backend_queue_submission_controls',
    externalBetaQueueSubmissionControlsSatisfied: false,
  }))
  writeJson(mismatchedQueuePath, backendQueueSubmissionFixture('sam2', 'background_removal'))

  const missingRoute = runJson([])
  if (missingRoute.status !== 'missing_external_beta_api_route_boundary') {
    fail('missing_route_case_wrong_status')
  }

  const rejectedRoute = runJson([
    '--external-beta-api-route-boundary-packet',
    rejectedRoutePath,
    '--external-beta-backend-queue-submission-packet',
    d3QueuePath,
    ...controlArgs(),
  ])
  if (rejectedRoute.status !== 'external_beta_api_route_boundary_rejected') {
    fail('rejected_route_case_wrong_status')
  }

  const missingQueue = runJson([
    '--external-beta-api-route-boundary-packet',
    d3RoutePath,
    ...controlArgs(),
  ])
  if (missingQueue.status !== 'missing_external_beta_backend_queue_submission') {
    fail('missing_queue_case_wrong_status')
  }

  const rejectedQueue = runJson([
    '--external-beta-api-route-boundary-packet',
    d3RoutePath,
    '--external-beta-backend-queue-submission-packet',
    rejectedQueuePath,
    ...controlArgs(),
  ])
  if (rejectedQueue.status !== 'external_beta_backend_queue_submission_rejected') {
    fail('rejected_queue_case_wrong_status')
  }

  const mismatch = runJson([
    '--external-beta-api-route-boundary-packet',
    d3RoutePath,
    '--external-beta-backend-queue-submission-packet',
    mismatchedQueuePath,
    ...controlArgs(),
  ])
  if (mismatch.status !== 'requested_tool_mismatch_between_route_and_queue') {
    fail('mismatch_case_wrong_status')
  }
  if (mismatch.routeQueueMatchReport?.routeAndQueueMatch !== false) {
    fail('mismatch_case_match_report_not_false')
  }

  const missingControls = runJson([
    '--external-beta-api-route-boundary-packet',
    d3RoutePath,
    '--external-beta-backend-queue-submission-packet',
    d3QueuePath,
  ])
  if (missingControls.status !== 'missing_external_beta_route_to_queue_controls') {
    fail('missing_controls_case_wrong_status')
  }
  if (!missingControls.missingRouteQueueInsertionControls?.includes(
    'external beta route-to-queue insertion policy reference is missing',
  )) {
    fail('missing_controls_does_not_list_policy')
  }

  const acceptedD3 = runJson([
    '--external-beta-api-route-boundary-packet',
    d3RoutePath,
    '--external-beta-backend-queue-submission-packet',
    d3QueuePath,
    ...controlArgs(),
  ])
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence !== 1) {
    fail('accepted_d3_candidate_count_not_1')
  }
  if (acceptedD3.routeQueueMatchReport?.routeAndQueueMatch !== true) {
    fail('accepted_d3_route_queue_not_matched')
  }
  if (acceptedD3.routeQueueInsertionCandidate?.queueJobStatus !== 'prepared_not_submitted') {
    fail('accepted_d3_queue_status_mismatch')
  }
  if (acceptedD3.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_should_be_false')
  }
  if (acceptedD3.gpuRuntimeShouldStartNow !== false) fail('accepted_d3_gpu_should_start_not_false')
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = runJson([
    '--external-beta-api-route-boundary-packet',
    sam2RoutePath,
    '--external-beta-backend-queue-submission-packet',
    sam2QueuePath,
    ...controlArgs(),
  ])
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.routeQueueInsertionCandidate?.toolId !== 'sam2') {
    fail('accepted_sam2_tool_mismatch')
  }
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
  console.error(`AI graphics external-beta API route queue insertion proof diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: gpuTools.size,
  externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence: 1,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  queueJobStatus: 'prepared_not_submitted',
  apiRouteMountedNow: false,
  apiRouteExecutionPerformed: false,
  liveQueueWritePerformed: false,
  backendQueueSubmissionPerformed: false,
  serviceRoleTransactionPerformed: false,
  workerEnqueuePerformed: false,
  workerDispatchPerformed: false,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
