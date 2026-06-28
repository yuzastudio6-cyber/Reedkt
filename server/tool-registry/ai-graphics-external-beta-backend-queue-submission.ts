import {
  AI_GRAPHICS_EXTERNAL_BETA_WORKER_ENQUEUE_ADAPTER_DECISION,
  evaluateAiGraphicsExternalBetaWorkerEnqueueAdapter,
  type AiGraphicsExternalBetaWorkerEnqueueAdapter,
  type AiGraphicsExternalBetaWorkerEnqueueAdapterInput,
  type AiGraphicsExternalBetaWorkerEnqueueAdapterPayload,
} from './ai-graphics-external-beta-worker-enqueue-adapter'
import type { ProductionToolId } from './production-tool-types'
import type {
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION =
  'ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaBackendQueueSubmissionStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_worker_enqueue_adapter'
  | 'missing_external_beta_backend_queue_submission_controls'
  | 'external_beta_backend_queue_submission_envelope_ready'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaBackendQueueSubmissionInput
  extends AiGraphicsExternalBetaWorkerEnqueueAdapterInput {
  sourceExternalBetaWorkerEnqueueAdapterPacket?: AiGraphicsExternalBetaWorkerEnqueueAdapter
  externalBetaQueueSubmissionRef?: string
  externalBetaQueueSubmissionSchemaRef?: string
  externalBetaServiceRoleTransactionEnvelopeRef?: string
  externalBetaQueueWriteAuthorizationRef?: string
  externalBetaApprovedSnapshotPersistenceRef?: string
  externalBetaCreditReservationPersistenceRef?: string
  externalBetaPrivateArtifactPersistenceRef?: string
  externalBetaAuditEnvelopeRef?: string
  externalBetaRollbackPlanRef?: string
}

export interface AiGraphicsExternalBetaQueueBatchCandidate {
  batchId: string
  workspaceId: string
  projectId: string
  queueName: string
  jobCount: 1
  status: 'prepared_not_submitted'
  serviceRoleRequired: true
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaQueueJobCandidate {
  jobId: string
  jobType: 'ai_graphics_tool_runtime'
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  creditReservationId?: string
  toolExecutionPlanId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  idempotencyKey: string
  payload: ProductionWorkerJobPayload
  status: 'prepared_not_submitted'
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaQueueAuditCandidate {
  auditEventRef: string
  eventName: 'external_beta_ai_graphics_queue_submission_prepared'
  toolId: string
  capabilityId: string
  queueName: string
  traceId: string | null
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaBackendQueueSubmissionEnvelope {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityId: string
  queueName: string
  backendQueueSubmissionRef: string
  queueSubmissionSchemaRef: string
  serviceRoleTransactionEnvelopeRef: string
  queueWriteAuthorizationRef: string
  sourceAdapterCandidateRef: string
  sourceAdapterProofBridgeAccepted: boolean
  productionWorkerJobPayload: ProductionWorkerJobPayload
  queueBatchCandidate: AiGraphicsExternalBetaQueueBatchCandidate
  queueJobCandidate: AiGraphicsExternalBetaQueueJobCandidate
  queueAuditCandidate: AiGraphicsExternalBetaQueueAuditCandidate
  sourceAdapterPayloadReadyWithProvidedEvidence: boolean
  submissionEnvelopeShapeValid: boolean
  submissionEnvelopeReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  serviceRoleTransactionPerformed: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsExternalBetaBackendQueueSubmission {
  decision: AiGraphicsExternalBetaBackendQueueSubmissionStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION
  sourceExternalBetaWorkerEnqueueAdapterDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_ENQUEUE_ADAPTER_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaWorkerEnqueueAdapter: AiGraphicsExternalBetaWorkerEnqueueAdapter
  sourceExternalBetaWorkerEnqueueAdapterAccepted: boolean
  sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted: boolean
  missingQueueSubmissionControls: string[]
  externalBetaQueueSubmissionControlsSatisfied: boolean
  externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: boolean
  externalBetaBackendQueueSubmissionEnvelope:
    AiGraphicsExternalBetaBackendQueueSubmissionEnvelope | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveBackendQueueSubmissionsNow: 0
  liveServiceRoleTransactionsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  submissionPolicy: {
    sideEffectFreeSubmissionCheck: true
    sourceAdapterPayloadRequired: true
    queueSubmissionRefRequired: true
    queueSubmissionSchemaRequired: true
    serviceRoleTransactionEnvelopeRequired: true
    queueWriteAuthorizationRequired: true
    approvedSnapshotPersistenceRequired: true
    creditReservationPersistenceRequired: true
    privateArtifactPersistenceRequired: true
    auditEnvelopeRequired: true
    rollbackPlanRequired: true
    queueSubmissionEnvelopeOnly: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaBackendQueueSubmissionEnvelopePrepared: true
    sourceExternalBetaWorkerEnqueueAdapterAccepted: boolean
    sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted: boolean
    externalBetaQueueSubmissionControlsSatisfied: boolean
    externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    queueSubmissionEnvelopeShapeValid: boolean
    queueSubmissionRefAccepted: boolean
    queueSubmissionSchemaAccepted: boolean
    serviceRoleTransactionEnvelopeAccepted: boolean
    queueWriteAuthorizationAccepted: boolean
    approvedSnapshotPersistenceAccepted: boolean
    creditReservationPersistenceAccepted: boolean
    privateArtifactPersistenceAccepted: boolean
    auditEnvelopeAccepted: boolean
    rollbackPlanAccepted: boolean
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
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
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

const submissionPolicy = {
  sideEffectFreeSubmissionCheck: true,
  sourceAdapterPayloadRequired: true,
  queueSubmissionRefRequired: true,
  queueSubmissionSchemaRequired: true,
  serviceRoleTransactionEnvelopeRequired: true,
  queueWriteAuthorizationRequired: true,
  approvedSnapshotPersistenceRequired: true,
  creditReservationPersistenceRequired: true,
  privateArtifactPersistenceRequired: true,
  auditEnvelopeRequired: true,
  rollbackPlanRequired: true,
  queueSubmissionEnvelopeOnly: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function adapterAccepted(packet: AiGraphicsExternalBetaWorkerEnqueueAdapter): boolean {
  return packet.decision === 'external_beta_worker_enqueue_adapter_payload_ready' &&
    packet.sourceExternalBetaToolCallGatewayProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaToolCallGatewayProofBridgeAccepted === true &&
    packet.externalBetaWorkerEnqueueAdapterPayload
      ?.productionWorkerJobPayload.metadata?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true &&
    packet.externalBetaWorkerEnqueueAdapterPayloadReadyWithProvidedEvidence === true &&
    packet.externalBetaWorkerEnqueueAdapterPayload !== null &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.backendQueueSubmissionPerformed === false &&
    packet.booleans.workerEnqueuePerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingQueueSubmissionControls(
  input: AiGraphicsExternalBetaBackendQueueSubmissionInput,
): string[] {
  return [
    !hasValue(input.externalBetaQueueSubmissionRef)
      ? 'external beta queue submission reference is missing'
      : undefined,
    !hasValue(input.externalBetaQueueSubmissionSchemaRef)
      ? 'external beta queue submission schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleTransactionEnvelopeRef)
      ? 'external beta service-role transaction envelope reference is missing'
      : undefined,
    !hasValue(input.externalBetaQueueWriteAuthorizationRef)
      ? 'external beta queue write authorization reference is missing'
      : undefined,
    !hasValue(input.externalBetaApprovedSnapshotPersistenceRef)
      ? 'external beta approved snapshot persistence reference is missing'
      : undefined,
    !hasValue(input.externalBetaCreditReservationPersistenceRef)
      ? 'external beta credit reservation persistence reference is missing'
      : undefined,
    !hasValue(input.externalBetaPrivateArtifactPersistenceRef)
      ? 'external beta private artifact persistence reference is missing'
      : undefined,
    !hasValue(input.externalBetaAuditEnvelopeRef)
      ? 'external beta audit envelope reference is missing'
      : undefined,
    !hasValue(input.externalBetaRollbackPlanRef)
      ? 'external beta rollback plan reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  adapter: AiGraphicsExternalBetaWorkerEnqueueAdapter
  sourceAdapterAccepted: boolean
  executionRequested: boolean
  submissionReady: boolean
}): AiGraphicsExternalBetaBackendQueueSubmissionStatus {
  if (input.adapter.decision === 'invalid_capability_blocked') return 'invalid_capability_blocked'
  if (input.adapter.decision === 'requested_tool_eliminated') return 'requested_tool_eliminated'
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.sourceAdapterAccepted) return 'missing_external_beta_worker_enqueue_adapter'
  return input.submissionReady
    ? 'external_beta_backend_queue_submission_envelope_ready'
    : 'missing_external_beta_backend_queue_submission_controls'
}

function traceIdFromPayload(payload: ProductionWorkerJobPayload): string | null {
  const value = payload.metadata?.sourceGatewayTraceId
  return typeof value === 'string' && value.length > 0 ? value : null
}

function buildSubmissionEnvelope(input: {
  input: AiGraphicsExternalBetaBackendQueueSubmissionInput
  adapterPayload: AiGraphicsExternalBetaWorkerEnqueueAdapterPayload
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaBackendQueueSubmissionEnvelope {
  const payload = input.adapterPayload.productionWorkerJobPayload
  const sourceAdapterProofBridgeAccepted =
    payload.metadata?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true
  const queueBatchCandidate: AiGraphicsExternalBetaQueueBatchCandidate = {
    batchId: `external-beta-ai-graphics-batch-${payload.workspaceId}-${payload.projectId}`,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    queueName: input.adapterPayload.queueName,
    jobCount: 1,
    status: 'prepared_not_submitted',
    serviceRoleRequired: true,
    liveInsertPerformed: false,
  }
  const queueJobCandidate: AiGraphicsExternalBetaQueueJobCandidate = {
    jobId: payload.jobId,
    jobType: 'ai_graphics_tool_runtime',
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    approvedSnapshotId: payload.approvedSnapshotId,
    creditReservationId: payload.creditReservationId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    workerType: payload.workerType,
    runtimeTarget: input.adapterPayload.runtimeTarget,
    idempotencyKey: payload.idempotencyKey,
    payload,
    status: 'prepared_not_submitted',
    liveInsertPerformed: false,
  }
  const queueAuditCandidate: AiGraphicsExternalBetaQueueAuditCandidate = {
    auditEventRef: input.input.externalBetaAuditEnvelopeRef ?? '',
    eventName: 'external_beta_ai_graphics_queue_submission_prepared',
    toolId: input.adapterPayload.toolId,
    capabilityId: input.adapterPayload.capabilityId,
    queueName: input.adapterPayload.queueName,
    traceId: traceIdFromPayload(payload),
    liveInsertPerformed: false,
  }
  const submissionEnvelopeShapeValid = Boolean(
    queueBatchCandidate.batchId &&
      queueBatchCandidate.workspaceId === payload.workspaceId &&
      queueBatchCandidate.projectId === payload.projectId &&
      queueBatchCandidate.jobCount === 1 &&
      queueBatchCandidate.liveInsertPerformed === false &&
      queueJobCandidate.jobId === payload.jobId &&
      queueJobCandidate.approvedSnapshotId === payload.approvedSnapshotId &&
      queueJobCandidate.toolExecutionPlanId === payload.toolExecutionPlanId &&
      queueJobCandidate.idempotencyKey === payload.idempotencyKey &&
      queueJobCandidate.status === 'prepared_not_submitted' &&
      queueJobCandidate.liveInsertPerformed === false &&
      sourceAdapterProofBridgeAccepted &&
      queueAuditCandidate.auditEventRef &&
      queueAuditCandidate.liveInsertPerformed === false,
  )
  const submissionEnvelopeReadyWithProvidedEvidence =
    input.controlsSatisfied &&
    input.adapterPayload.adapterPayloadReadyWithProvidedEvidence &&
    submissionEnvelopeShapeValid

  return {
    toolId: input.adapterPayload.toolId,
    productionToolId: input.adapterPayload.productionToolId,
    workerType: input.adapterPayload.workerType,
    runtimeTarget: input.adapterPayload.runtimeTarget,
    capabilityId: input.adapterPayload.capabilityId,
    queueName: input.adapterPayload.queueName,
    backendQueueSubmissionRef: input.input.externalBetaQueueSubmissionRef ?? '',
    queueSubmissionSchemaRef: input.input.externalBetaQueueSubmissionSchemaRef ?? '',
    serviceRoleTransactionEnvelopeRef:
      input.input.externalBetaServiceRoleTransactionEnvelopeRef ?? '',
    queueWriteAuthorizationRef: input.input.externalBetaQueueWriteAuthorizationRef ?? '',
    sourceAdapterCandidateRef: input.adapterPayload.sourceGatewayCandidateRef,
    sourceAdapterProofBridgeAccepted,
    productionWorkerJobPayload: payload,
    queueBatchCandidate,
    queueJobCandidate,
    queueAuditCandidate,
    sourceAdapterPayloadReadyWithProvidedEvidence:
      input.adapterPayload.adapterPayloadReadyWithProvidedEvidence,
    submissionEnvelopeShapeValid,
    submissionEnvelopeReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.adapterPayload.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
}

export function evaluateAiGraphicsExternalBetaBackendQueueSubmission(
  input: AiGraphicsExternalBetaBackendQueueSubmissionInput,
): AiGraphicsExternalBetaBackendQueueSubmission {
  const adapter =
    input.sourceExternalBetaWorkerEnqueueAdapterPacket ??
    evaluateAiGraphicsExternalBetaWorkerEnqueueAdapter(input)
  const executionRequested =
    input.executionRequested === true || adapter.executionRequested === true
  const sourceAdapterProofBridgeAccepted =
    adapter.sourceExternalBetaToolCallGatewayProofBridgeAccepted === true &&
    adapter.booleans.sourceExternalBetaToolCallGatewayProofBridgeAccepted === true &&
    adapter.externalBetaWorkerEnqueueAdapterPayload
      ?.productionWorkerJobPayload.metadata?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true
  const sourceAdapterAccepted = adapterAccepted(adapter)
  const missingControls = executionRequested ? missingQueueSubmissionControls(input) : []
  const controlsSatisfied =
    executionRequested &&
    sourceAdapterAccepted &&
    missingControls.length === 0
  const adapterPayload = adapter.externalBetaWorkerEnqueueAdapterPayload
  const submissionEnvelope =
    controlsSatisfied && adapterPayload
      ? buildSubmissionEnvelope({ input, adapterPayload, controlsSatisfied })
      : null
  const envelopeReady =
    submissionEnvelope?.submissionEnvelopeReadyWithProvidedEvidence === true
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    envelopeReady &&
    adapter.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      adapter,
      sourceAdapterAccepted,
      executionRequested,
      submissionReady: envelopeReady,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION,
    sourceExternalBetaWorkerEnqueueAdapterDecision:
      AI_GRAPHICS_EXTERNAL_BETA_WORKER_ENQUEUE_ADAPTER_DECISION,
    capabilityId: adapter.capabilityId,
    requestedToolId: adapter.requestedToolId,
    executionRequested,
    sourceExternalBetaWorkerEnqueueAdapter: adapter,
    sourceExternalBetaWorkerEnqueueAdapterAccepted: sourceAdapterAccepted,
    sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted:
      sourceAdapterProofBridgeAccepted,
    missingQueueSubmissionControls: missingControls,
    externalBetaQueueSubmissionControlsSatisfied: controlsSatisfied,
    externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: envelopeReady,
    externalBetaBackendQueueSubmissionEnvelope: submissionEnvelope,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveBackendQueueSubmissionsNow: 0,
    liveServiceRoleTransactionsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    submissionPolicy,
    booleans: {
      externalBetaBackendQueueSubmissionEnvelopePrepared: true,
      sourceExternalBetaWorkerEnqueueAdapterAccepted: sourceAdapterAccepted,
      sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted:
        sourceAdapterProofBridgeAccepted,
      externalBetaQueueSubmissionControlsSatisfied: controlsSatisfied,
      externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence: envelopeReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      queueSubmissionEnvelopeShapeValid:
        submissionEnvelope?.submissionEnvelopeShapeValid === true,
      queueSubmissionRefAccepted: controlsSatisfied,
      queueSubmissionSchemaAccepted: controlsSatisfied,
      serviceRoleTransactionEnvelopeAccepted: controlsSatisfied,
      queueWriteAuthorizationAccepted: controlsSatisfied,
      approvedSnapshotPersistenceAccepted: controlsSatisfied,
      creditReservationPersistenceAccepted: controlsSatisfied,
      privateArtifactPersistenceAccepted: controlsSatisfied,
      auditEnvelopeAccepted: controlsSatisfied,
      rollbackPlanAccepted: controlsSatisfied,
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
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
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
