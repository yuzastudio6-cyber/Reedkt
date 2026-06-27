import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION,
  evaluateAiGraphicsExternalBetaToolCallGateway,
  type AiGraphicsExternalBetaToolCallGateway,
  type AiGraphicsExternalBetaToolCallGatewayInput,
  type AiGraphicsExternalBetaWorkerEnqueueCandidate,
} from './ai-graphics-external-beta-tool-call-gateway'
import type { ProductionToolId } from './production-tool-types'
import {
  buildWorkerIdempotencyKey,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_EXTERNAL_BETA_WORKER_ENQUEUE_ADAPTER_DECISION =
  'ai_graphics_external_beta_worker_enqueue_adapter_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaWorkerEnqueueAdapterStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_tool_call_gateway'
  | 'missing_external_beta_enqueue_adapter_controls'
  | 'external_beta_worker_enqueue_adapter_payload_ready'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaWorkerEnqueueAdapterInput
  extends AiGraphicsExternalBetaToolCallGatewayInput {
  sourceExternalBetaToolCallGatewayPacket?: AiGraphicsExternalBetaToolCallGateway
  externalBetaProjectId?: string
  externalBetaEditPlanId?: string
  externalBetaToolExecutionPlanId?: string
  externalBetaBackendQueueAdapterRef?: string
  externalBetaQueueName?: string
  externalBetaServiceRoleBoundaryRef?: string
  externalBetaWorkerPayloadSchemaRef?: string
  externalBetaPrivateStoragePolicyRef?: string
  externalBetaRetryPolicyRef?: string
  externalBetaDeadLetterPolicyRef?: string
}

export interface AiGraphicsExternalBetaWorkerEnqueueAdapterPayload {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityId: string
  queueName: string
  backendQueueAdapterRef: string
  serviceRoleBoundaryRef: string
  workerPayloadSchemaRef: string
  sourceGatewayCandidateRef: string
  productionWorkerJobPayload: ProductionWorkerJobPayload
  sourceGatewayReadyWithProvidedEvidence: boolean
  adapterPayloadShapeValid: boolean
  adapterPayloadReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsExternalBetaWorkerEnqueueAdapter {
  decision: AiGraphicsExternalBetaWorkerEnqueueAdapterStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_ENQUEUE_ADAPTER_DECISION
  sourceExternalBetaToolCallGatewayDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaToolCallGateway: AiGraphicsExternalBetaToolCallGateway
  sourceExternalBetaToolCallGatewayAccepted: boolean
  missingAdapterControls: string[]
  externalBetaAdapterControlsSatisfied: boolean
  externalBetaWorkerEnqueueAdapterPayloadReadyWithProvidedEvidence: boolean
  externalBetaWorkerEnqueueAdapterPayload: AiGraphicsExternalBetaWorkerEnqueueAdapterPayload | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveBackendQueueSubmissionsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  adapterPolicy: {
    sideEffectFreeAdapterCheck: true
    sourceGatewayCandidateRequired: true
    backendQueueAdapterRefRequired: true
    serviceRoleBoundaryRequired: true
    workerPayloadSchemaRequired: true
    privateStoragePolicyRequired: true
    retryAndDeadLetterPolicyRequired: true
    workerPayloadCandidateOnly: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaWorkerEnqueueAdapterPrepared: true
    sourceExternalBetaToolCallGatewayAccepted: boolean
    externalBetaAdapterControlsSatisfied: boolean
    externalBetaWorkerEnqueueAdapterPayloadReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    workerPayloadShapeValid: boolean
    backendQueueAdapterRefAccepted: boolean
    serviceRoleBoundaryAccepted: boolean
    workerPayloadSchemaAccepted: boolean
    privateStoragePolicyAccepted: boolean
    retryPolicyAccepted: boolean
    deadLetterPolicyAccepted: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
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
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const adapterPolicy = {
  sideEffectFreeAdapterCheck: true,
  sourceGatewayCandidateRequired: true,
  backendQueueAdapterRefRequired: true,
  serviceRoleBoundaryRequired: true,
  workerPayloadSchemaRequired: true,
  privateStoragePolicyRequired: true,
  retryAndDeadLetterPolicyRequired: true,
  workerPayloadCandidateOnly: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function asWorkerType(value: string): ProductionWorkerRuntimeType {
  if (
    value === 'cpu_analysis_worker' ||
    value === 'gpu_ai_worker' ||
    value === 'render_worker' ||
    value === 'qa_worker' ||
    value === 'tool_readiness_worker'
  ) {
    return value
  }
  throw new Error(`Unsupported external beta AI graphics worker type: ${value}`)
}

function gatewayAccepted(packet: AiGraphicsExternalBetaToolCallGateway): boolean {
  return packet.decision === 'external_beta_worker_enqueue_candidate_ready' &&
    packet.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence === true &&
    packet.externalBetaWorkerEnqueueCandidate !== null &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.workerQueueApprovedNow === false &&
    packet.booleans.workerEnqueuePerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingAdapterControls(input: AiGraphicsExternalBetaWorkerEnqueueAdapterInput): string[] {
  return [
    !hasValue(input.externalBetaProjectId) ? 'external beta project id is missing' : undefined,
    !hasValue(input.externalBetaToolExecutionPlanId)
      ? 'external beta tool execution plan id is missing'
      : undefined,
    !hasValue(input.externalBetaBackendQueueAdapterRef)
      ? 'external beta backend queue adapter reference is missing'
      : undefined,
    !hasValue(input.externalBetaQueueName) ? 'external beta queue name is missing' : undefined,
    !hasValue(input.externalBetaServiceRoleBoundaryRef)
      ? 'external beta service-role boundary reference is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerPayloadSchemaRef)
      ? 'external beta worker payload schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaPrivateStoragePolicyRef)
      ? 'external beta private storage policy reference is missing'
      : undefined,
    !hasValue(input.externalBetaRetryPolicyRef)
      ? 'external beta retry policy reference is missing'
      : undefined,
    !hasValue(input.externalBetaDeadLetterPolicyRef)
      ? 'external beta dead-letter policy reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  gateway: AiGraphicsExternalBetaToolCallGateway
  gatewayAccepted: boolean
  executionRequested: boolean
  adapterReady: boolean
}): AiGraphicsExternalBetaWorkerEnqueueAdapterStatus {
  if (input.gateway.decision === 'invalid_capability_blocked') return 'invalid_capability_blocked'
  if (input.gateway.decision === 'requested_tool_eliminated') return 'requested_tool_eliminated'
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.gatewayAccepted) return 'missing_external_beta_tool_call_gateway'
  return input.adapterReady
    ? 'external_beta_worker_enqueue_adapter_payload_ready'
    : 'missing_external_beta_enqueue_adapter_controls'
}

function recipeIdForCandidate(candidate: AiGraphicsExternalBetaWorkerEnqueueCandidate): string {
  if (candidate.runtimeTarget === 'node_cpu_static') return 'ai_graphics_external_beta_cpu_static_tool_call'
  if (candidate.workerType === 'gpu_ai_worker') return 'ai_graphics_external_beta_gpu_model_tool_call'
  if (candidate.workerType === 'render_worker') return 'ai_graphics_external_beta_browser_graphics_tool_call'
  if (candidate.workerType === 'cpu_analysis_worker') return 'ai_graphics_external_beta_cpu_static_tool_call'
  return 'ai_graphics_external_beta_metadata_tool_call'
}

function buildPayload(input: {
  input: AiGraphicsExternalBetaWorkerEnqueueAdapterInput
  gateway: AiGraphicsExternalBetaToolCallGateway
  candidate: AiGraphicsExternalBetaWorkerEnqueueCandidate
}): ProductionWorkerJobPayload {
  if (!input.candidate.productionToolId) {
    throw new Error(`External beta worker payload requires productionToolId for ${input.candidate.toolId}`)
  }
  const productionToolId = input.candidate.productionToolId as ProductionToolId
  const payloadWithoutIdempotency: ProductionWorkerJobPayload = {
    jobId: `external-beta-ai-graphics-${input.candidate.requestId}-${input.candidate.toolId}`,
    workspaceId: input.candidate.workspaceId,
    projectId: input.input.externalBetaProjectId ?? '',
    approvedSnapshotId: input.candidate.approvedPlanSnapshotId,
    editPlanId: input.input.externalBetaEditPlanId,
    toolExecutionPlanId: input.input.externalBetaToolExecutionPlanId ?? '',
    workerType: asWorkerType(input.candidate.workerType),
    executionMode: 'production_blocked',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [productionToolId],
    requestedRecipeIds: [recipeIdForCandidate(input.candidate)],
    storageReferenceIds: [input.candidate.privateArtifactManifestRef],
    creditReservationId: input.candidate.creditReservationId,
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: '2026-06-27T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: input.candidate.toolId,
      aiGraphicsCapabilityId: input.candidate.capabilityId,
      aiGraphicsRuntimeTarget: input.candidate.runtimeTarget,
      sourceGatewayDecision: input.gateway.decision,
      sourceGatewayCandidateRef: input.candidate.candidateRef,
      sourceGatewayTraceId: input.candidate.traceId,
      sourceGatewayIdempotencyKey: input.candidate.idempotencyKey,
      externalBetaBackendQueueAdapterRef: input.input.externalBetaBackendQueueAdapterRef,
      externalBetaQueueName: input.input.externalBetaQueueName,
      externalBetaServiceRoleBoundaryRef: input.input.externalBetaServiceRoleBoundaryRef,
      externalBetaWorkerPayloadSchemaRef: input.input.externalBetaWorkerPayloadSchemaRef,
      externalBetaPrivateStoragePolicyRef: input.input.externalBetaPrivateStoragePolicyRef,
      externalBetaRetryPolicyRef: input.input.externalBetaRetryPolicyRef,
      externalBetaDeadLetterPolicyRef: input.input.externalBetaDeadLetterPolicyRef,
      artifactBoundaryApprovalRef: input.candidate.artifactBoundaryApprovalRef,
      toolRouteApprovalRef: input.candidate.toolRouteApprovalRef,
      workerApprovalRef: input.candidate.workerApprovalRef,
      runtimeEnqueueApprovalRef: input.candidate.runtimeEnqueueApprovalRef,
      ownerRuntimeApprovalRef: input.candidate.ownerRuntimeApprovalRef,
      gpuRequiredForRuntime: input.candidate.gpuRequiredForRuntime,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        input.candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      gpuRuntimeShouldStartNow: false,
      workerEnqueuePerformed: false,
      backendQueueSubmissionPerformed: false,
      agentCanExecuteToolsNow: false,
    },
  }
  return {
    ...payloadWithoutIdempotency,
    idempotencyKey: buildWorkerIdempotencyKey(payloadWithoutIdempotency),
  }
}

function payloadShapeValid(
  payload: ProductionWorkerJobPayload,
  candidate: AiGraphicsExternalBetaWorkerEnqueueCandidate,
): boolean {
  return Boolean(
    payload.jobId &&
      payload.workspaceId === candidate.workspaceId &&
      payload.approvedSnapshotId === candidate.approvedPlanSnapshotId &&
      payload.creditReservationId === candidate.creditReservationId &&
      payload.toolExecutionPlanId &&
      payload.executionMode === 'production_blocked' &&
      payload.requestedToolIds.length === 1 &&
      payload.requestedToolIds[0] === candidate.productionToolId &&
      payload.storageReferenceIds.length === 1 &&
      payload.storageReferenceIds[0] === candidate.privateArtifactManifestRef &&
      payload.idempotencyKey &&
      payload.metadata?.aiGraphicsCanonicalToolId === candidate.toolId &&
      payload.metadata?.aiGraphicsRuntimeTarget === candidate.runtimeTarget &&
      payload.metadata?.gpuRuntimeShouldStartNow === false &&
      payload.metadata?.workerEnqueuePerformed === false,
  )
}

function buildAdapterPayload(input: {
  input: AiGraphicsExternalBetaWorkerEnqueueAdapterInput
  gateway: AiGraphicsExternalBetaToolCallGateway
  adapterReady: boolean
}): AiGraphicsExternalBetaWorkerEnqueueAdapterPayload | null {
  const candidate = input.gateway.externalBetaWorkerEnqueueCandidate
  if (!candidate) return null
  const payload = buildPayload({ input: input.input, gateway: input.gateway, candidate })
  const adapterPayloadShapeValid = payloadShapeValid(payload, candidate)
  const adapterPayloadReadyWithProvidedEvidence =
    input.adapterReady &&
    input.gateway.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence &&
    adapterPayloadShapeValid
  return {
    toolId: candidate.toolId,
    productionToolId: candidate.productionToolId as ProductionToolId,
    workerType: asWorkerType(candidate.workerType),
    runtimeTarget: candidate.runtimeTarget,
    capabilityId: candidate.capabilityId,
    queueName: input.input.externalBetaQueueName ?? '',
    backendQueueAdapterRef: input.input.externalBetaBackendQueueAdapterRef ?? '',
    serviceRoleBoundaryRef: input.input.externalBetaServiceRoleBoundaryRef ?? '',
    workerPayloadSchemaRef: input.input.externalBetaWorkerPayloadSchemaRef ?? '',
    sourceGatewayCandidateRef: candidate.candidateRef,
    productionWorkerJobPayload: payload,
    sourceGatewayReadyWithProvidedEvidence:
      input.gateway.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence,
    adapterPayloadShapeValid,
    adapterPayloadReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
}

export function evaluateAiGraphicsExternalBetaWorkerEnqueueAdapter(
  input: AiGraphicsExternalBetaWorkerEnqueueAdapterInput,
): AiGraphicsExternalBetaWorkerEnqueueAdapter {
  const gateway =
    input.sourceExternalBetaToolCallGatewayPacket ??
    evaluateAiGraphicsExternalBetaToolCallGateway(input)
  const executionRequested =
    input.executionRequested === true || gateway.executionRequested === true
  const sourceGatewayAccepted = gatewayAccepted(gateway)
  const missingControls = executionRequested ? missingAdapterControls(input) : []
  const controlsSatisfied =
    executionRequested &&
    sourceGatewayAccepted &&
    missingControls.length === 0
  const adapterPayload = controlsSatisfied
    ? buildAdapterPayload({ input, gateway, adapterReady: controlsSatisfied })
    : null
  const payloadReady =
    adapterPayload?.adapterPayloadReadyWithProvidedEvidence === true
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    payloadReady &&
    gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      gateway,
      gatewayAccepted: sourceGatewayAccepted,
      executionRequested,
      adapterReady: payloadReady,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_WORKER_ENQUEUE_ADAPTER_DECISION,
    sourceExternalBetaToolCallGatewayDecision:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION,
    capabilityId: gateway.capabilityId,
    requestedToolId: gateway.requestedToolId,
    executionRequested,
    sourceExternalBetaToolCallGateway: gateway,
    sourceExternalBetaToolCallGatewayAccepted: sourceGatewayAccepted,
    missingAdapterControls: missingControls,
    externalBetaAdapterControlsSatisfied: controlsSatisfied,
    externalBetaWorkerEnqueueAdapterPayloadReadyWithProvidedEvidence: payloadReady,
    externalBetaWorkerEnqueueAdapterPayload: adapterPayload,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveBackendQueueSubmissionsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    adapterPolicy,
    booleans: {
      externalBetaWorkerEnqueueAdapterPrepared: true,
      sourceExternalBetaToolCallGatewayAccepted: sourceGatewayAccepted,
      externalBetaAdapterControlsSatisfied: controlsSatisfied,
      externalBetaWorkerEnqueueAdapterPayloadReadyWithProvidedEvidence: payloadReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      workerPayloadShapeValid: adapterPayload?.adapterPayloadShapeValid === true,
      backendQueueAdapterRefAccepted: controlsSatisfied,
      serviceRoleBoundaryAccepted: controlsSatisfied,
      workerPayloadSchemaAccepted: controlsSatisfied,
      privateStoragePolicyAccepted: controlsSatisfied,
      retryPolicyAccepted: controlsSatisfied,
      deadLetterPolicyAccepted: controlsSatisfied,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
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
  }
}
