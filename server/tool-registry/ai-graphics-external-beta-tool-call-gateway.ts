import {
  AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION,
  evaluateAiGraphicsExternalBetaRuntimeAdmission,
  type AiGraphicsExternalBetaRuntimeAdmission,
  type AiGraphicsExternalBetaRuntimeAdmissionInput,
} from './ai-graphics-external-beta-runtime-admission'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION =
  'ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaToolCallGatewayStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_runtime_admission'
  | 'missing_external_beta_gateway_controls'
  | 'external_beta_worker_enqueue_candidate_ready'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaToolCallGatewayInput
  extends AiGraphicsExternalBetaRuntimeAdmissionInput {
  sourceExternalBetaRuntimeAdmissionPacket?: AiGraphicsExternalBetaRuntimeAdmission
  externalBetaUserId?: string
  externalBetaWorkspaceId?: string
  externalBetaRequestId?: string
  externalBetaToolCallGatewayRef?: string
  externalBetaFeatureFlagEvaluationRef?: string
  externalBetaRolloutAssignmentRef?: string
  externalBetaRateLimitDecisionRef?: string
  externalBetaCostCeilingDecisionRef?: string
  externalBetaAuditEventRef?: string
  externalBetaTraceId?: string
  externalBetaIdempotencyKey?: string
  externalBetaWorkerEnqueueCandidateRef?: string
}

export interface AiGraphicsExternalBetaWorkerEnqueueCandidate {
  candidateRef: string
  requestId: string
  workspaceId: string
  toolId: string
  productionToolId: string | null
  workerType: string
  capabilityId: string
  runtimeTarget: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  artifactBoundaryApprovalRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  runtimeEnqueueApprovalRef: string
  ownerRuntimeApprovalRef: string
  gpuRequiredForRuntime: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  idempotencyKey: string
  traceId: string
  workerQueueApprovedNow: false
  workerEnqueuePerformed: false
}

