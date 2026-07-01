import {
  AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_RUN_GATE_DECISION,
} from './ai-graphics-external-beta-route-bound-service-role-queue-smoke-preflight-run-gate'
import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_RUNBOOK_AUTHORIZATION_DECISION =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_runbook_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationStatus =
  | 'missing_route_bound_service_role_queue_smoke_preflight_run_gate_packet'
  | 'route_bound_service_role_queue_smoke_preflight_run_gate_rejected'
  | 'missing_service_role_queue_smoke_harness_packet'
  | 'service_role_queue_smoke_harness_rejected'
  | 'missing_required_route_bound_runbook_refs'
  | 'route_bound_service_role_queue_smoke_runbook_payload_rejected'
  | 'route_bound_service_role_queue_smoke_runbook_authorization_ready_execution_still_blocked'

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationInput {
  sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket?: Record<string, unknown>
  sourceServiceRoleQueueSmokeHarnessPacket?: Record<string, unknown>
  routeBoundServiceRoleQueueSmokeRunbookRef?: string
  routeBoundServiceRoleQueueSmokeOperatorApprovalRef?: string
  routeBoundServiceRoleQueueSmokeEnvironmentRef?: string
  routeBoundServiceRoleQueueSmokeCredentialHandlingRef?: string
  routeBoundServiceRoleQueueSmokeIdempotencyPlanRef?: string
  routeBoundServiceRoleQueueSmokeResultStorageRef?: string
  routeBoundServiceRoleQueueSmokeEvidenceStorageRef?: string
  routeBoundServiceRoleQueueSmokeTelemetryRef?: string
  routeBoundServiceRoleQueueSmokeCleanupProofRef?: string
  routeBoundServiceRoleQueueSmokeRollbackRef?: string
  routeBoundServiceRoleQueueSmokeCostCeilingRef?: string
  routeBoundServiceRoleQueueSmokePostRunReviewRef?: string
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookToolItem {
  runbookItemId: string
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  capabilityIds: string[]
  runtimeTarget: string
  workerType: string
  queueName: 'ai_graphics_external_beta_tool_runtime'
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'prepared_not_submitted'
  idempotencyKeyTemplate: string
  privateArtifactManifestTemplate: string
  requiresAcceptedRunGate: true
  requiresAcceptedServiceRoleQueueSmokeHarness: true
  requiresAcceptedServiceRoleQueueSmokeAuthorizationPacket: true
  requiresAcceptedServiceRoleQueueSmokeReadinessRef: true
  requiresAcceptedRuntimeQueueServiceProofBridgeRef: true
  requiresExplicitOperatorConfirmation: true
  requiresNonProductionEnvironment: true
  requiresServerOnlyServiceRoleCredentials: true
  requiresCleanupProof: true
  requiresTelemetry: true
  requiresCostCeiling: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  routeExecutionApprovedNow: false
  serviceRoleQueueSmokeApprovedNow: false
  serviceRoleQueueSmokePerformed: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformed: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerDispatchApprovedNow: false
  workerDispatchPerformed: false
  toolExecutionApprovedNow: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorization {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_RUNBOOK_AUTHORIZATION_DECISION
  status: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationStatus
  rejectionReasons: string[]
  sourceRouteBoundServiceRoleQueueSmokePreflightRunGateDecision: string | null
  sourceRouteBoundServiceRoleQueueSmokePreflightRunGateAccepted: boolean
  sourceServiceRoleQueueSmokeHarnessDecision: string | null
  sourceServiceRoleQueueSmokeHarnessAccepted: boolean
  requiredRunbookRefs: Record<string, boolean>
  missingRunbookRefs: string[]
  routeBoundServiceRoleQueueSmokeRunbookToolItems:
    AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookToolItem[]
  routeBoundRepresentativeTools: ['d3', 'sam2']
  routeBoundRepresentativeCapabilities: ['chart_overlay', 'subject_segmentation']
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence: 0 | 21
  sourceServiceRoleQueueSmokeHarnessPreparedToolsWithProvidedEvidence: 0 | 21
  routeBoundServiceRoleQueueSmokeRunbookToolItemsPreparedWithProvidedEvidence: 0 | 21
  routeBoundRepresentativeCandidatesWithProvidedEvidence: 0 | 2
  cpuStaticRouteBoundRepresentativeCandidatesWithProvidedEvidence: 0 | 1
  gpuModelRouteBoundRepresentativeCandidatesWithProvidedEvidence: 0 | 1
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
  executeCommandTemplate: string
  routeBoundServiceRoleQueueSmokeRunbookPolicy: {
    privateNonProductionRunbookOnly: true
    sourceRouteBoundRunGateRequired: true
    sourceServiceRoleQueueSmokeHarnessRequired: true
    explicitOperatorApprovalRequired: true
    serverOnlyServiceRoleCredentialsRequired: true
    resultEvidenceMustStayPrivate: true
    cleanupProofRequired: true
    telemetryRequired: true
    rollbackRequired: true
    costCeilingRequired: true
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
  allowedRunbookActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPrepared: true
    sourceRouteBoundServiceRoleQueueSmokePreflightRunGateAccepted: boolean
    sourceServiceRoleQueueSmokeHarnessAccepted: boolean
    routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyWithProvidedEvidence: boolean
    routeBoundServiceRoleQueueSmokeRunbookToolItemsAccepted: boolean
    routeBoundRunbookRefsAccepted: boolean
    privateNonProductionRunbookOnly: true
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
    all21RouteBoundSmokeRunbookItemsPrepared: boolean
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

const routeBoundServiceRoleQueueSmokeRunbookPolicy = {
  privateNonProductionRunbookOnly: true,
  sourceRouteBoundRunGateRequired: true,
  sourceServiceRoleQueueSmokeHarnessRequired: true,
  explicitOperatorApprovalRequired: true,
  serverOnlyServiceRoleCredentialsRequired: true,
  resultEvidenceMustStayPrivate: true,
  cleanupProofRequired: true,
  telemetryRequired: true,
  rollbackRequired: true,
  costCeilingRequired: true,
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

const allowedRunbookActions = [
  'read accepted route-bound service-role queue-smoke preflight/run gate metadata',
  'read prepared all-21 service-role queue smoke harness metadata',
  'prepare all-21 queue-smoke payload runbook items without submitting queue jobs',
  'record private result/evidence/telemetry/cleanup/rollback refs for a later operator run',
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
  'QA the route-bound service-role queue-smoke runbook authorization while execution remains blocked.',
  'Prepare private non-production smoke result capture paths and cleanup proof storage.',
  'Run one route-bound non-production service-role queue smoke only after explicit operator authorization and server-only credentials are present.',
]

const requiredRunbookInputKeys = [
  'routeBoundServiceRoleQueueSmokeRunbookRef',
  'routeBoundServiceRoleQueueSmokeOperatorApprovalRef',
  'routeBoundServiceRoleQueueSmokeEnvironmentRef',
  'routeBoundServiceRoleQueueSmokeCredentialHandlingRef',
  'routeBoundServiceRoleQueueSmokeIdempotencyPlanRef',
  'routeBoundServiceRoleQueueSmokeResultStorageRef',
  'routeBoundServiceRoleQueueSmokeEvidenceStorageRef',
  'routeBoundServiceRoleQueueSmokeTelemetryRef',
  'routeBoundServiceRoleQueueSmokeCleanupProofRef',
  'routeBoundServiceRoleQueueSmokeRollbackRef',
  'routeBoundServiceRoleQueueSmokeCostCeilingRef',
  'routeBoundServiceRoleQueueSmokePostRunReviewRef',
] as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

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

function productFacingCapabilityCount(): 12 {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
    .filter((capability) => capability !== 'planning_metadata_only' && capability !== 'blocked_or_deferred')
    .length as 12
}

function routeBoundRunGateAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_RUN_GATE_DECISION &&
    packet.status ===
      'route_bound_service_role_queue_smoke_preflight_run_gate_ready_execution_still_blocked' &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceServiceRoleQueueSmokePreflightReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence') === 21 &&
    countFrom(packet, 'cpuStaticRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence') === 13 &&
    countFrom(packet, 'gpuModelRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence') === 8 &&
    countFrom(packet, 'serviceRoleQueueSmokesPerformedNowTools') === 0 &&
    countFrom(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    booleanFrom(packet, 'routeBoundServiceRoleQueueSmokePreflightRunGateReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'routeBoundOperatorRefsAccepted') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'routeBoundServiceRoleQueueSmokeRunApprovedNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerDispatchApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function serviceRoleQueueSmokeHarnessAccepted(packet?: Record<string, unknown>): boolean {
  const harness = (packet?.harness ?? {}) as Record<string, unknown>
  return Boolean(packet) &&
    packet?.decision === 'ai_graphics_external_beta_service_role_queue_smoke_harness_prepared_with_runtime_blocks' &&
    harness.script === 'ai-graphics:external-beta-service-role-queue-smoke' &&
    harness.defaultStatus === 'external_beta_service_role_queue_smoke_prepared_not_executed' &&
    countFrom(packet, 'totalAiGraphicsTools') === 21 &&
    countFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'liveServiceRoleQueueSmokeExecutedNow') === 0 &&
    countFrom(packet, 'liveSupabaseQueueWritesNow') === 0 &&
    countFrom(packet, 'liveWorkerDispatchesNow') === 0 &&
    countFrom(packet, 'liveToolExecutionsNow') === 0 &&
    booleanFrom(packet, 'externalBetaServiceRoleQueueSmokeHarnessPrepared') === true &&
    booleanFrom(packet, 'serviceRoleCredentialsServerOnly') === true &&
    booleanFrom(packet, 'nonProductionEnvironmentRequired') === true &&
    booleanFrom(packet, 'serviceRoleQueueSmokeAuthorizationPacketRequired') === true &&
    booleanFrom(packet, 'sourceRuntimeQueueServiceProofBridgeRequired') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function runbookRefPresence(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationInput,
): Record<string, boolean> {
  return Object.fromEntries(
    requiredRunbookInputKeys.map((key) => [key, hasValue(input[key])]),
  )
}

function missingRunbookRefs(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationInput,
): string[] {
  return requiredRunbookInputKeys.filter((key) => !hasValue(input[key]))
}

function buildRunbookToolItems(): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookToolItem[] {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => Boolean(record.productionToolId))
    .map((record) => {
      const workerType = record.productionWorkerType === 'none'
        ? 'ai_graphics_planning_worker'
        : record.productionWorkerType
      const capabilityIds = record.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      ))
      return {
        runbookItemId: `route-bound-service-role-queue-smoke-runbook-${record.toolId}`,
        toolId: record.toolId,
        productionToolId: record.productionToolId as string,
        capabilityIds,
        runtimeTarget: record.runtimeTarget,
        workerType,
        queueName: 'ai_graphics_external_beta_tool_runtime',
        queueJobType: 'ai_graphics_tool_runtime',
        queueJobStatus: 'prepared_not_submitted',
        idempotencyKeyTemplate:
          `ai-graphics-route-bound-service-role-queue-smoke:<run-id>:job:${record.toolId}`,
        privateArtifactManifestTemplate:
          `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/${record.toolId}/manifest.json`,
        requiresAcceptedRunGate: true,
        requiresAcceptedServiceRoleQueueSmokeHarness: true,
        requiresAcceptedServiceRoleQueueSmokeAuthorizationPacket: true,
        requiresAcceptedServiceRoleQueueSmokeReadinessRef: true,
        requiresAcceptedRuntimeQueueServiceProofBridgeRef: true,
        requiresExplicitOperatorConfirmation: true,
        requiresNonProductionEnvironment: true,
        requiresServerOnlyServiceRoleCredentials: true,
        requiresCleanupProof: true,
        requiresTelemetry: true,
        requiresCostCeiling: true,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob: record.gpuRequiredForRuntime,
        gpuRuntimeShouldStartNow: false,
        routeExecutionApprovedNow: false,
        serviceRoleQueueSmokeApprovedNow: false,
        serviceRoleQueueSmokePerformed: false,
        liveQueueWriteApprovedNow: false,
        liveQueueWritePerformed: false,
        workerEnqueueApprovedNow: false,
        workerEnqueuePerformed: false,
        workerDispatchApprovedNow: false,
        workerDispatchPerformed: false,
        toolExecutionApprovedNow: false,
        toolExecutionPerformed: false,
        publicArtifactCreated: false,
        signedUrlCreated: false,
      }
    })
}

function statusFromInput(input: {
  hasRunGate: boolean
  runGateAccepted: boolean
  hasHarness: boolean
  harnessAccepted: boolean
  missingRefs: string[]
  payloadItemsAccepted: boolean
}): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationStatus {
  if (!input.hasRunGate) {
    return 'missing_route_bound_service_role_queue_smoke_preflight_run_gate_packet'
  }
  if (!input.runGateAccepted) {
    return 'route_bound_service_role_queue_smoke_preflight_run_gate_rejected'
  }
  if (!input.hasHarness) return 'missing_service_role_queue_smoke_harness_packet'
  if (!input.harnessAccepted) return 'service_role_queue_smoke_harness_rejected'
  if (input.missingRefs.length > 0) return 'missing_required_route_bound_runbook_refs'
  if (!input.payloadItemsAccepted) {
    return 'route_bound_service_role_queue_smoke_runbook_payload_rejected'
  }
  return 'route_bound_service_role_queue_smoke_runbook_authorization_ready_execution_still_blocked'
}

export function evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorization(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationInput = {},
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorization {
  const runGateAccepted = routeBoundRunGateAccepted(
    input.sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket,
  )
  const harnessAccepted = serviceRoleQueueSmokeHarnessAccepted(
    input.sourceServiceRoleQueueSmokeHarnessPacket,
  )
  const missingRefs = missingRunbookRefs(input)
  const runbookToolItems = buildRunbookToolItems()
  const all21PayloadItemsAccepted =
    runbookToolItems.length === 21 &&
    runbookToolItems.every((item) => (
      item.productionToolId.length > 0 &&
      item.runtimeTarget.length > 0 &&
      item.capabilityIds.length > 0 &&
      item.queueJobStatus === 'prepared_not_submitted' &&
      item.gpuRuntimeShouldStartNow === false &&
      item.toolExecutionApprovedNow === false
    ))
  const status = statusFromInput({
    hasRunGate: Boolean(input.sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket),
    runGateAccepted,
    hasHarness: Boolean(input.sourceServiceRoleQueueSmokeHarnessPacket),
    harnessAccepted,
    missingRefs,
    payloadItemsAccepted: all21PayloadItemsAccepted,
  })
  const ready =
    status ===
      'route_bound_service_role_queue_smoke_runbook_authorization_ready_execution_still_blocked'
  const gpuRuntimeTargetedTools = runbookToolItems
    .filter((item) => item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
    .length as 8

  const rejectionReasons = [
    !input.sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket
      ? 'accepted route-bound service-role queue-smoke preflight/run gate packet is missing'
      : undefined,
    input.sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket && !runGateAccepted
      ? 'route-bound service-role queue-smoke preflight/run gate packet is not accepted'
      : undefined,
    !input.sourceServiceRoleQueueSmokeHarnessPacket
      ? 'prepared service-role queue smoke harness packet is missing'
      : undefined,
    input.sourceServiceRoleQueueSmokeHarnessPacket && !harnessAccepted
      ? 'service-role queue smoke harness packet is not accepted'
      : undefined,
    ...missingRefs.map((key) => `missing route-bound runbook ref: ${key}`),
    !all21PayloadItemsAccepted
      ? 'all 21 route-bound service-role queue-smoke runbook payload items were not prepared'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_RUNBOOK_AUTHORIZATION_DECISION,
    status,
    rejectionReasons,
    sourceRouteBoundServiceRoleQueueSmokePreflightRunGateDecision:
      typeof input.sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket?.decision ===
        'string'
        ? input.sourceRouteBoundServiceRoleQueueSmokePreflightRunGatePacket.decision
        : null,
    sourceRouteBoundServiceRoleQueueSmokePreflightRunGateAccepted: runGateAccepted,
    sourceServiceRoleQueueSmokeHarnessDecision:
      typeof input.sourceServiceRoleQueueSmokeHarnessPacket?.decision === 'string'
        ? input.sourceServiceRoleQueueSmokeHarnessPacket.decision
        : null,
    sourceServiceRoleQueueSmokeHarnessAccepted: harnessAccepted,
    requiredRunbookRefs: runbookRefPresence(input),
    missingRunbookRefs: missingRefs,
    routeBoundServiceRoleQueueSmokeRunbookToolItems: ready ? runbookToolItems : [],
    routeBoundRepresentativeTools: ['d3', 'sam2'],
    routeBoundRepresentativeCapabilities: ['chart_overlay', 'subject_segmentation'],
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productFacingCapabilityCount(),
    gpuRuntimeTargetedTools,
    routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence:
      ready ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence:
      runGateAccepted ? 21 : 0,
    sourceServiceRoleQueueSmokeHarnessPreparedToolsWithProvidedEvidence:
      harnessAccepted ? 21 : 0,
    routeBoundServiceRoleQueueSmokeRunbookToolItemsPreparedWithProvidedEvidence:
      ready ? 21 : 0,
    routeBoundRepresentativeCandidatesWithProvidedEvidence:
      ready ? 2 : 0,
    cpuStaticRouteBoundRepresentativeCandidatesWithProvidedEvidence:
      ready ? 1 : 0,
    gpuModelRouteBoundRepresentativeCandidatesWithProvidedEvidence:
      ready ? 1 : 0,
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
      ready ? gpuRuntimeTargetedTools : 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    executeCommandTemplate:
      'future-only: REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production E2E_RUNTIME_MODE=local WORKER_RUNTIME_MODE=mock npm run --silent ai-graphics:external-beta-service-role-queue-smoke -- --execute-external-beta-service-role-queue-smoke --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-route-bound-smoke-prefix> --external-beta-service-role-queue-smoke-authorization-packet <accepted-authorization-packet.json> --route-bound-service-role-queue-smoke-operator-preflight-packet <accepted-operator-preflight-packet.json> --service-role-queue-smoke-readiness-ref <accepted-readiness-ref> --runtime-queue-service-proof-bridge-ref <accepted-runtime-queue-service-proof-bridge-ref> --source-runtime-queue-service-proof-bridge-accepted',
    routeBoundServiceRoleQueueSmokeRunbookPolicy,
    allowedRunbookActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPrepared: true,
      sourceRouteBoundServiceRoleQueueSmokePreflightRunGateAccepted: runGateAccepted,
      sourceServiceRoleQueueSmokeHarnessAccepted: harnessAccepted,
      routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyWithProvidedEvidence:
        ready,
      routeBoundServiceRoleQueueSmokeRunbookToolItemsAccepted:
        ready,
      routeBoundRunbookRefsAccepted: missingRefs.length === 0,
      privateNonProductionRunbookOnly: true,
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
      all21RouteBoundSmokeRunbookItemsPrepared: ready,
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
