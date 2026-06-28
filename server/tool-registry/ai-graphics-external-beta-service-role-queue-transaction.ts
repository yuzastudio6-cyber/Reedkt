import {
  AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION,
  evaluateAiGraphicsExternalBetaBackendQueueSubmission,
  type AiGraphicsExternalBetaBackendQueueSubmission,
  type AiGraphicsExternalBetaBackendQueueSubmissionEnvelope,
  type AiGraphicsExternalBetaBackendQueueSubmissionInput,
} from './ai-graphics-external-beta-backend-queue-submission'
import type { ProductionToolId } from './production-tool-types'
import type { ProductionWorkerRuntimeType } from '../workers/production'

export const AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION =
  'ai_graphics_external_beta_service_role_queue_transaction_envelope_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaServiceRoleQueueTransactionStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_backend_queue_submission'
  | 'missing_external_beta_service_role_queue_transaction_controls'
  | 'external_beta_service_role_queue_transaction_envelope_ready'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaServiceRoleQueueTransactionInput
  extends AiGraphicsExternalBetaBackendQueueSubmissionInput {
  sourceExternalBetaBackendQueueSubmissionPacket?: AiGraphicsExternalBetaBackendQueueSubmission
  externalBetaServiceRoleQueueTransactionRef?: string
  externalBetaServiceRoleRpcSchemaRef?: string
  externalBetaJobBatchTableRef?: string
  externalBetaJobTableRef?: string
  externalBetaWorkerClaimTableRef?: string
  externalBetaWorkerEventTableRef?: string
  externalBetaAuditEventTableRef?: string
  externalBetaServiceRoleRollbackRef?: string
}

