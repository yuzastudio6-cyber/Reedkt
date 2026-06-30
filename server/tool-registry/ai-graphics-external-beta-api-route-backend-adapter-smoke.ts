import {
  aiGraphicsExternalBetaToolCallRequestSchema,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_DECISION,
  type AiGraphicsExternalBetaApiRouteBackendAdapter,
} from './ai-graphics-external-beta-api-route-backend-adapter'
import {
  getAiGraphicsMappedProductionProfile,
  getAiGraphicsToolCallReadiness,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_SMOKE_DECISION =
  'ai_graphics_external_beta_api_route_backend_adapter_smoke_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteBackendAdapterSmokeStatus =
  | 'missing_backend_adapter_preflight_packet'
  | 'backend_adapter_preflight_rejected'
  | 'missing_route_smoke_requests'
  | 'route_smoke_request_rejected'
  | 'route_to_backend_adapter_smoke_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteBackendAdapterSmokeRequest {
  workspaceId: string
  requestId: string
  toolId: string
  capabilityId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  runtimeEnqueueApprovalRef: string
  ownerRuntimeApprovalRef: string
  traceId: string
  payload?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput {
  sourceBackendAdapterPacket?: AiGraphicsExternalBetaApiRouteBackendAdapter | Record<string, unknown>
  routeSmokeRequests?: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeRequest[]
}

export interface AiGraphicsExternalBetaApiRouteBackendAdapterSmokeCase {
  requestId: string
  toolId: string
  capabilityId: string
  productionToolId: string
  runtimeTarget: string
  workerType: string
  routePath: typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH
  requestSchemaAccepted: true
  backendAdapterPreflightAccepted: true
  futureResponseStatusIfMounted: 202
  futureResponseMode: 'accepted_for_backend_adapter_preflight_only_route_not_mounted'
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  appRouteMountedNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionPerformed: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaApiRouteBackendAdapterSmoke {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_SMOKE_DECISION
  status: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeStatus
  rejectionReasons: string[]
  sourceBackendAdapterDecision: string | null
  sourceBackendAdapterAccepted: boolean
  routeSmokeRequestsAccepted: boolean
  routeSmokeRequestCount: 0 | 2
  routeSmokeCases: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeCase[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  backendAdapterSmokeReadyToolsWithProvidedEvidence: 0 | 21
  backendAdapterPreflightReadyToolsWithProvidedEvidence: 0 | 21
  routeSmokeRequestsAcceptedWithProvidedEvidence: 0 | 2
  cpuStaticRouteSmokeCasesAcceptedWithProvidedEvidence: 0 | 1
  gpuModelRouteSmokeCasesAcceptedWithProvidedEvidence: 0 | 1
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  liveQueueWriteApprovedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  smokePolicy: {
    privateRouteToBackendAdapterSmokeOnly: true
    routeSchemaValidationOnly: true
    sourceBackendAdapterPreflightRequired: true
    cpuStaticRepresentativeRequest: 'd3'
    gpuModelRepresentativeRequest: 'sam2'
    appRouteMountDeferred: true
    noApiRouteExecution: true
    noBackendQueueSubmission: true
    noLiveQueueWrite: true
    noWorkerEnqueue: true
    noWorkerDispatch: true
    noToolExecution: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedSmokeActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteBackendAdapterSmokePrepared: true
    sourceBackendAdapterPreflightAccepted: boolean
    routeSmokeRequestsAccepted: boolean
    backendAdapterSmokeReadyWithProvidedEvidence: boolean
    cpuStaticRouteSmokeAccepted: boolean
    gpuModelRouteSmokeAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerEnqueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const allowedSmokeActions = [
  'read accepted backend adapter preflight metadata',
  'validate route-shaped external-beta tool-call requests with the disabled route schema',
  'bind route-shaped CPU/static and GPU/model requests to backend adapter preflight metadata',
  'return private smoke candidates for future route-to-backend-adapter integration',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'approved snapshot mutation',
  'credit reservation mutation',
  'private artifact write',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'tool execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'QA the private route-to-backend-adapter smoke while the route remains unmounted.',
  'Add a disabled Express handler bridge that calls the backend adapter only after route ownership review.',
  'Run a private route-to-queue authorization smoke before any live queue write or worker enqueue is enabled.',
]

const smokePolicy = {
  privateRouteToBackendAdapterSmokeOnly: true,
  routeSchemaValidationOnly: true,
  sourceBackendAdapterPreflightRequired: true,
  cpuStaticRepresentativeRequest: 'd3',
  gpuModelRepresentativeRequest: 'sam2',
  appRouteMountDeferred: true,
  noApiRouteExecution: true,
  noBackendQueueSubmission: true,
  noLiveQueueWrite: true,
  noWorkerEnqueue: true,
  noWorkerDispatch: true,
  noToolExecution: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function backendAdapterAccepted(
  packet?: AiGraphicsExternalBetaApiRouteBackendAdapter | Record<string, unknown>,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_DECISION &&
    packet.status === 'backend_adapter_preflight_ready_runtime_still_blocked' &&
    countFrom(packet, 'backendAdapterPreflightReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    countFrom(packet, 'routeExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'workerEnqueueApprovedNowTools') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'backendAdapterPreflightReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function countFrom(
  packet: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const coverage = (packet?.coverage ?? {}) as Record<string, unknown>
  const scope = (packet?.scope ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  return typeof value === 'number' ? value :
    typeof counts[key] === 'number' ? counts[key] as number :
    typeof coverage[key] === 'number' ? coverage[key] as number :
    typeof scope[key] === 'number' ? scope[key] as number :
    undefined
}

function booleanFrom(
  packet: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function requestRejectionReasons(
  request: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeRequest,
): string[] {
  const parse = aiGraphicsExternalBetaToolCallRequestSchema.safeParse(request)
  const readiness = getAiGraphicsToolCallReadiness(request.toolId)
  const productionProfile = getAiGraphicsMappedProductionProfile(request.toolId)
  const capabilityAccepted = Boolean(readiness?.capabilities.includes(
    request.capabilityId as never,
  )) &&
    request.capabilityId !== 'planning_metadata_only' &&
    request.capabilityId !== 'blocked_or_deferred'

  return [
    !parse.success ? `route request schema rejected for ${request.requestId}` : undefined,
    !readiness ? `unknown AI graphics tool id for ${request.requestId}` : undefined,
    !productionProfile ? `missing production tool profile for ${request.requestId}` : undefined,
    !capabilityAccepted
      ? `capability is not accepted for ${request.toolId} in ${request.requestId}`
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function buildSmokeCase(
  request: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeRequest,
): AiGraphicsExternalBetaApiRouteBackendAdapterSmokeCase {
  const readiness = getAiGraphicsToolCallReadiness(request.toolId)
  const productionProfile = getAiGraphicsMappedProductionProfile(request.toolId)
  if (!readiness || !productionProfile) {
    throw new Error(`Cannot build smoke case for ${request.toolId}`)
  }

  return {
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    productionToolId: productionProfile.toolId,
    runtimeTarget: readiness.runtimeTarget,
    workerType: readiness.productionWorkerType,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    requestSchemaAccepted: true,
    backendAdapterPreflightAccepted: true,
    futureResponseStatusIfMounted: 202,
    futureResponseMode: 'accepted_for_backend_adapter_preflight_only_route_not_mounted',
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: readiness.gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    appRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    routeExecutionPerformed: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    workerEnqueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  hasRequests: boolean
  requestReasons: string[]
}): AiGraphicsExternalBetaApiRouteBackendAdapterSmokeStatus {
  if (!input.hasSource) return 'missing_backend_adapter_preflight_packet'
  if (!input.sourceAccepted) return 'backend_adapter_preflight_rejected'
  if (!input.hasRequests) return 'missing_route_smoke_requests'
  if (input.requestReasons.length > 0) return 'route_smoke_request_rejected'
  return 'route_to_backend_adapter_smoke_ready_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteBackendAdapterSmoke(
  input: AiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput = {},
): AiGraphicsExternalBetaApiRouteBackendAdapterSmoke {
  const sourceAccepted = backendAdapterAccepted(input.sourceBackendAdapterPacket)
  const requests = input.routeSmokeRequests ?? []
  const requestReasons = [
    requests.length > 0 && requests.length !== 2
      ? 'route smoke requires exactly two representative requests'
      : undefined,
    requests.length === 2 && !requests.some((request) => request.toolId === 'd3')
      ? 'route smoke is missing the d3 CPU/static representative request'
      : undefined,
    requests.length === 2 && !requests.some((request) => request.toolId === 'sam2')
      ? 'route smoke is missing the sam2 GPU/model representative request'
      : undefined,
    ...requests.flatMap(requestRejectionReasons),
  ].filter((reason): reason is string => Boolean(reason))
  const status = statusFromInput({
    hasSource: Boolean(input.sourceBackendAdapterPacket),
    sourceAccepted,
    hasRequests: requests.length > 0,
    requestReasons,
  })
  const ready = status === 'route_to_backend_adapter_smoke_ready_runtime_still_blocked'
  const routeSmokeCases = ready ? requests.map(buildSmokeCase) : []
  const cpuStaticAccepted =
    routeSmokeCases.some((item) => item.toolId === 'd3' && !item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
  const gpuModelAccepted =
    routeSmokeCases.some((item) => item.toolId === 'sam2' && item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
  const acceptedRequestCount = ready ? 2 : 0

  const rejectionReasons = [
    !input.sourceBackendAdapterPacket
      ? 'accepted backend adapter preflight packet is missing'
      : undefined,
    input.sourceBackendAdapterPacket && !sourceAccepted
      ? 'backend adapter preflight packet is not accepted'
      : undefined,
    sourceAccepted && requests.length === 0
      ? 'route smoke requests are missing'
      : undefined,
    ...requestReasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_SMOKE_DECISION,
    status,
    rejectionReasons,
    sourceBackendAdapterDecision:
      input.sourceBackendAdapterPacket?.decision ?? null,
    sourceBackendAdapterAccepted: sourceAccepted,
    routeSmokeRequestsAccepted: ready,
    routeSmokeRequestCount: ready ? 2 : 0,
    routeSmokeCases,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    backendAdapterSmokeReadyToolsWithProvidedEvidence: ready ? 21 : 0,
    backendAdapterPreflightReadyToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    routeSmokeRequestsAcceptedWithProvidedEvidence: acceptedRequestCount,
    cpuStaticRouteSmokeCasesAcceptedWithProvidedEvidence: cpuStaticAccepted ? 1 : 0,
    gpuModelRouteSmokeCasesAcceptedWithProvidedEvidence: gpuModelAccepted ? 1 : 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    liveQueueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: sourceAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    smokePolicy,
    allowedSmokeActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteBackendAdapterSmokePrepared: true,
      sourceBackendAdapterPreflightAccepted: sourceAccepted,
      routeSmokeRequestsAccepted: ready,
      backendAdapterSmokeReadyWithProvidedEvidence: ready,
      cpuStaticRouteSmokeAccepted: cpuStaticAccepted,
      gpuModelRouteSmokeAccepted: gpuModelAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerEnqueueApprovedNow: false,
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
  }
}

export function buildAiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput(
  sourceBackendAdapterPacket: AiGraphicsExternalBetaApiRouteBackendAdapter | Record<string, unknown>,
): AiGraphicsExternalBetaApiRouteBackendAdapterSmokeInput {
  return {
    sourceBackendAdapterPacket,
    routeSmokeRequests: [
      {
        workspaceId: 'workspace_ai_graphics_external_beta_smoke',
        requestId: 'route-backend-adapter-smoke-d3-cpu-static',
        toolId: 'd3',
        capabilityId: 'chart_overlay',
        approvedPlanSnapshotId: 'approved-snapshot-ai-graphics-smoke-d3',
        creditReservationId: 'credit-reservation-ai-graphics-smoke-d3',
        privateArtifactManifestRef:
          'private://ai-graphics/external-beta/smoke/d3/artifact-manifest',
        toolRouteApprovalRef:
          'private://ai-graphics/external-beta/smoke/d3/tool-route-approval',
        workerApprovalRef:
          'private://ai-graphics/external-beta/smoke/d3/worker-approval',
        runtimeEnqueueApprovalRef:
          'private://ai-graphics/external-beta/smoke/d3/runtime-enqueue-approval',
        ownerRuntimeApprovalRef:
          'private://ai-graphics/external-beta/smoke/d3/owner-runtime-approval',
        traceId: 'trace-ai-graphics-smoke-d3',
        payload: {
          smokeOnly: true,
          expectedRuntimeTarget: 'node_cpu_static',
        },
      },
      {
        workspaceId: 'workspace_ai_graphics_external_beta_smoke',
        requestId: 'route-backend-adapter-smoke-sam2-gpu-model',
        toolId: 'sam2',
        capabilityId: 'subject_segmentation',
        approvedPlanSnapshotId: 'approved-snapshot-ai-graphics-smoke-sam2',
        creditReservationId: 'credit-reservation-ai-graphics-smoke-sam2',
        privateArtifactManifestRef:
          'private://ai-graphics/external-beta/smoke/sam2/artifact-manifest',
        toolRouteApprovalRef:
          'private://ai-graphics/external-beta/smoke/sam2/tool-route-approval',
        workerApprovalRef:
          'private://ai-graphics/external-beta/smoke/sam2/worker-approval',
        runtimeEnqueueApprovalRef:
          'private://ai-graphics/external-beta/smoke/sam2/runtime-enqueue-approval',
        ownerRuntimeApprovalRef:
          'private://ai-graphics/external-beta/smoke/sam2/owner-runtime-approval',
        traceId: 'trace-ai-graphics-smoke-sam2',
        payload: {
          smokeOnly: true,
          expectedRuntimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
        },
      },
    ],
  }
}
