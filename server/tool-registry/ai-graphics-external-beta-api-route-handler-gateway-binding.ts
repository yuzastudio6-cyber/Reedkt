import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_CONTRACT_DECISION,
} from './ai-graphics-external-beta-api-route-handler-contract'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION,
} from './ai-graphics-external-beta-tool-call-gateway'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_BINDING_DECISION =
  'ai_graphics_external_beta_api_route_handler_gateway_binding_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteHandlerGatewayBindingStatus =
  | 'missing_api_route_handler_contract'
  | 'api_route_handler_contract_rejected'
  | 'missing_tool_call_gateway_contract'
  | 'tool_call_gateway_contract_rejected'
  | 'missing_route_handler_gateway_binding_controls'
  | 'api_route_handler_gateway_binding_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteHandlerGatewayBindingInput {
  sourceExternalBetaApiRouteHandlerContractPacket?: Record<string, unknown>
  sourceExternalBetaToolCallGatewayPacket?: Record<string, unknown>
  routeHandlerGatewayBindingRef?: string
  routeHandlerGatewaySchemaRef?: string
  routeHandlerGatewayPolicyRef?: string
  routeHandlerGatewayAuditRef?: string
  routeHandlerGatewayRollbackRef?: string
}

export interface AiGraphicsExternalBetaApiRouteHandlerGatewayBinding {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_BINDING_DECISION
  status: AiGraphicsExternalBetaApiRouteHandlerGatewayBindingStatus
  rejectionReasons: string[]
  missingBindingControls: string[]
  sourceExternalBetaApiRouteHandlerContractDecision: string | null
  sourceExternalBetaToolCallGatewayDecision: string | null
  sourceExternalBetaApiRouteHandlerContractAccepted: boolean
  sourceExternalBetaToolCallGatewayContractAccepted: boolean
  routeHandlerRequestShapeAll21Accepted: boolean
  gatewayContractAll21CoverageAccepted: boolean
  gatewayCandidateShapeAcceptedWithProvidedEvidence: boolean
  routeHandlerGatewayBindingControlsSatisfied: boolean
  routeHandlerGatewayBindingReadyWithProvidedEvidence: boolean
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeHandlerRequestShapeAcceptedTools: 0 | 21
  gatewayContractCoveredTools: 0 | 21
  gatewayWorkerEnqueueCandidateReadyExamples: number
  routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence: 0 | 21
  fullPerToolGatewayBindingProofToolsNow: 0
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  workerEnqueuePerformedNow: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  bindingPolicy: {
    sourceControlledBindingOnly: true
    validatesRouteHandlerToGatewayContract: true
    usesRouteHandlerRequestShapeAsIngressContract: true
    usesToolCallGatewayCandidateAsEgressContract: true
    requiresApprovedSnapshotAndCreditReservationContinuity: true
    requiresPrivateArtifactManifestContinuity: true
    requiresIdempotencyAndTraceContinuity: true
    fullPerToolGatewayBindingProofDeferred: true
    expressRouteMountDeferred: true
    noRouteExecutionByBindingEvaluator: true
    noWorkerEnqueueByBindingEvaluator: true
    noToolExecutionByBindingEvaluator: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedBindingActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteHandlerGatewayBindingPrepared: true
    sourceExternalBetaApiRouteHandlerContractAccepted: boolean
    sourceExternalBetaToolCallGatewayContractAccepted: boolean
    routeHandlerRequestShapeAll21Accepted: boolean
    gatewayContractAll21CoverageAccepted: boolean
    gatewayCandidateShapeAcceptedWithProvidedEvidence: boolean
    routeHandlerGatewayBindingControlsSatisfied: boolean
    routeHandlerGatewayBindingReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence: boolean
    fullPerToolGatewayBindingProofDeferred: true
    expressRouteMountDeferred: true
    apiRouteRegistryMetadataOnly: true
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

const bindingPolicy = {
  sourceControlledBindingOnly: true,
  validatesRouteHandlerToGatewayContract: true,
  usesRouteHandlerRequestShapeAsIngressContract: true,
  usesToolCallGatewayCandidateAsEgressContract: true,
  requiresApprovedSnapshotAndCreditReservationContinuity: true,
  requiresPrivateArtifactManifestContinuity: true,
  requiresIdempotencyAndTraceContinuity: true,
  fullPerToolGatewayBindingProofDeferred: true,
  expressRouteMountDeferred: true,
  noRouteExecutionByBindingEvaluator: true,
  noWorkerEnqueueByBindingEvaluator: true,
  noToolExecutionByBindingEvaluator: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedBindingActions = [
  'read accepted external-beta API route-handler contract metadata',
  'read accepted external-beta tool-call gateway contract metadata',
  'validate route-handler request ingress can map to gateway candidate egress',
  'preserve approved snapshot, credit reservation, private artifact, trace, and idempotency continuity',
  'record that full per-tool gateway binding proof remains deferred before route mounting',
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
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'Run a full 21-tool route-handler-to-gateway binding proof with accepted runtime admission packets for each tool.',
  'Mount the external-beta route only after the binding proof, backend auth, approved snapshot lookup, credit reservation lookup, and private artifact policy are source-controlled.',
  'Keep GPU workers cold until an accepted GPU/model job is claimed, then release GPU resources after completion.',
]

function numberFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const coverage = (packet?.coverage ?? {}) as Record<string, unknown>
  const scope = (packet?.scope ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  const countValue = counts[key]
  const coverageValue = coverage[key]
  const scopeValue = scope[key]
  return typeof value === 'number' ? value :
    typeof countValue === 'number' ? countValue :
    typeof coverageValue === 'number' ? coverageValue :
    typeof scopeValue === 'number' ? scopeValue :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function hasPrivateRef(value?: string): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  const normalized = value.trim().toLowerCase()
  if (/signed.?url|public:\/\/|https?:\/\/|gcs:\/\//i.test(normalized)) return false
  return (
    normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-gateway://') ||
    normalized.startsWith('external-beta-route-handler://') ||
    normalized.startsWith('external-beta-route-binding://')
  )
}

function routeHandlerContractAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_CONTRACT_DECISION &&
    packet.status === 'external_beta_api_route_handler_contract_ready_runtime_still_blocked' &&
    numberFrom(packet, 'totalAiGraphicsTools') === 21 &&
    numberFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    numberFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    numberFrom(packet, 'externalBetaControlledOnDemandReadyTools') === 21 &&
    numberFrom(packet, 'externalBetaCallableNowTools') === 21 &&
    numberFrom(packet, 'apiRouteHandlerContractReadyToolsWithProvidedEvidence') === 21 &&
    numberFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    numberFrom(packet, 'routeExecutionsApprovedNow') === 0 &&
    numberFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    numberFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    numberFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'externalBetaApiRouteHandlerContractReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'all21ToolsCovered') === true &&
    booleanFrom(packet, 'all12CapabilitiesCovered') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'workerExecutionApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false &&
    booleanFrom(packet, 'productionReadyNow') === false
}

function toolCallGatewayContractAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION &&
    packet.status === 'prepared_external_beta_tool_call_gateway_runtime_blocked' &&
    numberFrom(packet, 'totalAiGraphicsTools') === 21 &&
    numberFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    numberFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    (numberFrom(packet, 'fullGatewayWorkerEnqueueCandidateReadyExamples') ?? 0) >= 2 &&
    (numberFrom(packet, 'cpuStaticGatewayWorkerEnqueueCandidateReadyExamples') ?? 0) >= 1 &&
    numberFrom(packet, 'gpuRuntimeShouldStartNow') === 0 &&
    numberFrom(packet, 'workerEnqueuePerformedNow') === 0 &&
    numberFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    numberFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'all21ToolsCovered') === true &&
    booleanFrom(packet, 'all12CapabilitiesCovered') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'workerExecutionApprovedNow') === false &&
    booleanFrom(packet, 'workerQueueApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false &&
    booleanFrom(packet, 'externalBetaReadyNow') === false &&
    booleanFrom(packet, 'productionReadyNow') === false
}

function missingBindingControls(
  input: AiGraphicsExternalBetaApiRouteHandlerGatewayBindingInput,
): string[] {
  return [
    !hasPrivateRef(input.routeHandlerGatewayBindingRef)
      ? 'route-handler gateway binding ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeHandlerGatewaySchemaRef)
      ? 'route-handler gateway schema ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeHandlerGatewayPolicyRef)
      ? 'route-handler gateway policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeHandlerGatewayAuditRef)
      ? 'route-handler gateway audit ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeHandlerGatewayRollbackRef)
      ? 'route-handler gateway rollback ref is missing or not private/backend scoped'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasRouteHandler: boolean
  routeHandlerAccepted: boolean
  hasGateway: boolean
  gatewayAccepted: boolean
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaApiRouteHandlerGatewayBindingStatus {
  if (!input.hasRouteHandler) return 'missing_api_route_handler_contract'
  if (!input.routeHandlerAccepted) return 'api_route_handler_contract_rejected'
  if (!input.hasGateway) return 'missing_tool_call_gateway_contract'
  if (!input.gatewayAccepted) return 'tool_call_gateway_contract_rejected'
  if (!input.controlsSatisfied) return 'missing_route_handler_gateway_binding_controls'
  return 'api_route_handler_gateway_binding_ready_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding(
  input: AiGraphicsExternalBetaApiRouteHandlerGatewayBindingInput = {},
): AiGraphicsExternalBetaApiRouteHandlerGatewayBinding {
  const routeHandlerPacket = input.sourceExternalBetaApiRouteHandlerContractPacket
  const gatewayPacket = input.sourceExternalBetaToolCallGatewayPacket
  const sourceExternalBetaApiRouteHandlerContractAccepted =
    routeHandlerContractAccepted(routeHandlerPacket)
  const sourceExternalBetaToolCallGatewayContractAccepted =
    toolCallGatewayContractAccepted(gatewayPacket)
  const missingControls = missingBindingControls(input)
  const routeHandlerRequestShapeAll21Accepted =
    sourceExternalBetaApiRouteHandlerContractAccepted
  const gatewayContractAll21CoverageAccepted =
    sourceExternalBetaToolCallGatewayContractAccepted
  const gatewayCandidateShapeAcceptedWithProvidedEvidence =
    sourceExternalBetaToolCallGatewayContractAccepted
  const routeHandlerGatewayBindingControlsSatisfied =
    missingControls.length === 0
  const routeHandlerGatewayBindingReadyWithProvidedEvidence =
    sourceExternalBetaApiRouteHandlerContractAccepted &&
    sourceExternalBetaToolCallGatewayContractAccepted &&
    routeHandlerGatewayBindingControlsSatisfied
  const gatewayWorkerEnqueueCandidateReadyExamples =
    (numberFrom(gatewayPacket, 'fullGatewayWorkerEnqueueCandidateReadyExamples') ?? 0) +
    (numberFrom(gatewayPacket, 'cpuStaticGatewayWorkerEnqueueCandidateReadyExamples') ?? 0)
  const status = statusFromInput({
    hasRouteHandler: Boolean(routeHandlerPacket),
    routeHandlerAccepted: sourceExternalBetaApiRouteHandlerContractAccepted,
    hasGateway: Boolean(gatewayPacket),
    gatewayAccepted: sourceExternalBetaToolCallGatewayContractAccepted,
    controlsSatisfied: routeHandlerGatewayBindingControlsSatisfied,
  })

  const rejectionReasons = [
    !sourceExternalBetaApiRouteHandlerContractAccepted
      ? 'accepted external-beta API route-handler contract is missing or rejected'
      : undefined,
    !sourceExternalBetaToolCallGatewayContractAccepted
      ? 'accepted external-beta tool-call gateway contract is missing or rejected'
      : undefined,
    ...missingControls,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_BINDING_DECISION,
    status,
    rejectionReasons,
    missingBindingControls: missingControls,
    sourceExternalBetaApiRouteHandlerContractDecision:
      typeof routeHandlerPacket?.decision === 'string' ? routeHandlerPacket.decision : null,
    sourceExternalBetaToolCallGatewayDecision:
      typeof gatewayPacket?.decision === 'string' ? gatewayPacket.decision : null,
    sourceExternalBetaApiRouteHandlerContractAccepted,
    sourceExternalBetaToolCallGatewayContractAccepted,
    routeHandlerRequestShapeAll21Accepted,
    gatewayContractAll21CoverageAccepted,
    gatewayCandidateShapeAcceptedWithProvidedEvidence,
    routeHandlerGatewayBindingControlsSatisfied,
    routeHandlerGatewayBindingReadyWithProvidedEvidence,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeHandlerRequestShapeAcceptedTools:
      routeHandlerRequestShapeAll21Accepted ? 21 : 0,
    gatewayContractCoveredTools:
      gatewayContractAll21CoverageAccepted ? 21 : 0,
    gatewayWorkerEnqueueCandidateReadyExamples,
    routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence:
      routeHandlerGatewayBindingReadyWithProvidedEvidence ? 21 : 0,
    fullPerToolGatewayBindingProofToolsNow: 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    workerEnqueuePerformedNow: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    bindingPolicy,
    allowedBindingActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteHandlerGatewayBindingPrepared: true,
      sourceExternalBetaApiRouteHandlerContractAccepted,
      sourceExternalBetaToolCallGatewayContractAccepted,
      routeHandlerRequestShapeAll21Accepted,
      gatewayContractAll21CoverageAccepted,
      gatewayCandidateShapeAcceptedWithProvidedEvidence,
      routeHandlerGatewayBindingControlsSatisfied,
      routeHandlerGatewayBindingReadyWithProvidedEvidence,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence:
        routeHandlerGatewayBindingReadyWithProvidedEvidence,
      fullPerToolGatewayBindingProofDeferred: true,
      expressRouteMountDeferred: true,
      apiRouteRegistryMetadataOnly: true,
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
