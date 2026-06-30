import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_HANDLER_BRIDGE_DECISION,
} from './ai-graphics-external-beta-tool-call-handler-bridge'
import {
  AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION,
} from '../tool-registry/ai-graphics-external-beta-backend-queue-submission'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_QUEUE_AUTHORIZATION_BRIDGE_DECISION =
  'ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeStatus =
  | 'missing_handler_bridge_packet'
  | 'handler_bridge_rejected'
  | 'missing_backend_queue_submission_packet'
  | 'backend_queue_submission_rejected'
  | 'route_to_queue_candidate_rejected'
  | 'route_to_queue_authorization_bridge_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput {
  sourceHandlerBridgePacket?: Record<string, unknown>
  sourceBackendQueueSubmissionPacket?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaRouteToQueueAuthorizationCandidate {
  authorizationId: string
  requestId: string
  toolId: 'd3' | 'sam2'
  capabilityId: 'chart_overlay' | 'subject_segmentation'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  method: 'POST'
  queueName: 'ai_graphics_external_beta_tool_runtime'
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'prepared_not_submitted'
  runtimeTarget: string
  workerType: 'render_worker' | 'gpu_ai_worker'
  sourceHandlerBridgeAccepted: true
  sourceBackendQueueSubmissionAccepted: true
  sourceBackendQueueExampleAccepted: true
  routeToQueueAuthorizationMode: 'private_authorization_bridge_prepared_not_submitted'
  approvedPlanSnapshotBindingRequired: true
  creditReservationBindingRequired: true
  privateArtifactManifestBindingRequired: true
  idempotencyBindingRequired: true
  serviceRoleQueueAuthorizationRequired: true
  liveQueueWriteWindowRequiredLater: true
  cleanupPlanRequiredForLaterSmoke: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteMountedNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionPerformed: false
  routeToQueueAuthorizationApprovedNow: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformed: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaRouteToQueueAuthorizationBridge {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_QUEUE_AUTHORIZATION_BRIDGE_DECISION
  status: AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeStatus
  rejectionReasons: string[]
  sourceHandlerBridgeDecision: string | null
  sourceHandlerBridgeAccepted: boolean
  sourceBackendQueueSubmissionDecision: string | null
  sourceBackendQueueSubmissionAccepted: boolean
  routeToQueueAuthorizationCandidates:
    AiGraphicsExternalBetaRouteToQueueAuthorizationCandidate[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceHandlerBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceBackendQueueSubmissionReadyExamplesWithProvidedEvidence: number
  routeToQueueAuthorizationCandidatesWithProvidedEvidence: 0 | 2
  cpuStaticRouteToQueueAuthorizationCandidatesWithProvidedEvidence: 0 | 1
  gpuModelRouteToQueueAuthorizationCandidatesWithProvidedEvidence: 0 | 1
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  routeToQueueAuthorizationsApprovedNow: 0
  backendQueueSubmissionApprovedNowTools: 0
  liveQueueWriteApprovedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  routeToQueueAuthorizationPolicy: {
    privateRouteToQueueAuthorizationBridgeOnly: true
    sourceHandlerBridgeRequired: true
    sourceBackendQueueSubmissionRequired: true
    queueJobPreparedNotSubmittedOnly: true
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
    externalBetaRouteToQueueAuthorizationBridgePrepared: true
    sourceHandlerBridgeAccepted: boolean
    sourceBackendQueueSubmissionAccepted: boolean
    routeToQueueAuthorizationCandidatesAccepted: boolean
    routeToQueueAuthorizationBridgeReadyWithProvidedEvidence: boolean
    cpuStaticRouteToQueueAuthorizationAccepted: boolean
    gpuModelRouteToQueueAuthorizationAccepted: boolean
    privateRouteToQueueAuthorizationBridgeOnly: true
    queueJobPreparedNotSubmittedOnly: true
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
    routeToQueueAuthorizationApprovedNow: false
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

const routeToQueueAuthorizationPolicy = {
  privateRouteToQueueAuthorizationBridgeOnly: true,
  sourceHandlerBridgeRequired: true,
  sourceBackendQueueSubmissionRequired: true,
  queueJobPreparedNotSubmittedOnly: true,
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
  'read accepted disabled handler bridge metadata',
  'read accepted backend queue submission envelope metadata',
  'prepare route-to-queue authorization candidates for d3 and sam2',
  'keep queue jobs prepared_not_submitted with no live queue writes',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'route-to-queue authorization approval now',
  'approved snapshot mutation',
  'credit reservation mutation',
  'private artifact write',
  'backend queue submission',
  'live queue write',
  'service-role transaction',
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
  'QA the private route-to-queue authorization bridge while queue writes remain blocked.',
  'Add a private route-to-queue smoke authorization gate before any live queue write is attempted.',
  'Run a single private non-production route-to-queue smoke only after explicit operator authorization.',
]

const authorizationIds = {
  d3: 'route-to-queue-authorization-d3',
  sam2: 'route-to-queue-authorization-sam2',
} as const

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const scope = (packet?.scope ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  return typeof value === 'number' ? value :
    typeof counts[key] === 'number' ? counts[key] as number :
    typeof scope[key] === 'number' ? scope[key] as number :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function handlerBridgeAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_HANDLER_BRIDGE_DECISION &&
    packet.status === 'disabled_handler_bridge_ready_runtime_still_blocked' &&
    countFrom(packet, 'handlerBridgeReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'handlerBridgeRequestsAcceptedWithProvidedEvidence') === 2 &&
    countFrom(packet, 'cpuStaticHandlerBridgeCasesAcceptedWithProvidedEvidence') === 1 &&
    countFrom(packet, 'gpuModelHandlerBridgeCasesAcceptedWithProvidedEvidence') === 1 &&
    countFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    countFrom(packet, 'routeExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'workerEnqueueApprovedNowTools') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    booleanFrom(packet, 'handlerBridgeReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function backendQueueSubmissionAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION &&
    packet.status === 'prepared_external_beta_backend_queue_submission_envelope_runtime_blocked' &&
    countFrom(packet, 'fullSubmissionEnvelopeReadyExamples') === 3 &&
    countFrom(packet, 'cpuStaticFirstCohortSubmissionEnvelopeReadyExamples') === 1 &&
    countFrom(packet, 'liveBackendQueueSubmissionsNow') === 0 &&
    countFrom(packet, 'liveServiceRoleTransactionsNow') === 0 &&
    countFrom(packet, 'liveWorkerDispatchesNow') === 0 &&
    countFrom(packet, 'workerEnqueuePerformedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNow') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'backendQueueSubmissionApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'backendQueueSubmissionPerformed') === false &&
    booleanFrom(packet, 'serviceRoleTransactionPerformed') === false &&
    booleanFrom(packet, 'workerDispatchPerformed') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function handlerCaseFor(packet: Record<string, unknown> | undefined, toolId: 'd3' | 'sam2') {
  const cases = (packet?.handlerBridgeCases ?? []) as Array<Record<string, unknown>>
  return cases.find((item) => item.toolId === toolId)
}

function backendExampleFor(packet: Record<string, unknown> | undefined, toolId: 'd3' | 'sam2') {
  const examples = (packet?.exampleEvaluations ?? []) as Array<Record<string, unknown>>
  return examples.find((item) => item.id === `accepted_future_${toolId}_backend_queue_submission_envelope`)
}

function candidateReasons(
  handlerPacket: Record<string, unknown> | undefined,
  queuePacket: Record<string, unknown> | undefined,
): string[] {
  return (['d3', 'sam2'] as const).flatMap((toolId) => {
    const handlerCase = handlerCaseFor(handlerPacket, toolId)
    const queueExample = backendExampleFor(queuePacket, toolId)
    return [
      !handlerCase ? `missing handler bridge case for ${toolId}` : undefined,
      !queueExample ? `missing backend queue submission example for ${toolId}` : undefined,
      handlerCase &&
        queueExample &&
        typeof queueExample.capabilityId === 'string' &&
        handlerCase.capabilityId !== queueExample.capabilityId
        ? `capability mismatch for ${toolId}`
        : undefined,
      handlerCase && queueExample && handlerCase.runtimeTarget !== queueExample.runtimeTarget
        ? `runtime target mismatch for ${toolId}`
        : undefined,
      queueExample && queueExample.queueJobStatus !== 'prepared_not_submitted'
        ? `queue job status is not prepared_not_submitted for ${toolId}`
        : undefined,
      queueExample && queueExample.backendQueueSubmissionPerformed !== false
        ? `backend queue submission was performed for ${toolId}`
        : undefined,
      queueExample && queueExample.serviceRoleTransactionPerformed !== false
        ? `service-role transaction was performed for ${toolId}`
        : undefined,
      queueExample && queueExample.workerDispatchPerformed !== false
        ? `worker dispatch was performed for ${toolId}`
        : undefined,
      queueExample && queueExample.gpuRuntimeShouldStartNow !== false
        ? `GPU runtime should not start now for ${toolId}`
        : undefined,
    ].filter((reason): reason is string => Boolean(reason))
  })
}

function statusFromInput(input: {
  hasHandler: boolean
  handlerAccepted: boolean
  hasQueue: boolean
  queueAccepted: boolean
  candidateReasons: string[]
}): AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeStatus {
  if (!input.hasHandler) return 'missing_handler_bridge_packet'
  if (!input.handlerAccepted) return 'handler_bridge_rejected'
  if (!input.hasQueue) return 'missing_backend_queue_submission_packet'
  if (!input.queueAccepted) return 'backend_queue_submission_rejected'
  if (input.candidateReasons.length > 0) return 'route_to_queue_candidate_rejected'
  return 'route_to_queue_authorization_bridge_ready_runtime_still_blocked'
}

function buildCandidate(
  input: {
    handlerCase: Record<string, unknown>
    queueExample: Record<string, unknown>
  },
): AiGraphicsExternalBetaRouteToQueueAuthorizationCandidate {
  const toolId = input.handlerCase.toolId as 'd3' | 'sam2'
  return {
    authorizationId: authorizationIds[toolId],
    requestId: input.handlerCase.requestId as string,
    toolId,
    capabilityId: input.handlerCase.capabilityId as 'chart_overlay' | 'subject_segmentation',
    routePath: input.handlerCase.routePath as '/api/ai-graphics/external-beta/tool-call',
    method: 'POST',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    queueJobStatus: 'prepared_not_submitted',
    runtimeTarget: input.handlerCase.runtimeTarget as string,
    workerType: input.queueExample.workerType as 'render_worker' | 'gpu_ai_worker',
    sourceHandlerBridgeAccepted: true,
    sourceBackendQueueSubmissionAccepted: true,
    sourceBackendQueueExampleAccepted: true,
    routeToQueueAuthorizationMode: 'private_authorization_bridge_prepared_not_submitted',
    approvedPlanSnapshotBindingRequired: true,
    creditReservationBindingRequired: true,
    privateArtifactManifestBindingRequired: true,
    idempotencyBindingRequired: true,
    serviceRoleQueueAuthorizationRequired: true,
    liveQueueWriteWindowRequiredLater: true,
    cleanupPlanRequiredForLaterSmoke: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.handlerCase.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
      input.queueExample.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    routeExecutionPerformed: false,
    routeToQueueAuthorizationApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    workerEnqueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

export function evaluateAiGraphicsExternalBetaRouteToQueueAuthorizationBridge(
  input: AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput = {},
): AiGraphicsExternalBetaRouteToQueueAuthorizationBridge {
  const handlerAccepted = handlerBridgeAccepted(input.sourceHandlerBridgePacket)
  const queueAccepted = backendQueueSubmissionAccepted(input.sourceBackendQueueSubmissionPacket)
  const reasons = candidateReasons(
    input.sourceHandlerBridgePacket,
    input.sourceBackendQueueSubmissionPacket,
  )
  const status = statusFromInput({
    hasHandler: Boolean(input.sourceHandlerBridgePacket),
    handlerAccepted,
    hasQueue: Boolean(input.sourceBackendQueueSubmissionPacket),
    queueAccepted,
    candidateReasons: reasons,
  })
  const ready = status === 'route_to_queue_authorization_bridge_ready_runtime_still_blocked'
  const routeToQueueAuthorizationCandidates = ready
    ? (['d3', 'sam2'] as const).map((toolId) => buildCandidate({
        handlerCase: handlerCaseFor(input.sourceHandlerBridgePacket, toolId)!,
        queueExample: backendExampleFor(input.sourceBackendQueueSubmissionPacket, toolId)!,
      }))
    : []
  const cpuStaticAccepted =
    routeToQueueAuthorizationCandidates.some((item) => item.toolId === 'd3' && !item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
  const gpuModelAccepted =
    routeToQueueAuthorizationCandidates.some((item) => item.toolId === 'sam2' && item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)

  const rejectionReasons = [
    !input.sourceHandlerBridgePacket ? 'accepted handler bridge packet is missing' : undefined,
    input.sourceHandlerBridgePacket && !handlerAccepted
      ? 'handler bridge packet is not accepted'
      : undefined,
    !input.sourceBackendQueueSubmissionPacket
      ? 'accepted backend queue submission packet is missing'
      : undefined,
    input.sourceBackendQueueSubmissionPacket && !queueAccepted
      ? 'backend queue submission packet is not accepted'
      : undefined,
    ...reasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_QUEUE_AUTHORIZATION_BRIDGE_DECISION,
    status,
    rejectionReasons,
    sourceHandlerBridgeDecision:
      typeof input.sourceHandlerBridgePacket?.decision === 'string'
        ? input.sourceHandlerBridgePacket.decision
        : null,
    sourceHandlerBridgeAccepted: handlerAccepted,
    sourceBackendQueueSubmissionDecision:
      typeof input.sourceBackendQueueSubmissionPacket?.decision === 'string'
        ? input.sourceBackendQueueSubmissionPacket.decision
        : null,
    sourceBackendQueueSubmissionAccepted: queueAccepted,
    routeToQueueAuthorizationCandidates,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence: ready ? 21 : 0,
    sourceHandlerBridgeReadyToolsWithProvidedEvidence: handlerAccepted ? 21 : 0,
    sourceBackendQueueSubmissionReadyExamplesWithProvidedEvidence:
      countFrom(input.sourceBackendQueueSubmissionPacket, 'fullSubmissionEnvelopeReadyExamples') ?? 0,
    routeToQueueAuthorizationCandidatesWithProvidedEvidence: ready ? 2 : 0,
    cpuStaticRouteToQueueAuthorizationCandidatesWithProvidedEvidence: cpuStaticAccepted ? 1 : 0,
    gpuModelRouteToQueueAuthorizationCandidatesWithProvidedEvidence: gpuModelAccepted ? 1 : 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    routeToQueueAuthorizationsApprovedNow: 0,
    backendQueueSubmissionApprovedNowTools: 0,
    liveQueueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: handlerAccepted && queueAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    routeToQueueAuthorizationPolicy,
    allowedBridgeActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteToQueueAuthorizationBridgePrepared: true,
      sourceHandlerBridgeAccepted: handlerAccepted,
      sourceBackendQueueSubmissionAccepted: queueAccepted,
      routeToQueueAuthorizationCandidatesAccepted: ready,
      routeToQueueAuthorizationBridgeReadyWithProvidedEvidence: ready,
      cpuStaticRouteToQueueAuthorizationAccepted: cpuStaticAccepted,
      gpuModelRouteToQueueAuthorizationAccepted: gpuModelAccepted,
      privateRouteToQueueAuthorizationBridgeOnly: true,
      queueJobPreparedNotSubmittedOnly: true,
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
      routeToQueueAuthorizationApprovedNow: false,
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

export function buildAiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput(
  sourceHandlerBridgePacket: Record<string, unknown>,
  sourceBackendQueueSubmissionPacket: Record<string, unknown>,
): AiGraphicsExternalBetaRouteToQueueAuthorizationBridgeInput {
  return {
    sourceHandlerBridgePacket,
    sourceBackendQueueSubmissionPacket,
  }
}
