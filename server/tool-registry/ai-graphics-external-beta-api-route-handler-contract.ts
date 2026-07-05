import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsMappedProductionProfile,
  getAiGraphicsToolCallReadiness,
  listAiGraphicsGpuRuntimeRequiredTools,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_DISPATCH_HANDOFF_PROOF_DECISION,
  type AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof,
} from './ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION,
  type AiGraphicsExternalBetaControlledOnDemandStatusBridge,
} from './ai-graphics-external-beta-controlled-on-demand-status-bridge'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_CONTRACT_DECISION =
  'ai_graphics_external_beta_api_route_handler_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteHandlerContractStatus =
  | 'missing_external_beta_controlled_on_demand_status_bridge'
  | 'external_beta_controlled_on_demand_status_bridge_rejected'
  | 'missing_external_beta_route_worker_dispatch_handoff_proof'
  | 'external_beta_route_worker_dispatch_handoff_proof_rejected'
  | 'missing_external_beta_api_route_handler_controls'
  | 'invalid_requested_tool_or_capability'
  | 'external_beta_api_route_handler_contract_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteHandlerRequest {
  routeId: 'ai_graphics_external_beta_tool_call'
  method: 'POST'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  requestId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  toolId: string
  capabilityId: string
  privateArtifactManifestRef: string
  traceId: string
  idempotencyKey: string
}

export interface AiGraphicsExternalBetaApiRouteHandlerContractInput {
  sourceExternalBetaControlledOnDemandStatusBridgePacket?:
    AiGraphicsExternalBetaControlledOnDemandStatusBridge
  sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket?:
    AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof
  request?: AiGraphicsExternalBetaApiRouteHandlerRequest
  externalBetaApiRouteHandlerRef?: string
  externalBetaApiRouteHandlerSchemaRef?: string
  externalBetaApiRouteHandlerAuthzRef?: string
  externalBetaApiRouteHandlerApprovedSnapshotResolverRef?: string
  externalBetaApiRouteHandlerCreditReservationResolverRef?: string
  externalBetaApiRouteHandlerRateLimitRef?: string
  externalBetaApiRouteHandlerCostGuardrailRef?: string
  externalBetaApiRouteHandlerIdempotencyRef?: string
  externalBetaApiRouteHandlerAuditRef?: string
  externalBetaApiRouteHandlerPrivateArtifactPolicyRef?: string
  externalBetaApiRouteHandlerKillSwitchRef?: string
}