export interface AiGraphicsExternalBetaToolCallGateway {
  decision: AiGraphicsExternalBetaToolCallGatewayStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION
  sourceExternalBetaRuntimeAdmissionDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaRuntimeAdmission: AiGraphicsExternalBetaRuntimeAdmission
  sourceExternalBetaRuntimeAdmissionAccepted: boolean
  missingGatewayControls: string[]
  externalBetaGatewayControlsSatisfied: boolean
  externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: boolean
  externalBetaWorkerEnqueueCandidate: AiGraphicsExternalBetaWorkerEnqueueCandidate | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gatewayPolicy: {
    sideEffectFreeGatewayCheck: true
    externalBetaUserAndWorkspaceRequired: true
    featureFlagEvaluationRequired: true
    rolloutAssignmentRequired: true
    rateLimitDecisionRequired: true
    costCeilingDecisionRequired: true
    auditTraceRequired: true
    idempotencyKeyRequired: true
    workerEnqueueCandidateOnly: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaToolCallGatewayPrepared: true
    sourceExternalBetaRuntimeAdmissionAccepted: boolean
    externalBetaGatewayControlsSatisfied: boolean
    externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    externalBetaFeatureFlagEvaluated: boolean
    externalBetaRolloutAssignmentAccepted: boolean
    externalBetaRateLimitAccepted: boolean
    externalBetaCostCeilingAccepted: boolean
    externalBetaAuditTracePrepared: boolean
    externalBetaIdempotencyKeyAccepted: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
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

const gatewayPolicy = {
  sideEffectFreeGatewayCheck: true,
  externalBetaUserAndWorkspaceRequired: true,
  featureFlagEvaluationRequired: true,
  rolloutAssignmentRequired: true,
  rateLimitDecisionRequired: true,
  costCeilingDecisionRequired: true,
  auditTraceRequired: true,
  idempotencyKeyRequired: true,
  workerEnqueueCandidateOnly: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function runtimeAdmissionAccepted(packet: AiGraphicsExternalBetaRuntimeAdmission): boolean {
  return packet.decision === 'external_beta_runtime_admission_ready_for_worker_enqueue' &&
    packet.externalBetaRuntimeAdmissionReadyWithProvidedEvidence === true &&
    packet.externalBetaWorkerEnqueueAllowedWithProvidedEvidence === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerQueueApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingGatewayControls(input: AiGraphicsExternalBetaToolCallGatewayInput): string[] {
  return [
    !hasValue(input.externalBetaUserId) ? 'external beta user id is missing' : undefined,
    !hasValue(input.externalBetaWorkspaceId) ? 'external beta workspace id is missing' : undefined,
    !hasValue(input.externalBetaRequestId) ? 'external beta request id is missing' : undefined,
    !hasValue(input.externalBetaToolCallGatewayRef)
      ? 'external beta tool-call gateway reference is missing'
      : undefined,
    !hasValue(input.externalBetaFeatureFlagEvaluationRef)
      ? 'external beta feature flag evaluation reference is missing'
      : undefined,
    !hasValue(input.externalBetaRolloutAssignmentRef)
      ? 'external beta rollout assignment reference is missing'
      : undefined,
    !hasValue(input.externalBetaRateLimitDecisionRef)
      ? 'external beta rate-limit decision reference is missing'
      : undefined,
    !hasValue(input.externalBetaCostCeilingDecisionRef)
      ? 'external beta cost-ceiling decision reference is missing'
      : undefined,
    !hasValue(input.externalBetaAuditEventRef)
      ? 'external beta audit event reference is missing'
      : undefined,
    !hasValue(input.externalBetaTraceId) ? 'external beta trace id is missing' : undefined,
    !hasValue(input.externalBetaIdempotencyKey)
      ? 'external beta idempotency key is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerEnqueueCandidateRef)
      ? 'external beta worker enqueue candidate reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  runtimeAdmission: AiGraphicsExternalBetaRuntimeAdmission
  runtimeAccepted: boolean
  executionRequested: boolean
  gatewayReady: boolean
}): AiGraphicsExternalBetaToolCallGatewayStatus {
  if (input.runtimeAdmission.decision === 'invalid_capability_blocked') return 'invalid_capability_blocked'
  if (input.runtimeAdmission.decision === 'requested_tool_eliminated') return 'requested_tool_eliminated'
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.runtimeAccepted) return 'missing_external_beta_runtime_admission'
  return input.gatewayReady
    ? 'external_beta_worker_enqueue_candidate_ready'
    : 'missing_external_beta_gateway_controls'
}

function buildWorkerCandidate(input: {
  input: AiGraphicsExternalBetaToolCallGatewayInput
  runtimeAdmission: AiGraphicsExternalBetaRuntimeAdmission
  ready: boolean
}): AiGraphicsExternalBetaWorkerEnqueueCandidate | null {
  if (!input.ready) return null
  const tool = input.runtimeAdmission.onDemandRuntimeAdmission.selectedTool
  if (!tool) return null
  return {
    candidateRef: input.input.externalBetaWorkerEnqueueCandidateRef ?? '',
    requestId: input.input.externalBetaRequestId ?? '',
    workspaceId: input.input.externalBetaWorkspaceId ?? '',
    toolId: tool.toolId,
    productionToolId: tool.productionToolId,
    workerType: tool.workerType,
    capabilityId: input.runtimeAdmission.capabilityId,
    runtimeTarget: tool.runtimeTarget,
    approvedPlanSnapshotId: input.input.approvedPlanSnapshotId ?? '',
    creditReservationId: input.input.creditReservationId ?? '',
    privateArtifactManifestRef: input.input.privateArtifactManifestRef ?? '',
    artifactBoundaryApprovalRef: input.input.artifactBoundaryApprovalRef ?? '',
    toolRouteApprovalRef: input.input.toolRouteApprovalRef ?? '',
    workerApprovalRef: input.input.workerApprovalRef ?? '',
    runtimeEnqueueApprovalRef: input.input.runtimeEnqueueApprovalRef ?? '',
    ownerRuntimeApprovalRef: input.input.ownerRuntimeApprovalRef ?? '',
    gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.runtimeAdmission.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    idempotencyKey: input.input.externalBetaIdempotencyKey ?? '',
    traceId: input.input.externalBetaTraceId ?? '',
    workerQueueApprovedNow: false,
    workerEnqueuePerformed: false,
  }
}

export function evaluateAiGraphicsExternalBetaToolCallGateway(
  input: AiGraphicsExternalBetaToolCallGatewayInput,
): AiGraphicsExternalBetaToolCallGateway {
  const runtimeAdmission =
    input.sourceExternalBetaRuntimeAdmissionPacket ??
    evaluateAiGraphicsExternalBetaRuntimeAdmission(input)
  const executionRequested =
    input.executionRequested === true || runtimeAdmission.executionRequested === true
  const runtimeAccepted = runtimeAdmissionAccepted(runtimeAdmission)
  const missingGateway = executionRequested ? missingGatewayControls(input) : []
  const gatewayReady =
    executionRequested &&
    runtimeAccepted &&
    missingGateway.length === 0
  const workerCandidate = buildWorkerCandidate({ input, runtimeAdmission, ready: gatewayReady })
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    gatewayReady && runtimeAdmission.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      runtimeAdmission,
      runtimeAccepted,
      executionRequested,
      gatewayReady,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION,
    sourceExternalBetaRuntimeAdmissionDecision:
      AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION,
    capabilityId: runtimeAdmission.capabilityId,
    requestedToolId: runtimeAdmission.requestedToolId,
    executionRequested,
    sourceExternalBetaRuntimeAdmission: runtimeAdmission,
    sourceExternalBetaRuntimeAdmissionAccepted: runtimeAccepted,
    missingGatewayControls: missingGateway,
    externalBetaGatewayControlsSatisfied: gatewayReady,
    externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: gatewayReady,
    externalBetaWorkerEnqueueCandidate: workerCandidate,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gatewayPolicy,
    booleans: {
      externalBetaToolCallGatewayPrepared: true,
      sourceExternalBetaRuntimeAdmissionAccepted: runtimeAccepted,
      externalBetaGatewayControlsSatisfied: gatewayReady,
      externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence: gatewayReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      externalBetaFeatureFlagEvaluated: gatewayReady,
      externalBetaRolloutAssignmentAccepted: gatewayReady,
      externalBetaRateLimitAccepted: gatewayReady,
      externalBetaCostCeilingAccepted: gatewayReady,
      externalBetaAuditTracePrepared: gatewayReady,
      externalBetaIdempotencyKeyAccepted: gatewayReady,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
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
