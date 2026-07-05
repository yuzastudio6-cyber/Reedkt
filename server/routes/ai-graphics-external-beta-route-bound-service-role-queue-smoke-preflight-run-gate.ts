import {
  AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_BRIDGE_DECISION,
} from './ai-graphics-external-beta-route-bound-service-role-queue-smoke-authorization-bridge'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-preflight'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_RUN_GATE_DECISION =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_preflight_run_gate_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateStatus =
  | 'missing_route_bound_service_role_queue_smoke_authorization_bridge_packet'
  | 'route_bound_service_role_queue_smoke_authorization_bridge_rejected'
  | 'missing_service_role_queue_smoke_preflight_packet'
  | 'service_role_queue_smoke_preflight_rejected'
  | 'missing_required_route_bound_operator_refs'
  | 'route_bound_service_role_queue_smoke_preflight_run_gate_candidate_rejected'
  | 'route_bound_service_role_queue_smoke_preflight_run_gate_ready_execution_still_blocked'

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateInput {
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket?: Record<string, unknown>
  sourceServiceRoleQueueSmokePreflightPacket?: Record<string, unknown>
  routeBoundServiceRoleQueueSmokeRunGateRef?: string
  routeBoundServiceRoleQueueSmokeOperatorRef?: string
  routeBoundServiceRoleQueueSmokeReadinessRef?: string
  routeBoundServiceRoleQueueSmokePreflightRef?: string
  routeBoundServiceRoleQueueSmokeEnvironmentRef?: string
  routeBoundServiceRoleQueueSmokeRouteExecutionWindowRef?: string
  routeBoundServiceRoleQueueSmokeQueueWriteWindowRef?: string
  routeBoundServiceRoleQueueSmokeCleanupPlanRef?: string
  routeBoundServiceRoleQueueSmokeRollbackPlanRef?: string
  routeBoundServiceRoleQueueSmokeTelemetryRef?: string
  routeBoundServiceRoleQueueSmokeCostCeilingRef?: string
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateCandidate {
  gateId: string
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeId: string
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  method: 'POST'
  queueName: 'ai_graphics_external_beta_tool_runtime'
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'prepared_not_submitted'
  runtimeTarget: string
  workerType: string
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted: true
  sourceServiceRoleQueueSmokePreflightAccepted: true
  runGateMode:
    'route_bound_service_role_queue_smoke_preflight_ready_execution_still_blocked'
  requiresExplicitOperatorConfirmation: true
  requiresNonProductionEnvironment: true
  requiresServerOnlyServiceRoleCredentials: true
  requiresRouteExecutionWindow: true
  requiresQueueWriteWindow: true
  requiresCleanupPlan: true
  requiresRollbackPlan: true
  requiresTelemetry: true
  requiresCostCeiling: true
  executeCommandTemplate: string
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteMountedNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionPerformed: false
  routeBoundServiceRoleQueueSmokeRunApprovedNow: false
  serviceRoleQueueSmokeApprovedNow: false
  serviceRoleQueueSmokePerformed: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  serviceRoleQueueTransactionApprovedNow: false
  serviceRoleTransactionPerformed: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformed: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchApprovedNow: false
  workerDispatchPerformed: false
  toolExecutionApprovedNow: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGate {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_RUN_GATE_DECISION
  status: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateStatus
  rejectionReasons: string[]
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeDecision: string | null
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted: boolean
  sourceServiceRoleQueueSmokePreflightDecision: string | null
  sourceServiceRoleQueueSmokePreflightAccepted: boolean
  requiredRunGateRefs: Record<string, boolean>
  missingRunGateRefs: string[]
  routeBoundServiceRoleQueueSmokePreflightRunGateCandidates:
    AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateCandidate[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceServiceRoleQueueSmokePreflightReadyToolsWithProvidedEvidence: 0 | 21
  routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence: 0 | 21
  cpuStaticRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence: 0 | 13
  gpuModelRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence: 0 | 8
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  routeBoundServiceRoleQueueSmokeRunApprovedNowTools: 0
  serviceRoleQueueSmokeApprovedNowTools: 0
  serviceRoleQueueSmokesPerformedNowTools: 0
  backendQueueSubmissionApprovedNowTools: 0
  serviceRoleQueueTransactionApprovedNowTools: 0
  liveQueueWriteApprovedNowTools: 0
  liveQueueWritesPerformedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  routeBoundServiceRoleQueueSmokePreflightRunGatePolicy: {
    privateRouteBoundServiceRoleQueueSmokePreflightRunGateOnly: true
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeRequired: true
    sourceServiceRoleQueueSmokePreflightRequired: true
    explicitOperatorConfirmationRequired: true
    nonProductionEnvironmentRequired: true
    serverOnlyServiceRoleCredentialsRequired: true
    routeExecutionWindowRequired: true
    queueWriteWindowRequired: true
    cleanupPlanRequired: true
    rollbackPlanRequired: true
    telemetryRequired: true
    costCeilingRequired: true
    queueJobPreparedNotSubmittedOnly: true
    noApiRouteExecution: true
    noServiceRoleQueueSmoke: true
    noBackendQueueSubmission: true
    noServiceRoleTransaction: true
    noLiveQueueWrite: true
    noWorkerEnqueue: true
    noWorkerDispatch: true
    noToolExecution: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedGateActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaRouteBoundServiceRoleQueueSmokePreflightRunGatePrepared: true
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted: boolean
    sourceServiceRoleQueueSmokePreflightAccepted: boolean
    routeBoundServiceRoleQueueSmokePreflightRunGateReadyWithProvidedEvidence: boolean
    routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesAccepted: boolean
    routeBoundOperatorRefsAccepted: boolean
    cpuStaticRouteBoundServiceRoleQueueSmokeRunGateAccepted: boolean
    gpuModelRouteBoundServiceRoleQueueSmokeRunGateAccepted: boolean
    privateRouteBoundServiceRoleQueueSmokeRunGateOnly: true
    queueJobPreparedNotSubmittedOnly: true
    serviceRoleCredentialsServerOnly: true
    nonProductionEnvironmentRequired: true
    explicitSmokeConfirmationRequired: true
    cleanupRequired: true
    rollbackRequired: true
    telemetryRequired: true
    costCeilingRequired: true
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
    routeBoundServiceRoleQueueSmokeRunApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
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
    serviceRoleQueueSmokePerformed: false
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

const routeBoundServiceRoleQueueSmokePreflightRunGatePolicy = {
  privateRouteBoundServiceRoleQueueSmokePreflightRunGateOnly: true,
  sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeRequired: true,
  sourceServiceRoleQueueSmokePreflightRequired: true,
  explicitOperatorConfirmationRequired: true,
  nonProductionEnvironmentRequired: true,
  serverOnlyServiceRoleCredentialsRequired: true,
  routeExecutionWindowRequired: true,
  queueWriteWindowRequired: true,
  cleanupPlanRequired: true,
  rollbackPlanRequired: true,
  telemetryRequired: true,
  costCeilingRequired: true,
  queueJobPreparedNotSubmittedOnly: true,
  noApiRouteExecution: true,
  noServiceRoleQueueSmoke: true,
  noBackendQueueSubmission: true,
  noServiceRoleTransaction: true,
  noLiveQueueWrite: true,
  noWorkerEnqueue: true,
  noWorkerDispatch: true,
  noToolExecution: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedGateActions = [
  'read accepted route-bound service-role queue-smoke authorization bridge metadata',
  'read accepted all-21 service-role queue smoke preflight metadata',
  'verify private operator/run-window/rollback/telemetry/cost refs exist',
  'prepare all 21 route-bound smoke candidates without submitting queue jobs',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'route-bound service-role queue smoke run approval now',
  'service-role queue smoke execution now',
  'approved snapshot mutation',
  'credit reservation mutation',
  'private artifact write',
  'backend queue submission',
  'service-role transaction',
  'live queue write',
  'Worker queue enqueue',
  'Worker lease creation',
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
  'QA the route-bound service-role queue-smoke preflight/run gate while queue writes remain blocked.',
  'Prepare a private non-production route-bound queue-smoke runbook with explicit operator approval.',
  'Attempt one non-production route-bound service-role queue smoke only after operator, environment, cleanup, rollback, telemetry, and cost ceiling refs are accepted.',
]

const requiredRunGateInputKeys = [
  'routeBoundServiceRoleQueueSmokeRunGateRef',
  'routeBoundServiceRoleQueueSmokeOperatorRef',
  'routeBoundServiceRoleQueueSmokeReadinessRef',
  'routeBoundServiceRoleQueueSmokePreflightRef',
  'routeBoundServiceRoleQueueSmokeEnvironmentRef',
  'routeBoundServiceRoleQueueSmokeRouteExecutionWindowRef',
  'routeBoundServiceRoleQueueSmokeQueueWriteWindowRef',
  'routeBoundServiceRoleQueueSmokeCleanupPlanRef',
  'routeBoundServiceRoleQueueSmokeRollbackPlanRef',
  'routeBoundServiceRoleQueueSmokeTelemetryRef',
  'routeBoundServiceRoleQueueSmokeCostCeilingRef',
] as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const expectedCounts = (packet?.expectedCounts ?? {}) as Record<string, unknown>
  const scope = (packet?.scope ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  return typeof value === 'number' ? value :
    typeof counts[key] === 'number' ? counts[key] as number :
    typeof expectedCounts[key] === 'number' ? expectedCounts[key] as number :
    typeof scope[key] === 'number' ? scope[key] as number :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function stringArrayFrom(packet: Record<string, unknown> | undefined, key: string): string[] {
  const value = packet?.[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function routeBoundAuthorizationBridgeAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_BRIDGE_DECISION &&
    packet.status === 'route_bound_service_role_queue_smoke_authorization_bridge_ready_runtime_still_blocked' &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence') === 21 &&
    countFrom(packet, 'cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence') === 13 &&
    countFrom(packet, 'gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence') === 8 &&
    countFrom(packet, 'serviceRoleQueueSmokeApprovedNowTools') === 0 &&
    countFrom(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    booleanFrom(packet, 'routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerDispatchApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function serviceRoleQueueSmokePreflightAccepted(packet?: Record<string, unknown>): boolean {
  const expectedStatuses = (packet?.expectedStatuses ?? {}) as Record<string, unknown>
  const preflight = (packet?.preflight ?? {}) as Record<string, unknown>
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION &&
    countFrom(packet, 'toolsCovered') === 21 &&
    countFrom(packet, 'productFacingCapabilitiesCovered') === 12 &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'payloadPreviewsPrepared') === 21 &&
    countFrom(packet, 'liveSupabaseQueueWritesNow') === 0 &&
    countFrom(packet, 'liveWorkerDispatchesNow') === 0 &&
    countFrom(packet, 'liveToolExecutionsNow') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    preflight.sideEffectFree === true &&
    preflight.validatesAll21PayloadPreviews === true &&
    expectedStatuses.readyStatusWithEnvFlagsAndBridge ===
      'ready_to_execute_non_production_service_role_queue_smoke' &&
    booleanFrom(packet, 'externalBetaServiceRoleQueueSmokePreflightPrepared') === true &&
    booleanFrom(packet, 'serviceRoleCredentialsServerOnly') === true &&
    booleanFrom(packet, 'nonProductionEnvironmentRequired') === true &&
    booleanFrom(packet, 'explicitSmokeConfirmationRequired') === true &&
    booleanFrom(packet, 'gpuRuntimeOnDemandOnly') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function routeBoundCandidateFor(
  packet: Record<string, unknown> | undefined,
  toolId: AiGraphicsCanonicalToolId,
) {
  const candidates =
    (packet?.routeBoundServiceRoleQueueSmokeAuthorizationCandidates ?? []) as
      Array<Record<string, unknown>>
  return candidates.find((item) => item.toolId === toolId)
}

function runGateRefPresence(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateInput,
): Record<string, boolean> {
  return Object.fromEntries(
    requiredRunGateInputKeys.map((key) => [key, hasValue(input[key])]),
  )
}

function missingRunGateRefs(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateInput,
): string[] {
  return requiredRunGateInputKeys.filter((key) => !hasValue(input[key]))
}

function candidateReasons(
  routeBoundPacket: Record<string, unknown> | undefined,
  preflightPacket: Record<string, unknown> | undefined,
): string[] {
  const preflightTools = stringArrayFrom(preflightPacket, 'tools')
  const preflightCapabilities = stringArrayFrom(preflightPacket, 'capabilities')
  return AI_GRAPHICS_CANONICAL_TOOL_IDS.flatMap((toolId) => {
    const routeCandidate = routeBoundCandidateFor(routeBoundPacket, toolId)
    const capabilityId =
      typeof routeCandidate?.capabilityId === 'string'
        ? routeCandidate.capabilityId
        : undefined
    return [
      !routeCandidate ? `missing route-bound authorization bridge candidate for ${toolId}` : undefined,
      !preflightTools.includes(toolId) ? `missing service-role queue smoke preflight tool coverage for ${toolId}` : undefined,
      capabilityId && !preflightCapabilities.includes(capabilityId)
        ? `missing service-role queue smoke preflight capability coverage for ${capabilityId}`
        : undefined,
      !capabilityId
        ? `route-bound candidate capability missing for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.queueJobStatus !== 'prepared_not_submitted'
        ? `route-bound candidate queue status is not prepared_not_submitted for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.liveQueueWritePerformed !== false
        ? `route-bound candidate live queue write was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.workerEnqueuePerformed !== false
        ? `route-bound candidate worker enqueue was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.workerDispatchPerformed !== false
        ? `route-bound candidate worker dispatch was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.toolExecutionPerformed !== false
        ? `route-bound candidate tool execution was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.gpuRuntimeShouldStartNow !== false
        ? `GPU runtime should not start now for ${toolId}`
        : undefined,
    ].filter((reason): reason is string => Boolean(reason))
  })
}

function statusFromInput(input: {
  hasRouteBoundBridge: boolean
  routeBoundBridgeAccepted: boolean
  hasPreflight: boolean
  preflightAccepted: boolean
  missingRefs: string[]
  candidateReasons: string[]
}): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateStatus {
  if (!input.hasRouteBoundBridge) {
    return 'missing_route_bound_service_role_queue_smoke_authorization_bridge_packet'
  }
  if (!input.routeBoundBridgeAccepted) {
    return 'route_bound_service_role_queue_smoke_authorization_bridge_rejected'
  }
  if (!input.hasPreflight) return 'missing_service_role_queue_smoke_preflight_packet'
  if (!input.preflightAccepted) return 'service_role_queue_smoke_preflight_rejected'
  if (input.missingRefs.length > 0) return 'missing_required_route_bound_operator_refs'
  if (input.candidateReasons.length > 0) {
    return 'route_bound_service_role_queue_smoke_preflight_run_gate_candidate_rejected'
  }
  return 'route_bound_service_role_queue_smoke_preflight_run_gate_ready_execution_still_blocked'
}

function buildCandidate(
  sourceCandidate: Record<string, unknown>,
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateCandidate {
  const toolId = sourceCandidate.toolId as AiGraphicsCanonicalToolId
  return {
    gateId: `route-bound-service-role-queue-smoke-preflight-run-gate-${toolId}`,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeId:
      sourceCandidate.bridgeId as string,
    toolId,
    capabilityId: sourceCandidate.capabilityId as string,
    routePath: sourceCandidate.routePath as '/api/ai-graphics/external-beta/tool-call',
    method: 'POST',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    queueJobStatus: 'prepared_not_submitted',
    runtimeTarget: sourceCandidate.runtimeTarget as string,
    workerType: sourceCandidate.workerType as string,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted: true,
    sourceServiceRoleQueueSmokePreflightAccepted: true,
    runGateMode:
      'route_bound_service_role_queue_smoke_preflight_ready_execution_still_blocked',
    requiresExplicitOperatorConfirmation: true,
    requiresNonProductionEnvironment: true,
    requiresServerOnlyServiceRoleCredentials: true,
    requiresRouteExecutionWindow: true,
    requiresQueueWriteWindow: true,
    requiresCleanupPlan: true,
    requiresRollbackPlan: true,
    requiresTelemetry: true,
    requiresCostCeiling: true,
    executeCommandTemplate:
      'future-only: npm run --silent ai-graphics:external-beta-service-role-queue-smoke -- --execute-external-beta-service-role-queue-smoke --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-route-bound-smoke-prefix> --external-beta-service-role-queue-smoke-authorization-packet <accepted-authorization-packet.json> --route-bound-service-role-queue-smoke-operator-preflight-packet <accepted-operator-preflight-packet.json> --service-role-queue-smoke-readiness-ref <readiness-ref> --runtime-queue-service-proof-bridge-ref <bridge-ref> --source-runtime-queue-service-proof-bridge-accepted',
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      sourceCandidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    routeExecutionPerformed: false,
    routeBoundServiceRoleQueueSmokeRunApprovedNow: false,
    serviceRoleQueueSmokeApprovedNow: false,
    serviceRoleQueueSmokePerformed: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueTransactionApprovedNow: false,
    serviceRoleTransactionPerformed: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    workerEnqueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchApprovedNow: false,
    workerDispatchPerformed: false,
    toolExecutionApprovedNow: false,
    toolExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

export function evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGate(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGateInput = {},
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokePreflightRunGate {
  const sourceRouteBoundBridgeAccepted = routeBoundAuthorizationBridgeAccepted(
    input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket,
  )
  const sourcePreflightAccepted = serviceRoleQueueSmokePreflightAccepted(
    input.sourceServiceRoleQueueSmokePreflightPacket,
  )
  const missingRefs = missingRunGateRefs(input)
  const reasons = candidateReasons(
    input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket,
    input.sourceServiceRoleQueueSmokePreflightPacket,
  )
  const status = statusFromInput({
    hasRouteBoundBridge:
      Boolean(input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket),
    routeBoundBridgeAccepted: sourceRouteBoundBridgeAccepted,
    hasPreflight: Boolean(input.sourceServiceRoleQueueSmokePreflightPacket),
    preflightAccepted: sourcePreflightAccepted,
    missingRefs,
    candidateReasons: reasons,
  })
  const ready =
    status ===
      'route_bound_service_role_queue_smoke_preflight_run_gate_ready_execution_still_blocked'
  const routeBoundServiceRoleQueueSmokePreflightRunGateCandidates = ready
    ? AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
        buildCandidate(
          routeBoundCandidateFor(
            input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket,
            toolId,
          )!,
        ),
      )
    : []
  const cpuStaticAccepted =
    routeBoundServiceRoleQueueSmokePreflightRunGateCandidates.filter(
      (item) => !item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    ).length === 13
  const gpuModelAccepted =
    routeBoundServiceRoleQueueSmokePreflightRunGateCandidates.filter(
      (item) => item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    ).length === 8

  const rejectionReasons = [
    !input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket
      ? 'accepted route-bound service-role queue smoke authorization bridge packet is missing'
      : undefined,
    input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket &&
      !sourceRouteBoundBridgeAccepted
      ? 'route-bound service-role queue smoke authorization bridge packet is not accepted'
      : undefined,
    !input.sourceServiceRoleQueueSmokePreflightPacket
      ? 'accepted service-role queue smoke preflight packet is missing'
      : undefined,
    input.sourceServiceRoleQueueSmokePreflightPacket && !sourcePreflightAccepted
      ? 'service-role queue smoke preflight packet is not accepted'
      : undefined,
    ...missingRefs.map((key) => `missing route-bound run gate ref: ${key}`),
    ...reasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_RUN_GATE_DECISION,
    status,
    rejectionReasons,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeDecision:
      typeof input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket?.decision ===
        'string'
        ? input.sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgePacket.decision
        : null,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted:
      sourceRouteBoundBridgeAccepted,
    sourceServiceRoleQueueSmokePreflightDecision:
      typeof input.sourceServiceRoleQueueSmokePreflightPacket?.decision === 'string'
        ? input.sourceServiceRoleQueueSmokePreflightPacket.decision
        : null,
    sourceServiceRoleQueueSmokePreflightAccepted: sourcePreflightAccepted,
    requiredRunGateRefs: runGateRefPresence(input),
    missingRunGateRefs: missingRefs,
    routeBoundServiceRoleQueueSmokePreflightRunGateCandidates,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence:
      ready ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence:
      sourceRouteBoundBridgeAccepted ? 21 : 0,
    sourceServiceRoleQueueSmokePreflightReadyToolsWithProvidedEvidence:
      sourcePreflightAccepted ? 21 : 0,
    routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence:
      ready ? 21 : 0,
    cpuStaticRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence:
      cpuStaticAccepted ? 13 : 0,
    gpuModelRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence:
      gpuModelAccepted ? 8 : 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    routeBoundServiceRoleQueueSmokeRunApprovedNowTools: 0,
    serviceRoleQueueSmokeApprovedNowTools: 0,
    serviceRoleQueueSmokesPerformedNowTools: 0,
    backendQueueSubmissionApprovedNowTools: 0,
    serviceRoleQueueTransactionApprovedNowTools: 0,
    liveQueueWriteApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
      sourceRouteBoundBridgeAccepted && sourcePreflightAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    routeBoundServiceRoleQueueSmokePreflightRunGatePolicy,
    allowedGateActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteBoundServiceRoleQueueSmokePreflightRunGatePrepared: true,
      sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted:
        sourceRouteBoundBridgeAccepted,
      sourceServiceRoleQueueSmokePreflightAccepted: sourcePreflightAccepted,
      routeBoundServiceRoleQueueSmokePreflightRunGateReadyWithProvidedEvidence:
        ready,
      routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesAccepted:
        ready,
      routeBoundOperatorRefsAccepted: missingRefs.length === 0,
      cpuStaticRouteBoundServiceRoleQueueSmokeRunGateAccepted: cpuStaticAccepted,
      gpuModelRouteBoundServiceRoleQueueSmokeRunGateAccepted: gpuModelAccepted,
      privateRouteBoundServiceRoleQueueSmokeRunGateOnly: true,
      queueJobPreparedNotSubmittedOnly: true,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      cleanupRequired: true,
      rollbackRequired: true,
      telemetryRequired: true,
      costCeilingRequired: true,
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
      routeBoundServiceRoleQueueSmokeRunApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
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
  }
}