export interface AiGraphicsExternalBetaApiRouteHandlerCandidate {
  handlerId: 'ai_graphics_external_beta_tool_call_handler_contract'
  routeId: 'ai_graphics_external_beta_tool_call'
  method: 'POST'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  capabilityId: string
  workerType: string
  runtimeTarget: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  requestId: string
  traceId: string
  idempotencyKey: string
  responseMode:
    'accepted_for_controlled_on_demand_external_beta_queue_contract_route_not_mounted'
  responseStatusIfMounted: 202
  routeHandlerSourceControlled: true
  routeHandlerPreparedWithProvidedEvidence: true
  routeHandlerMountedInExpressNow: false
  apiRouteRegistryMountedNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionApprovedNow: false
  workerQueueApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaApiRouteHandlerContract {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_CONTRACT_DECISION
  sourceExternalBetaControlledOnDemandStatusBridgeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION | null
  sourceExternalBetaApiRouteWorkerDispatchHandoffProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_DISPATCH_HANDOFF_PROOF_DECISION | null
  status: AiGraphicsExternalBetaApiRouteHandlerContractStatus
  rejectionReasons: string[]
  missingHandlerControls: string[]
  requestedToolId: string | null
  requestedCapabilityId: string | null
  sourceExternalBetaControlledOnDemandStatusBridgeAccepted: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
    boolean
  sourceExternalBetaApiRouteWorkerDispatchHandoffProofAccepted: boolean
  requestedToolPresentInCanonical21: boolean
  requestedCapabilityAcceptedForTool: boolean
  externalBetaApiRouteHandlerControlsSatisfied: boolean
  externalBetaApiRouteHandlerContractReadyWithProvidedEvidence: boolean
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  externalBetaControlledOnDemandReadyTools: 0 | 21
  externalBetaCallableNowTools: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
    0 | 21
  apiRouteHandlerContractReadyToolsWithProvidedEvidence: 0 | 21
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  productionReadyNowTools: 0
  handlerCandidate: AiGraphicsExternalBetaApiRouteHandlerCandidate | null
  policy: {
    sourceControlledHandlerContractOnly: true
    expressRouteMountDeferred: true
    apiRouteRegistryMetadataOnly: true
    validatesCanonical21ToolRequests: true
    requiresApprovedPlanSnapshot: true
    requiresCreditReservation: true
    requiresPrivateArtifactManifest: true
    requiresRateLimitAndCostGuardrail: true
    requiresIdempotencyAndAudit: true
    requiresKillSwitch: true
    forwardsToQueueOnlyInFutureMountedRoute: true
    noRouteExecutionByContractEvaluator: true
    noWorkerEnqueueByContractEvaluator: true
    noToolExecutionByContractEvaluator: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedContractActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteHandlerContractPrepared: true
    sourceExternalBetaControlledOnDemandStatusBridgeAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      boolean
    sourceExternalBetaApiRouteWorkerDispatchHandoffProofAccepted: boolean
    requestedToolPresentInCanonical21: boolean
    requestedCapabilityAcceptedForTool: boolean
    externalBetaApiRouteHandlerControlsSatisfied: boolean
    externalBetaApiRouteHandlerContractReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    controlledOnDemandExternalBetaHandlerReadyWithProvidedEvidence: boolean
    approvedPlanSnapshotAccepted: boolean
    creditReservationAccepted: boolean
    privateArtifactManifestAccepted: boolean
    routeHandlerSourceControlled: boolean
    expressRouteMountDeferred: true
    apiRouteRegistryMetadataOnly: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
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

const policy = {
  sourceControlledHandlerContractOnly: true,
  expressRouteMountDeferred: true,
  apiRouteRegistryMetadataOnly: true,
  validatesCanonical21ToolRequests: true,
  requiresApprovedPlanSnapshot: true,
  requiresCreditReservation: true,
  requiresPrivateArtifactManifest: true,
  requiresRateLimitAndCostGuardrail: true,
  requiresIdempotencyAndAudit: true,
  requiresKillSwitch: true,
  forwardsToQueueOnlyInFutureMountedRoute: true,
  noRouteExecutionByContractEvaluator: true,
  noWorkerEnqueueByContractEvaluator: true,
  noToolExecutionByContractEvaluator: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedContractActions = [
  'read accepted controlled on-demand external-beta status bridge metadata',
  'read accepted API-route-to-worker-dispatch handoff proof metadata',
  'validate one canonical 21-tool external-beta route request shape',
  'validate approved snapshot, credit reservation, idempotency, audit, cost, and private-artifact refs',
  'return a source-controlled route-handler contract response shape for later mounting',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'mounted API route creation',
  'API route execution',
  'direct agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'production worker dispatch',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'production unlock',
]

const nextMilestones = [
  'Mount the external-beta route only after backend route ownership, approved snapshot lookup, credit reservation lookup, and private artifact policy are source-controlled.',
  'Bind the mounted route to the existing AI graphics tool-runtime queue service without bypassing callable request admission.',
  'Run private non-production route-to-queue smoke before any external-beta user traffic.',
  'Keep GPU workers cold until an accepted GPU/model job is claimed, then release GPU resources after completion.',
]

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasPrivateRef(value?: string | null): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  const normalized = value.trim().toLowerCase()
  if (/signed.?url|public:\/\/|https?:\/\/|gcs:\/\//i.test(normalized)) return false
  return (
    normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-runtime://') ||
    normalized.startsWith('external-beta-evidence://') ||
    normalized.startsWith('external-beta-route-handler://')
  )
}

function numberFrom(
  packet: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = packet?.[key]
  const coverage = (packet?.coverage ?? {}) as Record<string, unknown>
  const scope = (packet?.scope ?? {}) as Record<string, unknown>
  const scopedValue = scope[key]
  const coverageValue = coverage[key]
  return typeof value === 'number' ? value :
    typeof coverageValue === 'number' ? coverageValue :
    typeof scopedValue === 'number' ? scopedValue :
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

function statusBridgeAccepted(
  packet?: AiGraphicsExternalBetaControlledOnDemandStatusBridge,
): boolean {
  const source = packet as unknown as Record<string, unknown> | undefined
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION &&
    packet.status ===
      'external_beta_controlled_on_demand_status_bridge_ready_with_warnings' &&
    numberFrom(source, 'totalAiGraphicsTools') === 21 &&
    numberFrom(source, 'totalProductFacingCapabilities') === 12 &&
    numberFrom(source, 'gpuRuntimeTargetedTools') === 8 &&
    numberFrom(source, 'externalBetaControlledOnDemandReadyTools') === 21 &&
    numberFrom(source, 'externalBetaCallableNowTools') === 21 &&
    numberFrom(source, 'runtimeReadyForOnDemandExternalBetaToolCallTools') === 21 &&
    numberFrom(
      source,
      'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence',
    ) === 21 &&
    numberFrom(source, 'productionReadyNowTools') === 0 &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.all21ToolsReadyForControlledOnDemandExternalBetaToolCalls === true &&
    booleanFrom(
      source,
      'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence',
    ) === true &&
    booleanFrom(source, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(source, 'routeExecutionApprovedNow') === false &&
    booleanFrom(source, 'workerExecutionApprovedNow') === false &&
    booleanFrom(source, 'toolExecutionApprovedNow') === false &&
    booleanFrom(source, 'gpuRuntimeShouldStartNow') === false &&
    booleanFrom(source, 'productionReadyNow') === false
}

function routeWorkerDispatchHandoffAccepted(
  packet?: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof,
): boolean {
  const source = packet as unknown as Record<string, unknown> | undefined
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_DISPATCH_HANDOFF_PROOF_DECISION &&
    packet.status ===
      'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked' &&
    booleanFrom(source, 'sourceExternalBetaApiRouteQueueSmokeProofAccepted') === true &&
    booleanFrom(source, 'sourceExternalBetaWorkerDispatchSmokeProofAccepted') === true &&
    booleanFrom(source, 'apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence') === true &&
    numberFrom(source, 'totalAiGraphicsTools') === 21 &&
    (numberFrom(source, 'totalProductFacingCapabilities') === 12 ||
      numberFrom(source, 'productFacingCapabilities') === 12) &&
    numberFrom(source, 'gpuRuntimeTargetedTools') === 8 &&
    (numberFrom(source, 'liveWorkerLeasesCreatedNow') === 0 ||
      numberFrom(source, 'sourceWorkerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence') === 21) &&
    numberFrom(source, 'externalBetaReadyNowTools') === 0 &&
    numberFrom(source, 'productionReadyNowTools') === 0 &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.workerDispatchSmokeNoToolExecutionAcceptedWithProvidedEvidence === true &&
    booleanFrom(source, 'gpuRuntimeShouldStartNow') === false &&
    booleanFrom(source, 'apiRouteExecutionPerformed') === false &&
    booleanFrom(source, 'workerDispatchPerformed') === false &&
    booleanFrom(source, 'toolExecutionPerformed') === false &&
    booleanFrom(source, 'productionReadyNow') === false
}

function missingHandlerControls(
  input: AiGraphicsExternalBetaApiRouteHandlerContractInput,
): string[] {
  return [
    !hasPrivateRef(input.externalBetaApiRouteHandlerRef)
      ? 'external beta API route handler ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerSchemaRef)
      ? 'external beta API route handler schema ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerAuthzRef)
      ? 'external beta API route handler authz ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerApprovedSnapshotResolverRef)
      ? 'external beta approved snapshot resolver ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerCreditReservationResolverRef)
      ? 'external beta credit reservation resolver ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerRateLimitRef)
      ? 'external beta route rate limit ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerCostGuardrailRef)
      ? 'external beta route cost guardrail ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerIdempotencyRef)
      ? 'external beta route idempotency ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerAuditRef)
      ? 'external beta route audit ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerPrivateArtifactPolicyRef)
      ? 'external beta private artifact policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.externalBetaApiRouteHandlerKillSwitchRef)
      ? 'external beta route kill switch ref is missing or not private/backend scoped'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateRequest(
  request?: AiGraphicsExternalBetaApiRouteHandlerRequest,
): {
  requestedToolPresentInCanonical21: boolean
  requestedCapabilityAcceptedForTool: boolean
  requestRefsAccepted: boolean
  requestReasons: string[]
} {
  if (!request) {
    return {
      requestedToolPresentInCanonical21: false,
      requestedCapabilityAcceptedForTool: false,
      requestRefsAccepted: false,
      requestReasons: ['external beta route-handler request is missing'],
    }
  }

  const readiness = getAiGraphicsToolCallReadiness(request.toolId)
  const productionProfile = getAiGraphicsMappedProductionProfile(request.toolId)
  const requestedToolPresentInCanonical21 = Boolean(readiness) &&
    AI_GRAPHICS_CANONICAL_TOOL_IDS.includes(request.toolId as AiGraphicsCanonicalToolId) &&
    Boolean(productionProfile)
  const requestedCapabilityAcceptedForTool = Boolean(readiness?.capabilities.includes(
    request.capabilityId as never,
  )) &&
    request.capabilityId !== 'planning_metadata_only' &&
    request.capabilityId !== 'blocked_or_deferred'

  const requestReasons = [
    request.routeId !== 'ai_graphics_external_beta_tool_call'
      ? 'route id must be ai_graphics_external_beta_tool_call'
      : undefined,
    request.method !== 'POST' ? 'method must be POST' : undefined,
    request.routePath !== '/api/ai-graphics/external-beta/tool-call'
      ? 'route path must be /api/ai-graphics/external-beta/tool-call'
      : undefined,
    !hasValue(request.requestId) ? 'request id is required' : undefined,
    !hasValue(request.workspaceId) ? 'workspace id is required' : undefined,
    !hasValue(request.projectId) ? 'project id is required' : undefined,
    !hasValue(request.approvedPlanSnapshotId)
      ? 'approved plan snapshot id is required'
      : undefined,
    !hasValue(request.creditReservationId)
      ? 'credit reservation id is required'
      : undefined,
    !hasPrivateRef(request.privateArtifactManifestRef)
      ? 'private artifact manifest ref must be private/backend scoped'
      : undefined,
    !hasValue(request.traceId) ? 'trace id is required' : undefined,
    !hasValue(request.idempotencyKey) ? 'idempotency key is required' : undefined,
    !requestedToolPresentInCanonical21
      ? 'requested tool is not in the canonical 21-tool AI graphics registry'
      : undefined,
    !requestedCapabilityAcceptedForTool
      ? 'requested capability is not accepted for the requested tool'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    requestedToolPresentInCanonical21,
    requestedCapabilityAcceptedForTool,
    requestRefsAccepted: requestReasons.length === 0,
    requestReasons,
  }
}

function statusFromInput(input: {
  hasBridge: boolean
  bridgeAccepted: boolean
  hasHandoff: boolean
  handoffAccepted: boolean
  controlsSatisfied: boolean
  requestAccepted: boolean
}): AiGraphicsExternalBetaApiRouteHandlerContractStatus {
  if (!input.hasBridge) {
    return 'missing_external_beta_controlled_on_demand_status_bridge'
  }
  if (!input.bridgeAccepted) {
    return 'external_beta_controlled_on_demand_status_bridge_rejected'
  }
  if (!input.hasHandoff) {
    return 'missing_external_beta_route_worker_dispatch_handoff_proof'
  }
  if (!input.handoffAccepted) {
    return 'external_beta_route_worker_dispatch_handoff_proof_rejected'
  }
  if (!input.controlsSatisfied) {
    return 'missing_external_beta_api_route_handler_controls'
  }
  if (!input.requestAccepted) {
    return 'invalid_requested_tool_or_capability'
  }
  return 'external_beta_api_route_handler_contract_ready_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteHandlerContract(
  input: AiGraphicsExternalBetaApiRouteHandlerContractInput = {},
): AiGraphicsExternalBetaApiRouteHandlerContract {
  const bridgeAccepted = statusBridgeAccepted(
    input.sourceExternalBetaControlledOnDemandStatusBridgePacket,
  )
  const handoffAccepted = routeWorkerDispatchHandoffAccepted(
    input.sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket,
  )
  const missingControls = missingHandlerControls(input)
  const requestValidation = validateRequest(input.request)
  const controlsSatisfied = missingControls.length === 0
  const requestAccepted = requestValidation.requestRefsAccepted
  const status = statusFromInput({
    hasBridge: Boolean(input.sourceExternalBetaControlledOnDemandStatusBridgePacket),
    bridgeAccepted,
    hasHandoff: Boolean(input.sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket),
    handoffAccepted,
    controlsSatisfied,
    requestAccepted,
  })
  const accepted =
    status === 'external_beta_api_route_handler_contract_ready_runtime_still_blocked'
  const request = input.request
  const readiness = request ? getAiGraphicsToolCallReadiness(request.toolId) : undefined
  const productionProfile = request
    ? getAiGraphicsMappedProductionProfile(request.toolId)
    : undefined
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    Boolean(readiness?.gpuRequiredForRuntime)
  const handlerCandidate = accepted && request && readiness && productionProfile
    ? {
        handlerId: 'ai_graphics_external_beta_tool_call_handler_contract',
        routeId: request.routeId,
        method: request.method,
        routePath: request.routePath,
        toolId: readiness.toolId,
        productionToolId: productionProfile.toolId,
        capabilityId: request.capabilityId,
        workerType: readiness.productionWorkerType,
        runtimeTarget: readiness.runtimeTarget,
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        approvedPlanSnapshotId: request.approvedPlanSnapshotId,
        creditReservationId: request.creditReservationId,
        privateArtifactManifestRef: request.privateArtifactManifestRef,
        requestId: request.requestId,
        traceId: request.traceId,
        idempotencyKey: request.idempotencyKey,
        responseMode:
          'accepted_for_controlled_on_demand_external_beta_queue_contract_route_not_mounted',
        responseStatusIfMounted: 202,
        routeHandlerSourceControlled: true,
        routeHandlerPreparedWithProvidedEvidence: true,
        routeHandlerMountedInExpressNow: false,
        apiRouteRegistryMountedNow: false,
        apiRouteExecutionApprovedNow: false,
        routeExecutionApprovedNow: false,
        workerQueueApprovedNow: false,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
        gpuRuntimeShouldStartNow: false,
        publicArtifactCreated: false,
        signedUrlCreated: false,
      } satisfies AiGraphicsExternalBetaApiRouteHandlerCandidate
    : null

  const rejectionReasons = [
    !input.sourceExternalBetaControlledOnDemandStatusBridgePacket
      ? 'accepted controlled on-demand status bridge packet is missing'
      : undefined,
    input.sourceExternalBetaControlledOnDemandStatusBridgePacket && !bridgeAccepted
      ? 'controlled on-demand status bridge packet is not accepted'
      : undefined,
    bridgeAccepted && !input.sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket
      ? 'accepted API route worker-dispatch handoff proof packet is missing'
      : undefined,
    input.sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket &&
        !handoffAccepted
      ? 'API route worker-dispatch handoff proof packet is not accepted'
      : undefined,
    ...missingControls,
    ...requestValidation.requestReasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_CONTRACT_DECISION,
    sourceExternalBetaControlledOnDemandStatusBridgeDecision:
      input.sourceExternalBetaControlledOnDemandStatusBridgePacket?.decision ?? null,
    sourceExternalBetaApiRouteWorkerDispatchHandoffProofDecision:
      input.sourceExternalBetaApiRouteWorkerDispatchHandoffProofPacket?.decision ?? null,
    status,
    rejectionReasons,
    missingHandlerControls: missingControls,
    requestedToolId: request?.toolId ?? null,
    requestedCapabilityId: request?.capabilityId ?? null,
    sourceExternalBetaControlledOnDemandStatusBridgeAccepted: bridgeAccepted,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      bridgeAccepted,
    sourceExternalBetaApiRouteWorkerDispatchHandoffProofAccepted: handoffAccepted,
    requestedToolPresentInCanonical21:
      requestValidation.requestedToolPresentInCanonical21,
    requestedCapabilityAcceptedForTool:
      requestValidation.requestedCapabilityAcceptedForTool,
    externalBetaApiRouteHandlerControlsSatisfied: controlsSatisfied,
    externalBetaApiRouteHandlerContractReadyWithProvidedEvidence: accepted,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: listAiGraphicsGpuRuntimeRequiredTools().length as 8,
    externalBetaControlledOnDemandReadyTools: bridgeAccepted ? 21 : 0,
    externalBetaCallableNowTools: bridgeAccepted ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      bridgeAccepted ? 21 : 0,
    apiRouteHandlerContractReadyToolsWithProvidedEvidence: accepted ? 21 : 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    productionReadyNowTools: 0,
    handlerCandidate,
    policy,
    allowedContractActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteHandlerContractPrepared: true,
      sourceExternalBetaControlledOnDemandStatusBridgeAccepted: bridgeAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        bridgeAccepted,
      sourceExternalBetaApiRouteWorkerDispatchHandoffProofAccepted: handoffAccepted,
      requestedToolPresentInCanonical21:
        requestValidation.requestedToolPresentInCanonical21,
      requestedCapabilityAcceptedForTool:
        requestValidation.requestedCapabilityAcceptedForTool,
      externalBetaApiRouteHandlerControlsSatisfied: controlsSatisfied,
      externalBetaApiRouteHandlerContractReadyWithProvidedEvidence: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      controlledOnDemandExternalBetaHandlerReadyWithProvidedEvidence: accepted,
      approvedPlanSnapshotAccepted: Boolean(request && hasValue(request.approvedPlanSnapshotId)),
      creditReservationAccepted: Boolean(request && hasValue(request.creditReservationId)),
      privateArtifactManifestAccepted:
        Boolean(request && hasPrivateRef(request.privateArtifactManifestRef)),
      routeHandlerSourceControlled: accepted,
      expressRouteMountDeferred: true,
      apiRouteRegistryMetadataOnly: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
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
