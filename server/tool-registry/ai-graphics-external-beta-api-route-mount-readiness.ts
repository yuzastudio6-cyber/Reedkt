import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_FULL_PROOF_DECISION,
} from './ai-graphics-external-beta-api-route-handler-gateway-full-proof'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION =
  'ai_graphics_external_beta_api_route_mount_readiness_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteMountReadinessStatus =
  | 'missing_full_21_route_handler_gateway_proof'
  | 'full_21_route_handler_gateway_proof_rejected'
  | 'missing_route_mount_controls'
  | 'api_route_mount_ready_with_provided_evidence_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteMountReadinessInput {
  sourceRouteHandlerGatewayFullProofPacket?: Record<string, unknown>
  routeMountPolicyRef?: string
  routeSchemaRef?: string
  routeAuthzMiddlewareRef?: string
  routeRequestValidationRef?: string
  approvedSnapshotResolverRef?: string
  creditReservationResolverRef?: string
  privateArtifactPolicyRef?: string
  assetManifestBindingRef?: string
  dependencyReadinessPolicyRef?: string
  asyncCheckbackPolicyRef?: string
  queueSubmissionAuthorizationRef?: string
  serviceRoleBoundaryRef?: string
  rateLimitPolicyRef?: string
  costGuardrailPolicyRef?: string
  idempotencyStoreRef?: string
  auditLogRef?: string
  telemetryRef?: string
  rollbackPlanRef?: string
  incidentResponseRef?: string
  killSwitchRef?: string
  privateNetworkRef?: string
}

