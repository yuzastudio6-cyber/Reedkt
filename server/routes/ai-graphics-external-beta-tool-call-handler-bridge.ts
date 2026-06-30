import {
  aiGraphicsExternalBetaToolCallRequestSchema,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
} from './ai-graphics-external-beta-tool-call-routes'
import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_SMOKE_DECISION,
} from '../tool-registry/ai-graphics-external-beta-api-route-backend-adapter-smoke'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_HANDLER_BRIDGE_DECISION =
  'ai_graphics_external_beta_tool_call_handler_bridge_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaToolCallHandlerBridgeStatus =
  | 'missing_backend_adapter_smoke_packet'
  | 'backend_adapter_smoke_rejected'
  | 'missing_handler_bridge_requests'
  | 'handler_bridge_request_rejected'
  | 'disabled_handler_bridge_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaToolCallHandlerBridgeRequest {
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

export interface AiGraphicsExternalBetaToolCallHandlerBridgeInput {
  sourceBackendAdapterSmokePacket?: Record<string, unknown>
  handlerBridgeRequests?: AiGraphicsExternalBetaToolCallHandlerBridgeRequest[]
}

export interface AiGraphicsExternalBetaToolCallHandlerBridgeCase {
  requestId: string
  toolId: string
  capabilityId: string
  routePath: typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH
  method: 'POST'
  requestSchemaAccepted: true
  sourceBackendAdapterSmokeAccepted: true
  handlerBridgeMode: 'disabled_backend_adapter_preflight_only'
  handlerBridgePreparedWithProvidedEvidence: true
  responseStatusWhileDisabled: 409
  responseCodeWhileDisabled: 'TOOL_NOT_READY'
  futureResponseStatusAfterExplicitRouteMountApproval: 202
  futureAdapterCallRef: 'backend_adapter_preflight_only_no_queue_write'
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  appRouteMountedNow: false
  expressRouteMountedInAppNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionPerformed: false
  backendAdapterCalledWithSideEffectsNow: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  liveQueueWriteApprovedNow: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaToolCallHandlerBridge {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_HANDLER_BRIDGE_DECISION
  status: AiGraphicsExternalBetaToolCallHandlerBridgeStatus
  rejectionReasons: string[]
  sourceBackendAdapterSmokeDecision: string | null
  sourceBackendAdapterSmokeAccepted: boolean
  handlerBridgeRequestsAccepted: boolean
  handlerBridgeRequestCount: 0 | 2
  handlerBridgeCases: AiGraphicsExternalBetaToolCallHandlerBridgeCase[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  handlerBridgeReadyToolsWithProvidedEvidence: 0 | 21
  backendAdapterSmokeReadyToolsWithProvidedEvidence: 0 | 21
  handlerBridgeRequestsAcceptedWithProvidedEvidence: 0 | 2
  cpuStaticHandlerBridgeCasesAcceptedWithProvidedEvidence: 0 | 1
  gpuModelHandlerBridgeCasesAcceptedWithProvidedEvidence: 0 | 1
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
  handlerBridgePolicy: {
    disabledExpressHandlerBridgeOnly: true
    sourceBackendAdapterSmokeRequired: true
    routeSchemaValidationRequired: true
    backendAdapterPreflightCallSitePrepared: true
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
  allowedBridgeActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaToolCallHandlerBridgePrepared: true
    sourceBackendAdapterSmokeAccepted: boolean
    handlerBridgeRequestsAccepted: boolean
    handlerBridgeReadyWithProvidedEvidence: boolean
    cpuStaticHandlerBridgeAccepted: boolean
    gpuModelHandlerBridgeAccepted: boolean
    disabledExpressHandlerBridgeOnly: true
    backendAdapterPreflightCallSitePrepared: boolean
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
    expressRouteMountedInAppNow: false
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

const handlerBridgePolicy = {
  disabledExpressHandlerBridgeOnly: true,
  sourceBackendAdapterSmokeRequired: true,
  routeSchemaValidationRequired: true,
  backendAdapterPreflightCallSitePrepared: true,
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

const allowedBridgeActions = [
  'read accepted route-to-backend-adapter smoke metadata',
  'validate route-shaped requests with the disabled Express route schema',
  'prepare the disabled Express handler bridge call site to the backend adapter preflight',
  'return a blocked handler response candidate while the app route remains unmounted',
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
  'QA the disabled handler bridge while the route remains unmounted.',
  'Add a private route-to-queue authorization bridge before any live queue write is enabled.',
  'Only after owner approval, mount the route behind feature flags while preserving queue and worker gates.',
]

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  return typeof value === 'number' ? value :
    typeof counts[key] === 'number' ? counts[key] as number :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function smokeAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_SMOKE_DECISION &&
    packet.status === 'route_to_backend_adapter_smoke_ready_runtime_still_blocked' &&
    countFrom(packet, 'backendAdapterSmokeReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeSmokeRequestsAcceptedWithProvidedEvidence') === 2 &&
    countFrom(packet, 'cpuStaticRouteSmokeCasesAcceptedWithProvidedEvidence') === 1 &&
    countFrom(packet, 'gpuModelRouteSmokeCasesAcceptedWithProvidedEvidence') === 1 &&
    countFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    countFrom(packet, 'routeExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'workerEnqueueApprovedNowTools') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    booleanFrom(packet, 'backendAdapterSmokeReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function requestReasons(
  request: AiGraphicsExternalBetaToolCallHandlerBridgeRequest,
  sourceSmokePacket?: Record<string, unknown>,
): string[] {
  const parse = aiGraphicsExternalBetaToolCallRequestSchema.safeParse(request)
  const cases = (sourceSmokePacket?.routeSmokeCases ?? []) as Array<Record<string, unknown>>
  const sourceCase = cases.find((item) => item.toolId === request.toolId)
  return [
    !parse.success ? `route request schema rejected for ${request.requestId}` : undefined,
    !sourceCase ? `source smoke case is missing for ${request.toolId}` : undefined,
    sourceCase && sourceCase.capabilityId !== request.capabilityId
      ? `source smoke capability mismatch for ${request.toolId}`
      : undefined,
    sourceCase && sourceCase.gpuRuntimeShouldStartNow !== false
      ? `source smoke GPU start must remain false for ${request.toolId}`
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  hasRequests: boolean
  requestReasons: string[]
}): AiGraphicsExternalBetaToolCallHandlerBridgeStatus {
  if (!input.hasSource) return 'missing_backend_adapter_smoke_packet'
  if (!input.sourceAccepted) return 'backend_adapter_smoke_rejected'
  if (!input.hasRequests) return 'missing_handler_bridge_requests'
  if (input.requestReasons.length > 0) return 'handler_bridge_request_rejected'
  return 'disabled_handler_bridge_ready_runtime_still_blocked'
}

function buildBridgeCase(
  request: AiGraphicsExternalBetaToolCallHandlerBridgeRequest,
  sourceSmokePacket: Record<string, unknown>,
): AiGraphicsExternalBetaToolCallHandlerBridgeCase {
  const sourceCase = ((sourceSmokePacket.routeSmokeCases ?? []) as Array<Record<string, unknown>>)
    .find((item) => item.toolId === request.toolId)
  if (!sourceCase) throw new Error(`Missing source smoke case for ${request.toolId}`)
  return {
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    method: 'POST',
    requestSchemaAccepted: true,
    sourceBackendAdapterSmokeAccepted: true,
    handlerBridgeMode: 'disabled_backend_adapter_preflight_only',
    handlerBridgePreparedWithProvidedEvidence: true,
    responseStatusWhileDisabled: 409,
    responseCodeWhileDisabled: 'TOOL_NOT_READY',
    futureResponseStatusAfterExplicitRouteMountApproval: 202,
    futureAdapterCallRef: 'backend_adapter_preflight_only_no_queue_write',
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      sourceCase.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: false,
    appRouteMountedNow: false,
    expressRouteMountedInAppNow: false,
    apiRouteExecutionApprovedNow: false,
    routeExecutionPerformed: false,
    backendAdapterCalledWithSideEffectsNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    liveQueueWriteApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

export function evaluateAiGraphicsExternalBetaToolCallHandlerBridge(
  input: AiGraphicsExternalBetaToolCallHandlerBridgeInput = {},
): AiGraphicsExternalBetaToolCallHandlerBridge {
  const sourceAccepted = smokeAccepted(input.sourceBackendAdapterSmokePacket)
  const requests = input.handlerBridgeRequests ?? []
  const bridgeRequestReasons = [
    requests.length > 0 && requests.length !== 2
      ? 'handler bridge requires exactly two representative requests'
      : undefined,
    requests.length === 2 && !requests.some((request) => request.toolId === 'd3')
      ? 'handler bridge is missing the d3 CPU/static representative request'
      : undefined,
    requests.length === 2 && !requests.some((request) => request.toolId === 'sam2')
      ? 'handler bridge is missing the sam2 GPU/model representative request'
      : undefined,
    ...requests.flatMap((request) => requestReasons(
      request,
      input.sourceBackendAdapterSmokePacket,
    )),
  ].filter((reason): reason is string => Boolean(reason))
  const status = statusFromInput({
    hasSource: Boolean(input.sourceBackendAdapterSmokePacket),
    sourceAccepted,
    hasRequests: requests.length > 0,
    requestReasons: bridgeRequestReasons,
  })
  const ready = status === 'disabled_handler_bridge_ready_runtime_still_blocked'
  const handlerBridgeCases = ready && input.sourceBackendAdapterSmokePacket
    ? requests.map((request) => buildBridgeCase(request, input.sourceBackendAdapterSmokePacket!))
    : []
  const cpuStaticAccepted =
    handlerBridgeCases.some((item) => item.toolId === 'd3' && !item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
  const gpuModelAccepted =
    handlerBridgeCases.some((item) => item.toolId === 'sam2' && item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)

  const rejectionReasons = [
    !input.sourceBackendAdapterSmokePacket
      ? 'accepted backend adapter smoke packet is missing'
      : undefined,
    input.sourceBackendAdapterSmokePacket && !sourceAccepted
      ? 'backend adapter smoke packet is not accepted'
      : undefined,
    sourceAccepted && requests.length === 0
      ? 'handler bridge requests are missing'
      : undefined,
    ...bridgeRequestReasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_HANDLER_BRIDGE_DECISION,
    status,
    rejectionReasons,
    sourceBackendAdapterSmokeDecision:
      typeof input.sourceBackendAdapterSmokePacket?.decision === 'string'
        ? input.sourceBackendAdapterSmokePacket.decision
        : null,
    sourceBackendAdapterSmokeAccepted: sourceAccepted,
    handlerBridgeRequestsAccepted: ready,
    handlerBridgeRequestCount: ready ? 2 : 0,
    handlerBridgeCases,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    handlerBridgeReadyToolsWithProvidedEvidence: ready ? 21 : 0,
    backendAdapterSmokeReadyToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    handlerBridgeRequestsAcceptedWithProvidedEvidence: ready ? 2 : 0,
    cpuStaticHandlerBridgeCasesAcceptedWithProvidedEvidence: cpuStaticAccepted ? 1 : 0,
    gpuModelHandlerBridgeCasesAcceptedWithProvidedEvidence: gpuModelAccepted ? 1 : 0,
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
    handlerBridgePolicy,
    allowedBridgeActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaToolCallHandlerBridgePrepared: true,
      sourceBackendAdapterSmokeAccepted: sourceAccepted,
      handlerBridgeRequestsAccepted: ready,
      handlerBridgeReadyWithProvidedEvidence: ready,
      cpuStaticHandlerBridgeAccepted: cpuStaticAccepted,
      gpuModelHandlerBridgeAccepted: gpuModelAccepted,
      disabledExpressHandlerBridgeOnly: true,
      backendAdapterPreflightCallSitePrepared: ready,
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
      expressRouteMountedInAppNow: false,
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

export function buildAiGraphicsExternalBetaToolCallHandlerBridgeInput(
  sourceBackendAdapterSmokePacket: Record<string, unknown>,
): AiGraphicsExternalBetaToolCallHandlerBridgeInput {
  return {
    sourceBackendAdapterSmokePacket,
    handlerBridgeRequests: [
      {
        workspaceId: 'workspace_ai_graphics_external_beta_handler_bridge',
        requestId: 'handler-bridge-d3-cpu-static',
        toolId: 'd3',
        capabilityId: 'chart_overlay',
        approvedPlanSnapshotId: 'approved-snapshot-handler-bridge-d3',
        creditReservationId: 'credit-reservation-handler-bridge-d3',
        privateArtifactManifestRef:
          'private://ai-graphics/external-beta/handler-bridge/d3/artifact-manifest',
        toolRouteApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/d3/tool-route-approval',
        workerApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/d3/worker-approval',
        runtimeEnqueueApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/d3/runtime-enqueue-approval',
        ownerRuntimeApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/d3/owner-runtime-approval',
        traceId: 'trace-ai-graphics-handler-bridge-d3',
        payload: {
          handlerBridgeOnly: true,
          expectedRuntimeTarget: 'node_cpu_static',
        },
      },
      {
        workspaceId: 'workspace_ai_graphics_external_beta_handler_bridge',
        requestId: 'handler-bridge-sam2-gpu-model',
        toolId: 'sam2',
        capabilityId: 'subject_segmentation',
        approvedPlanSnapshotId: 'approved-snapshot-handler-bridge-sam2',
        creditReservationId: 'credit-reservation-handler-bridge-sam2',
        privateArtifactManifestRef:
          'private://ai-graphics/external-beta/handler-bridge/sam2/artifact-manifest',
        toolRouteApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/sam2/tool-route-approval',
        workerApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/sam2/worker-approval',
        runtimeEnqueueApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/sam2/runtime-enqueue-approval',
        ownerRuntimeApprovalRef:
          'private://ai-graphics/external-beta/handler-bridge/sam2/owner-runtime-approval',
        traceId: 'trace-ai-graphics-handler-bridge-sam2',
        payload: {
          handlerBridgeOnly: true,
          expectedRuntimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
        },
      },
    ],
  }
}