export interface AiGraphicsExternalBetaServiceRoleJobBatchRowCandidate {
  batchId: string
  workspaceId: string
  projectId: string
  queueName: string
  jobCount: 1
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaServiceRoleJobRowCandidate {
  jobId: string
  jobType: 'ai_graphics_tool_runtime'
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  creditReservationId?: string
  toolExecutionPlanId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  sourceGatewayRuntimeAdmissionMode: string
  idempotencyKey: string
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaServiceRoleWorkerClaimInputCandidate {
  jobId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  claimMode: 'future_worker_claim_only'
  status: 'prepared_not_claimed'
  liveClaimPerformed: false
}

export interface AiGraphicsExternalBetaServiceRoleWorkerEventCandidate {
  jobId: string
  eventName:
    | 'external_beta_ai_graphics_job_prepared_for_enqueue'
    | 'external_beta_ai_graphics_job_waiting_for_worker_claim'
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaServiceRoleAuditEventCandidate {
  auditEventRef: string
  eventName: 'external_beta_ai_graphics_service_role_transaction_prepared'
  toolId: string
  capabilityId: string
  traceId: string | null
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  sourceGatewayRuntimeAdmissionMode: string
  capabilityId: string
  queueName: string
  transactionId: string
  serviceRoleQueueTransactionRef: string
  serviceRoleRpcSchemaRef: string
  enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs'
  claimRpcName: 'claim_ai_graphics_tool_runtime_job'
  workerEventRpcName: 'record_ai_graphics_worker_event'
  auditEventRpcName: 'record_ai_graphics_audit_event'
  jobBatchTableRef: string
  jobTableRef: string
  workerClaimTableRef: string
  workerEventTableRef: string
  auditEventTableRef: string
  rollbackRef: string
  sourceQueueSubmissionEnvelope: AiGraphicsExternalBetaBackendQueueSubmissionEnvelope
  sourceQueueSubmissionProofBridgeAccepted: boolean
  jobBatchRowCandidate: AiGraphicsExternalBetaServiceRoleJobBatchRowCandidate
  jobRowCandidate: AiGraphicsExternalBetaServiceRoleJobRowCandidate
  workerClaimInputCandidate: AiGraphicsExternalBetaServiceRoleWorkerClaimInputCandidate
  workerEventCandidates: [
    AiGraphicsExternalBetaServiceRoleWorkerEventCandidate,
    AiGraphicsExternalBetaServiceRoleWorkerEventCandidate,
  ]
  auditEventCandidate: AiGraphicsExternalBetaServiceRoleAuditEventCandidate
  sourceQueueSubmissionEnvelopeReadyWithProvidedEvidence: boolean
  serviceRoleTransactionEnvelopeShapeValid: boolean
  serviceRoleTransactionEnvelopeReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  canRunServiceRoleTransactionNow: false
  canInsertJobBatchNow: false
  canInsertJobNow: false
  canCreateWorkerClaimNow: false
  canInsertWorkerEventNow: false
  canInsertAuditEventNow: false
  canDispatchWorkerNow: false
  canExecuteToolNow: false
}

export interface AiGraphicsExternalBetaServiceRoleQueueTransaction {
  decision: AiGraphicsExternalBetaServiceRoleQueueTransactionStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION
  sourceExternalBetaBackendQueueSubmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaBackendQueueSubmission: AiGraphicsExternalBetaBackendQueueSubmission
  sourceExternalBetaBackendQueueSubmissionAccepted: boolean
  sourceExternalBetaBackendQueueSubmissionProofBridgeAccepted: boolean
  missingServiceRoleTransactionControls: string[]
  externalBetaServiceRoleTransactionControlsSatisfied: boolean
  externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence: boolean
  externalBetaServiceRoleQueueTransactionEnvelope:
    AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  liveServiceRoleTransactionsNow: 0
  liveJobBatchRowsInsertedNow: 0
  liveJobRowsInsertedNow: 0
  liveWorkerClaimRowsInsertedNow: 0
  liveWorkerEventRowsInsertedNow: 0
  liveAuditEventRowsInsertedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  transactionPolicy: {
    sideEffectFreeTransactionCheck: true
    sourceQueueSubmissionEnvelopeRequired: true
    serviceRoleQueueTransactionRefRequired: true
    serviceRoleRpcSchemaRequired: true
    queueWriteAuthorizationRequired: true
    serviceRoleTablesRequired: true
    rollbackPlanRequired: true
    transactionEnvelopeOnly: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaServiceRoleQueueTransactionEnvelopePrepared: true
    sourceExternalBetaBackendQueueSubmissionAccepted: boolean
    sourceExternalBetaBackendQueueSubmissionProofBridgeAccepted: boolean
    externalBetaServiceRoleTransactionControlsSatisfied: boolean
    externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    serviceRoleTransactionEnvelopeShapeValid: boolean
    serviceRoleQueueTransactionRefAccepted: boolean
    serviceRoleRpcSchemaAccepted: boolean
    queueWriteAuthorizationAccepted: boolean
    serviceRoleTablesAccepted: boolean
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
    liveJobBatchInsertApprovedNow: false
    liveJobInsertApprovedNow: false
    liveWorkerClaimInsertApprovedNow: false
    liveWorkerEventInsertApprovedNow: false
    liveAuditEventInsertApprovedNow: false
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

const transactionPolicy = {
  sideEffectFreeTransactionCheck: true,
  sourceQueueSubmissionEnvelopeRequired: true,
  serviceRoleQueueTransactionRefRequired: true,
  serviceRoleRpcSchemaRequired: true,
  queueWriteAuthorizationRequired: true,
  serviceRoleTablesRequired: true,
  rollbackPlanRequired: true,
  transactionEnvelopeOnly: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function queueSubmissionProofBridgeAccepted(
  packet: AiGraphicsExternalBetaBackendQueueSubmission,
): boolean {
  const envelope = packet.externalBetaBackendQueueSubmissionEnvelope
  const metadata = envelope?.productionWorkerJobPayload.metadata
  const queueJobMetadata = envelope?.queueJobCandidate?.payload?.metadata

  return (
    packet.sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted === true &&
    envelope?.sourceAdapterProofBridgeAccepted === true &&
    metadata?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true &&
    queueJobMetadata?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true
  )
}

function queueSubmissionAccepted(packet: AiGraphicsExternalBetaBackendQueueSubmission): boolean {
  return packet.decision === 'external_beta_backend_queue_submission_envelope_ready' &&
    queueSubmissionProofBridgeAccepted(packet) &&
    packet.externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence === true &&
    packet.externalBetaBackendQueueSubmissionEnvelope !== null &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.backendQueueSubmissionPerformed === false &&
    packet.booleans.serviceRoleTransactionPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingTransactionControls(
  input: AiGraphicsExternalBetaServiceRoleQueueTransactionInput,
): string[] {
  return [
    !hasValue(input.externalBetaServiceRoleQueueTransactionRef)
      ? 'external beta service-role queue transaction reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleRpcSchemaRef)
      ? 'external beta service-role RPC schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaQueueWriteAuthorizationRef)
      ? 'external beta queue write authorization reference is missing'
      : undefined,
    !hasValue(input.externalBetaJobBatchTableRef)
      ? 'external beta job batch table reference is missing'
      : undefined,
    !hasValue(input.externalBetaJobTableRef)
      ? 'external beta job table reference is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerClaimTableRef)
      ? 'external beta worker claim table reference is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerEventTableRef)
      ? 'external beta worker event table reference is missing'
      : undefined,
    !hasValue(input.externalBetaAuditEventTableRef)
      ? 'external beta audit event table reference is missing'
      : undefined,
    !hasValue(input.externalBetaServiceRoleRollbackRef)
      ? 'external beta service-role rollback reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  queueSubmission: AiGraphicsExternalBetaBackendQueueSubmission
  sourceQueueSubmissionAccepted: boolean
  executionRequested: boolean
  transactionReady: boolean
}): AiGraphicsExternalBetaServiceRoleQueueTransactionStatus {
  if (input.queueSubmission.decision === 'invalid_capability_blocked') {
    return 'invalid_capability_blocked'
  }
  if (input.queueSubmission.decision === 'requested_tool_eliminated') {
    return 'requested_tool_eliminated'
  }
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.sourceQueueSubmissionAccepted) {
    return 'missing_external_beta_backend_queue_submission'
  }
  return input.transactionReady
    ? 'external_beta_service_role_queue_transaction_envelope_ready'
    : 'missing_external_beta_service_role_queue_transaction_controls'
}

function buildTransactionEnvelope(input: {
  input: AiGraphicsExternalBetaServiceRoleQueueTransactionInput
  sourceEnvelope: AiGraphicsExternalBetaBackendQueueSubmissionEnvelope
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope {
  const source = input.sourceEnvelope
  const payload = source.productionWorkerJobPayload
  const sourceQueueSubmissionProofBridgeAccepted =
    source.sourceAdapterProofBridgeAccepted === true &&
    payload.metadata?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true &&
    source.queueJobCandidate.payload.metadata
      ?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true
  const sourceGatewayRuntimeAdmissionMode =
    typeof payload.metadata?.sourceGatewayRuntimeAdmissionMode === 'string'
      ? payload.metadata.sourceGatewayRuntimeAdmissionMode
      : 'unknown'
  const transactionId = `external-beta-service-role-queue-tx-${source.queueJobCandidate.jobId}`
  const jobBatchRowCandidate: AiGraphicsExternalBetaServiceRoleJobBatchRowCandidate = {
    batchId: source.queueBatchCandidate.batchId,
    workspaceId: source.queueBatchCandidate.workspaceId,
    projectId: source.queueBatchCandidate.projectId,
    queueName: source.queueBatchCandidate.queueName,
    jobCount: 1,
    status: 'prepared_not_inserted',
    liveInsertPerformed: false,
  }
  const jobRowCandidate: AiGraphicsExternalBetaServiceRoleJobRowCandidate = {
    jobId: source.queueJobCandidate.jobId,
    jobType: 'ai_graphics_tool_runtime',
    workspaceId: source.queueJobCandidate.workspaceId,
    projectId: source.queueJobCandidate.projectId,
    approvedSnapshotId: source.queueJobCandidate.approvedSnapshotId,
    creditReservationId: source.queueJobCandidate.creditReservationId,
    toolExecutionPlanId: source.queueJobCandidate.toolExecutionPlanId,
    workerType: source.queueJobCandidate.workerType,
    runtimeTarget: source.queueJobCandidate.runtimeTarget,
    sourceGatewayRuntimeAdmissionMode,
    idempotencyKey: source.queueJobCandidate.idempotencyKey,
    status: 'prepared_not_inserted',
    liveInsertPerformed: false,
  }
  const workerClaimInputCandidate: AiGraphicsExternalBetaServiceRoleWorkerClaimInputCandidate = {
    jobId: source.queueJobCandidate.jobId,
    workerType: source.queueJobCandidate.workerType,
    runtimeTarget: source.queueJobCandidate.runtimeTarget,
    claimMode: 'future_worker_claim_only',
    status: 'prepared_not_claimed',
    liveClaimPerformed: false,
  }
  const workerEventCandidates: [
    AiGraphicsExternalBetaServiceRoleWorkerEventCandidate,
    AiGraphicsExternalBetaServiceRoleWorkerEventCandidate,
  ] = [
    {
      jobId: source.queueJobCandidate.jobId,
      eventName: 'external_beta_ai_graphics_job_prepared_for_enqueue',
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
    {
      jobId: source.queueJobCandidate.jobId,
      eventName: 'external_beta_ai_graphics_job_waiting_for_worker_claim',
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
  ]
  const auditEventCandidate: AiGraphicsExternalBetaServiceRoleAuditEventCandidate = {
    auditEventRef: source.queueAuditCandidate.auditEventRef,
    eventName: 'external_beta_ai_graphics_service_role_transaction_prepared',
    toolId: source.toolId,
    capabilityId: source.capabilityId,
    traceId: source.queueAuditCandidate.traceId,
    status: 'prepared_not_inserted',
    liveInsertPerformed: false,
  }
  const serviceRoleTransactionEnvelopeShapeValid = Boolean(
    transactionId &&
      jobBatchRowCandidate.batchId === source.queueBatchCandidate.batchId &&
      jobBatchRowCandidate.status === 'prepared_not_inserted' &&
      jobBatchRowCandidate.liveInsertPerformed === false &&
      jobRowCandidate.jobId === payload.jobId &&
      jobRowCandidate.jobType === 'ai_graphics_tool_runtime' &&
      jobRowCandidate.approvedSnapshotId === payload.approvedSnapshotId &&
      jobRowCandidate.toolExecutionPlanId === payload.toolExecutionPlanId &&
      jobRowCandidate.sourceGatewayRuntimeAdmissionMode === sourceGatewayRuntimeAdmissionMode &&
      sourceGatewayRuntimeAdmissionMode !== 'unknown' &&
      jobRowCandidate.idempotencyKey === payload.idempotencyKey &&
      jobRowCandidate.status === 'prepared_not_inserted' &&
      jobRowCandidate.liveInsertPerformed === false &&
      workerClaimInputCandidate.jobId === payload.jobId &&
      workerClaimInputCandidate.status === 'prepared_not_claimed' &&
      workerClaimInputCandidate.liveClaimPerformed === false &&
      workerEventCandidates.length === 2 &&
      workerEventCandidates.every((event) => (
        event.jobId === payload.jobId &&
        event.status === 'prepared_not_inserted' &&
        event.liveInsertPerformed === false
      )) &&
      sourceQueueSubmissionProofBridgeAccepted &&
      auditEventCandidate.auditEventRef &&
      auditEventCandidate.status === 'prepared_not_inserted' &&
      auditEventCandidate.liveInsertPerformed === false,
  )
  const serviceRoleTransactionEnvelopeReadyWithProvidedEvidence =
    input.controlsSatisfied &&
    source.submissionEnvelopeReadyWithProvidedEvidence &&
    serviceRoleTransactionEnvelopeShapeValid

  return {
    toolId: source.toolId,
    productionToolId: source.productionToolId,
    workerType: source.workerType,
    runtimeTarget: source.runtimeTarget,
    sourceGatewayRuntimeAdmissionMode,
    capabilityId: source.capabilityId,
    queueName: source.queueName,
    transactionId,
    serviceRoleQueueTransactionRef:
      input.input.externalBetaServiceRoleQueueTransactionRef ?? '',
    serviceRoleRpcSchemaRef: input.input.externalBetaServiceRoleRpcSchemaRef ?? '',
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    workerEventRpcName: 'record_ai_graphics_worker_event',
    auditEventRpcName: 'record_ai_graphics_audit_event',
    jobBatchTableRef: input.input.externalBetaJobBatchTableRef ?? '',
    jobTableRef: input.input.externalBetaJobTableRef ?? '',
    workerClaimTableRef: input.input.externalBetaWorkerClaimTableRef ?? '',
    workerEventTableRef: input.input.externalBetaWorkerEventTableRef ?? '',
    auditEventTableRef: input.input.externalBetaAuditEventTableRef ?? '',
    rollbackRef: input.input.externalBetaServiceRoleRollbackRef ?? '',
    sourceQueueSubmissionEnvelope: source,
    sourceQueueSubmissionProofBridgeAccepted,
    jobBatchRowCandidate,
    jobRowCandidate,
    workerClaimInputCandidate,
    workerEventCandidates,
    auditEventCandidate,
    sourceQueueSubmissionEnvelopeReadyWithProvidedEvidence:
      source.submissionEnvelopeReadyWithProvidedEvidence,
    serviceRoleTransactionEnvelopeShapeValid,
    serviceRoleTransactionEnvelopeReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      source.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    canRunServiceRoleTransactionNow: false,
    canInsertJobBatchNow: false,
    canInsertJobNow: false,
    canCreateWorkerClaimNow: false,
    canInsertWorkerEventNow: false,
    canInsertAuditEventNow: false,
    canDispatchWorkerNow: false,
    canExecuteToolNow: false,
  }
}

export function evaluateAiGraphicsExternalBetaServiceRoleQueueTransaction(
  input: AiGraphicsExternalBetaServiceRoleQueueTransactionInput,
): AiGraphicsExternalBetaServiceRoleQueueTransaction {
  const queueSubmission =
    input.sourceExternalBetaBackendQueueSubmissionPacket ??
    evaluateAiGraphicsExternalBetaBackendQueueSubmission(input)
  const executionRequested =
    input.executionRequested === true || queueSubmission.executionRequested === true
  const sourceQueueSubmissionProofBridgeAccepted =
    queueSubmissionProofBridgeAccepted(queueSubmission)
  const sourceQueueSubmissionAccepted = queueSubmissionAccepted(queueSubmission)
  const missingControls = executionRequested ? missingTransactionControls(input) : []
  const controlsSatisfied =
    executionRequested &&
    sourceQueueSubmissionAccepted &&
    missingControls.length === 0
  const sourceEnvelope = queueSubmission.externalBetaBackendQueueSubmissionEnvelope
  const transactionEnvelope =
    controlsSatisfied && sourceEnvelope
      ? buildTransactionEnvelope({ input, sourceEnvelope, controlsSatisfied })
      : null
  const envelopeReady =
    transactionEnvelope?.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence === true
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    envelopeReady &&
    transactionEnvelope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      queueSubmission,
      sourceQueueSubmissionAccepted,
      executionRequested,
      transactionReady: envelopeReady,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION,
    sourceExternalBetaBackendQueueSubmissionDecision:
      AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION,
    capabilityId: queueSubmission.capabilityId,
    requestedToolId: queueSubmission.requestedToolId,
    executionRequested,
    sourceExternalBetaBackendQueueSubmission: queueSubmission,
    sourceExternalBetaBackendQueueSubmissionAccepted: sourceQueueSubmissionAccepted,
    sourceExternalBetaBackendQueueSubmissionProofBridgeAccepted:
      sourceQueueSubmissionProofBridgeAccepted,
    missingServiceRoleTransactionControls: missingControls,
    externalBetaServiceRoleTransactionControlsSatisfied: controlsSatisfied,
    externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence:
      envelopeReady,
    externalBetaServiceRoleQueueTransactionEnvelope: transactionEnvelope,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    liveServiceRoleTransactionsNow: 0,
    liveJobBatchRowsInsertedNow: 0,
    liveJobRowsInsertedNow: 0,
    liveWorkerClaimRowsInsertedNow: 0,
    liveWorkerEventRowsInsertedNow: 0,
    liveAuditEventRowsInsertedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    transactionPolicy,
    booleans: {
      externalBetaServiceRoleQueueTransactionEnvelopePrepared: true,
      sourceExternalBetaBackendQueueSubmissionAccepted: sourceQueueSubmissionAccepted,
      sourceExternalBetaBackendQueueSubmissionProofBridgeAccepted:
        sourceQueueSubmissionProofBridgeAccepted,
      externalBetaServiceRoleTransactionControlsSatisfied: controlsSatisfied,
      externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence:
        envelopeReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      serviceRoleTransactionEnvelopeShapeValid:
        transactionEnvelope?.serviceRoleTransactionEnvelopeShapeValid === true,
      serviceRoleQueueTransactionRefAccepted: controlsSatisfied,
      serviceRoleRpcSchemaAccepted: controlsSatisfied,
      queueWriteAuthorizationAccepted: controlsSatisfied,
      serviceRoleTablesAccepted: controlsSatisfied,
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
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
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