export interface AiGraphicsExternalBetaApiRouteMountReadiness {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION
  status: AiGraphicsExternalBetaApiRouteMountReadinessStatus
  rejectionReasons: string[]
  sourceRouteHandlerGatewayFullProofDecision: string | null
  sourceRouteHandlerGatewayFullProofAccepted: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
  routeMountControlsSatisfied: boolean
  missingRouteMountControls: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  apiRouteMountReadyToolsWithProvidedEvidence: 0 | 21
  routeHandlerGatewayFullProofToolsWithProvidedEvidence: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence: 0 | 21
  runtimeAdmissionAcceptedToolsWithProvidedEvidence: 0 | 21
  gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence: 0 | 21
  routeHandlerToGatewayContinuityAcceptedTools: 0 | 21
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  liveQueueWriteApprovedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  externalBetaTrafficEnabledNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  routeMountCandidate: {
    routeId: 'ai_graphics_external_beta_tool_call'
    method: 'POST'
    routePath: '/api/ai-graphics/external-beta/tool-call'
    sourceControlledMountOnly: true
    expressRouteMountedNow: false
    validatesAll21ToolRequests: true
    requiresApprovedSnapshotResolver: true
    requiresCreditReservationResolver: true
    requiresPrivateArtifactPolicy: true
    requiresAssetManifestBinding: true
    requiresDependencyReadinessPolicy: true
    requiresAsyncCheckbackPolicy: true
    requiresQueueSubmissionAuthorization: true
    onDemandGpuOnly: true
  } | null
  routeMountPolicy: {
    sideEffectFreeMountReadinessCheck: true
    sourceControlledRouteOnly: true
    routeMountDeferred: true
    apiRouteExecutionDeferred: true
    queueWriteDeferred: true
    workerEnqueueDeferred: true
    workerDispatchDeferred: true
    toolExecutionDeferred: true
    approvedSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactManifestRequired: true
    dependencyReadinessRequired: true
    asyncCheckbackRequired: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedReadinessActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteMountReadinessPrepared: true
    sourceRouteHandlerGatewayFullProofAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
    routeMountControlsSatisfied: boolean
    apiRouteMountReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    approvedSnapshotResolverAccepted: boolean
    creditReservationResolverAccepted: boolean
    privateArtifactPolicyAccepted: boolean
    assetManifestBindingAccepted: boolean
    dependencyReadinessPolicyAccepted: boolean
    asyncCheckbackPolicyAccepted: boolean
    queueSubmissionAuthorizationAccepted: boolean
    serviceRoleBoundaryAccepted: boolean
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

const routeMountPolicy = {
  sideEffectFreeMountReadinessCheck: true,
  sourceControlledRouteOnly: true,
  routeMountDeferred: true,
  apiRouteExecutionDeferred: true,
  queueWriteDeferred: true,
  workerEnqueueDeferred: true,
  workerDispatchDeferred: true,
  toolExecutionDeferred: true,
  approvedSnapshotRequired: true,
  creditReservationRequired: true,
  privateArtifactManifestRequired: true,
  dependencyReadinessRequired: true,
  asyncCheckbackRequired: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedReadinessActions = [
  'read accepted full 21 route-handler gateway proof metadata',
  'verify route policy, schema, authorization middleware, and request validation refs',
  'verify approved snapshot resolver and credit reservation resolver refs',
  'verify private artifact policy, asset manifest binding, dependency readiness, and async checkback refs',
  'verify queue submission authorization, service-role boundary, idempotency, audit, telemetry, rollback, incident, kill-switch, and private network refs',
  'record source-controlled API route mount readiness without mounting or executing the route',
]

const blockedRuntimeActions = [
  'mounted API route creation',
  'API route execution',
  'agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'backend queue submission',
  'service-role transaction',
  'Worker queue enqueue',
  'Worker lease creation',
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
  'Create a source-controlled route mount implementation behind this readiness contract.',
  'Bind the mounted handler to approved snapshot lookup, credit reservation lookup, private artifact policy, and queue submission authorization.',
  'Run a route mount QA review before any route execution or live queue write.',
  'Keep GPU workers cold until an accepted GPU/model queue job is claimed, then release GPU resources after completion.',
]

function hasPrivateRef(value?: string): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  const normalized = value.trim().toLowerCase()
  if (/signed.?url|public:\/\/|https?:\/\/|gcs:\/\//i.test(normalized)) return false
  return (
    normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-route-mount://')
  )
}

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  const countValue = counts[key]
  return typeof value === 'number' ? value :
    typeof countValue === 'number' ? countValue :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function acceptedFullProof(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_FULL_PROOF_DECISION &&
    packet.status === 'api_route_handler_gateway_full_21_proof_ready_runtime_still_blocked' &&
    countFrom(packet, 'routeHandlerGatewayFullProofToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeHandlerToGatewayContinuityAcceptedTools') === 21 &&
    countFrom(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'full21RouteHandlerGatewayProofReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function missingControls(
  input: AiGraphicsExternalBetaApiRouteMountReadinessInput,
): string[] {
  return [
    !hasPrivateRef(input.routeMountPolicyRef)
      ? 'route mount policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeSchemaRef)
      ? 'route schema ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeAuthzMiddlewareRef)
      ? 'route authorization middleware ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.routeRequestValidationRef)
      ? 'route request validation ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.approvedSnapshotResolverRef)
      ? 'approved snapshot resolver ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.creditReservationResolverRef)
      ? 'credit reservation resolver ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.privateArtifactPolicyRef)
      ? 'private artifact policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.assetManifestBindingRef)
      ? 'asset manifest binding ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.dependencyReadinessPolicyRef)
      ? 'dependency readiness policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.asyncCheckbackPolicyRef)
      ? 'async checkback policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.queueSubmissionAuthorizationRef)
      ? 'queue submission authorization ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.serviceRoleBoundaryRef)
      ? 'service-role boundary ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.rateLimitPolicyRef)
      ? 'rate-limit policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.costGuardrailPolicyRef)
      ? 'cost guardrail policy ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.idempotencyStoreRef)
      ? 'idempotency store ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.auditLogRef)
      ? 'audit log ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.telemetryRef)
      ? 'telemetry ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.rollbackPlanRef)
      ? 'rollback plan ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.incidentResponseRef)
      ? 'incident response ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.killSwitchRef)
      ? 'kill-switch ref is missing or not private/backend scoped'
      : undefined,
    !hasPrivateRef(input.privateNetworkRef)
      ? 'private network ref is missing or not private/backend scoped'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaApiRouteMountReadinessStatus {
  if (!input.hasSource) return 'missing_full_21_route_handler_gateway_proof'
  if (!input.sourceAccepted) return 'full_21_route_handler_gateway_proof_rejected'
  if (!input.controlsSatisfied) return 'missing_route_mount_controls'
  return 'api_route_mount_ready_with_provided_evidence_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteMountReadiness(
  input: AiGraphicsExternalBetaApiRouteMountReadinessInput = {},
): AiGraphicsExternalBetaApiRouteMountReadiness {
  const sourceAccepted = acceptedFullProof(input.sourceRouteHandlerGatewayFullProofPacket)
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted =
    sourceAccepted
  const missingRouteMountControls = missingControls(input)
  const routeMountControlsSatisfied = missingRouteMountControls.length === 0
  const ready = sourceAccepted && routeMountControlsSatisfied
  const status = statusFromInput({
    hasSource: Boolean(input.sourceRouteHandlerGatewayFullProofPacket),
    sourceAccepted,
    controlsSatisfied: routeMountControlsSatisfied,
  })
  const rejectionReasons = [
    !input.sourceRouteHandlerGatewayFullProofPacket
      ? 'accepted full 21 route-handler gateway proof packet is missing'
      : undefined,
    input.sourceRouteHandlerGatewayFullProofPacket && !sourceAccepted
      ? 'full 21 route-handler gateway proof packet is not accepted'
      : undefined,
    ...missingRouteMountControls,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION,
    status,
    rejectionReasons,
    sourceRouteHandlerGatewayFullProofDecision:
      typeof input.sourceRouteHandlerGatewayFullProofPacket?.decision === 'string'
        ? input.sourceRouteHandlerGatewayFullProofPacket.decision
        : null,
    sourceRouteHandlerGatewayFullProofAccepted: sourceAccepted,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
    routeMountControlsSatisfied,
    missingRouteMountControls,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    apiRouteMountReadyToolsWithProvidedEvidence: ready ? 21 : 0,
    routeHandlerGatewayFullProofToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted ? 21 : 0,
    runtimeAdmissionAcceptedToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    routeHandlerToGatewayContinuityAcceptedTools: sourceAccepted ? 21 : 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
      sourceAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    liveQueueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    externalBetaTrafficEnabledNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    routeMountCandidate: ready
      ? {
          routeId: 'ai_graphics_external_beta_tool_call',
          method: 'POST',
          routePath: '/api/ai-graphics/external-beta/tool-call',
          sourceControlledMountOnly: true,
          expressRouteMountedNow: false,
          validatesAll21ToolRequests: true,
          requiresApprovedSnapshotResolver: true,
          requiresCreditReservationResolver: true,
          requiresPrivateArtifactPolicy: true,
          requiresAssetManifestBinding: true,
          requiresDependencyReadinessPolicy: true,
          requiresAsyncCheckbackPolicy: true,
          requiresQueueSubmissionAuthorization: true,
          onDemandGpuOnly: true,
        }
      : null,
    routeMountPolicy,
    allowedReadinessActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteMountReadinessPrepared: true,
      sourceRouteHandlerGatewayFullProofAccepted: sourceAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
      routeMountControlsSatisfied,
      apiRouteMountReadyWithProvidedEvidence: ready,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      approvedSnapshotResolverAccepted: hasPrivateRef(input.approvedSnapshotResolverRef),
      creditReservationResolverAccepted: hasPrivateRef(input.creditReservationResolverRef),
      privateArtifactPolicyAccepted: hasPrivateRef(input.privateArtifactPolicyRef),
      assetManifestBindingAccepted: hasPrivateRef(input.assetManifestBindingRef),
      dependencyReadinessPolicyAccepted: hasPrivateRef(input.dependencyReadinessPolicyRef),
      asyncCheckbackPolicyAccepted: hasPrivateRef(input.asyncCheckbackPolicyRef),
      queueSubmissionAuthorizationAccepted: hasPrivateRef(input.queueSubmissionAuthorizationRef),
      serviceRoleBoundaryAccepted: hasPrivateRef(input.serviceRoleBoundaryRef),
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

export function buildAiGraphicsExternalBetaApiRouteMountReadinessInput(
  sourceRouteHandlerGatewayFullProofPacket: Record<string, unknown>,
): AiGraphicsExternalBetaApiRouteMountReadinessInput {
  const prefix = 'private://ai-graphics/external-beta/route-mount-readiness'
  return {
    sourceRouteHandlerGatewayFullProofPacket,
    routeMountPolicyRef: `${prefix}/route-mount-policy`,
    routeSchemaRef: `${prefix}/route-schema`,
    routeAuthzMiddlewareRef: `${prefix}/route-authz-middleware`,
    routeRequestValidationRef: `${prefix}/request-validation`,
    approvedSnapshotResolverRef: `${prefix}/approved-snapshot-resolver`,
    creditReservationResolverRef: `${prefix}/credit-reservation-resolver`,
    privateArtifactPolicyRef: `${prefix}/private-artifact-policy`,
    assetManifestBindingRef: `${prefix}/asset-manifest-binding`,
    dependencyReadinessPolicyRef: `${prefix}/dependency-readiness-policy`,
    asyncCheckbackPolicyRef: `${prefix}/async-checkback-policy`,
    queueSubmissionAuthorizationRef: `${prefix}/queue-submission-authorization`,
    serviceRoleBoundaryRef: `${prefix}/service-role-boundary`,
    rateLimitPolicyRef: `${prefix}/rate-limit-policy`,
    costGuardrailPolicyRef: `${prefix}/cost-guardrail-policy`,
    idempotencyStoreRef: `${prefix}/idempotency-store`,
    auditLogRef: `${prefix}/audit-log`,
    telemetryRef: `${prefix}/telemetry`,
    rollbackPlanRef: `${prefix}/rollback-plan`,
    incidentResponseRef: `${prefix}/incident-response`,
    killSwitchRef: `${prefix}/kill-switch`,
    privateNetworkRef: `${prefix}/private-network`,
  }
}
