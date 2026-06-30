import {
  AI_GRAPHICS_PRODUCTION_WORKER_QUEUE_ADMISSION_DECISION,
  acceptedAiGraphicsProductionWorkerQueueAdmission,
  evaluateAiGraphicsProductionWorkerQueueAdmission,
  type AiGraphicsProductionWorkerQueueAdmission,
  type AiGraphicsProductionWorkerQueueAdmissionEnvelope,
  type AiGraphicsProductionWorkerQueueAdmissionInput,
} from './ai-graphics-production-worker-queue-admission'
import type { ProductionToolId } from './production-tool-types'
import type {
  ProductionWorkerGateCheck,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_PRODUCTION_SERVICE_ROLE_QUEUE_TRANSACTION_DRY_PROOF_DECISION =
  'ai_graphics_production_service_role_queue_transaction_dry_proof_prepared_dispatch_blocked'

export type AiGraphicsProductionServiceRoleQueueTransactionDryProofStatus =
  | 'planning_metadata_selected'
  | 'missing_production_worker_queue_admission'
  | 'production_worker_queue_admission_rejected'
  | 'missing_production_service_role_queue_transaction_controls'
  | 'production_service_role_queue_transaction_dry_proof_prepared_dispatch_blocked'

export interface AiGraphicsProductionServiceRoleQueueTransactionDryProofInput
  extends AiGraphicsProductionWorkerQueueAdmissionInput {
  sourceProductionWorkerQueueAdmissionPacket?: AiGraphicsProductionWorkerQueueAdmission
  productionServiceRoleQueueTransactionRef?: string
  productionServiceRoleRpcSchemaRef?: string
  productionJobBatchTableRef?: string
  productionJobTableRef?: string
  productionWorkerClaimTableRef?: string
  productionWorkerEventTableRef?: string
  productionAuditEventTableRef?: string
  productionServiceRoleRollbackRef?: string
  productionDispatchDryProofRef?: string
  productionWorkerInstanceRef?: string
  productionWorkerLeasePolicyRef?: string
  productionWorkerDispatchPolicyRef?: string
}

export interface AiGraphicsProductionServiceRoleJobBatchRowCandidate {
  batchId: string
  workspaceId: string
  projectId: string
  queueName: string
  jobCount: 1
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsProductionServiceRoleJobRowCandidate {
  jobId: string
  jobType: 'ai_graphics_production_tool_runtime'
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  creditReservationId?: string
  toolExecutionPlanId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  idempotencyKey: string
  payload: ProductionWorkerJobPayload
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsProductionServiceRoleWorkerClaimInputCandidate {
  jobId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  workerInstanceRef: string
  claimMode: 'dry_proof_no_live_claim'
  status: 'prepared_not_claimed'
  liveClaimPerformed: false
}

export interface AiGraphicsProductionServiceRoleWorkerEventCandidate {
  jobId: string
  eventName:
    | 'production_ai_graphics_job_prepared_for_service_role_transaction'
    | 'production_ai_graphics_job_dispatch_dry_proof_blocked'
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsProductionServiceRoleAuditEventCandidate {
  auditEventRef: string
  eventName: 'production_ai_graphics_service_role_transaction_dry_proof_prepared'
  toolId: string
  capabilityId: string
  traceId: string | null
  status: 'prepared_not_inserted'
  liveInsertPerformed: false
}

export interface AiGraphicsProductionControlledDispatchDryProofCandidate {
  dryProofRef: string
  jobId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  workerInstanceRef: string
  sourceWorkerModeGate: ProductionWorkerGateCheck
  sourcePreDispatchGates: ProductionWorkerGateCheck[]
  sourcePreDispatchGatesAccepted: boolean
  dispatchBlockedByProductionBlockedMode: true
  status: 'prepared_not_dispatched'
  liveWorkerLeaseCreatedNow: false
  liveWorkerDispatchPerformedNow: false
  toolExecutionPerformedNow: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsProductionServiceRoleQueueTransactionDryProofEnvelope {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
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
  workerLeasePolicyRef: string
  workerDispatchPolicyRef: string
  sourceQueueAdmissionEnvelope: AiGraphicsProductionWorkerQueueAdmissionEnvelope
  sourceQueueAdmissionEnvelopeReadyWithProvidedEvidence: true
  jobBatchRowCandidate: AiGraphicsProductionServiceRoleJobBatchRowCandidate
  jobRowCandidate: AiGraphicsProductionServiceRoleJobRowCandidate
  workerClaimInputCandidate: AiGraphicsProductionServiceRoleWorkerClaimInputCandidate
  workerEventCandidates: [
    AiGraphicsProductionServiceRoleWorkerEventCandidate,
    AiGraphicsProductionServiceRoleWorkerEventCandidate,
  ]
  auditEventCandidate: AiGraphicsProductionServiceRoleAuditEventCandidate
  controlledDispatchDryProofCandidate: AiGraphicsProductionControlledDispatchDryProofCandidate
  serviceRoleTransactionEnvelopeShapeValid: boolean
  serviceRoleTransactionDryProofReadyWithProvidedEvidence: boolean
  controlledDispatchDryProofReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedProductionJob: boolean
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

export interface AiGraphicsProductionServiceRoleQueueTransactionDryProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_SERVICE_ROLE_QUEUE_TRANSACTION_DRY_PROOF_DECISION
  sourceProductionWorkerQueueAdmissionDecision:
    typeof AI_GRAPHICS_PRODUCTION_WORKER_QUEUE_ADMISSION_DECISION | null
  status: AiGraphicsProductionServiceRoleQueueTransactionDryProofStatus
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceProductionWorkerQueueAdmissionAccepted: boolean
  missingServiceRoleTransactionControls: string[]
  rejectionReasons: string[]
  productionServiceRoleTransactionControlsAccepted: boolean
  productionServiceRoleQueueTransactionDryProofReadyWithProvidedEvidence: boolean
  productionControlledDispatchDryProofReadyWithProvidedEvidence: boolean
  productionServiceRoleQueueTransactionDryProofEnvelope:
    AiGraphicsProductionServiceRoleQueueTransactionDryProofEnvelope | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 0 | 21
  runtimeReadyForOnDemandProductionToolCallTools: 0 | 21
  productionReadyNowTools: 0
  liveServiceRoleTransactionsNow: 0
  liveJobBatchRowsInsertedNow: 0
  liveJobRowsInsertedNow: 0
  liveWorkerClaimRowsInsertedNow: 0
  liveWorkerEventRowsInsertedNow: 0
  liveAuditEventRowsInsertedNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  policy: {
    sideEffectFreeTransactionDryProof: true
    sourceQueueAdmissionRequired: true
    serviceRoleQueueTransactionRefRequired: true
    serviceRoleRpcSchemaRequired: true
    serviceRoleTablesRequired: true
    workerLeasePolicyRequired: true
    workerDispatchPolicyRequired: true
    rollbackPlanRequired: true
    transactionEnvelopeOnly: true
    dispatchDryProofOnly: true
    dispatchBlockedByProductionBlockedMode: true
    runtimeStartsOnlyForAcceptedProductionWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    privateArtifactsOnly: true
    noPublicArtifactsByGate: true
    noSignedUrlsByGate: true
  }
  booleans: {
    productionServiceRoleQueueTransactionDryProofPrepared: true
    sourceProductionWorkerQueueAdmissionAccepted: boolean
    productionServiceRoleTransactionControlsAccepted: boolean
    productionServiceRoleQueueTransactionDryProofReadyWithProvidedEvidence: boolean
    productionControlledDispatchDryProofReadyWithProvidedEvidence: boolean
    serviceRoleTransactionEnvelopeShapeValid: boolean
    sourceQueueAdmissionEnvelopeAccepted: boolean
    sourceQueueJobCandidateAccepted: boolean
    sourceQueueBatchCandidateAccepted: boolean
    sourceQueueAuditCandidateAccepted: boolean
    serviceRoleQueueTransactionRefAccepted: boolean
    serviceRoleRpcSchemaAccepted: boolean
    serviceRoleTablesAccepted: boolean
    workerLeasePolicyAccepted: boolean
    workerDispatchPolicyAccepted: boolean
    rollbackPlanAccepted: boolean
    workerPayloadAcceptedByPreDispatchGates: boolean
    dispatchBlockedByProductionBlockedMode: boolean
    workerModeGateBlocksDispatch: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: boolean
    productionRouteReadyNow: boolean
    productionWorkerPathReadyNow: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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
    workerDispatchPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreated: false
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

const requiredPrivateRefFields = [
  'productionServiceRoleQueueTransactionRef',
  'productionServiceRoleRpcSchemaRef',
  'productionJobBatchTableRef',
  'productionJobTableRef',
  'productionWorkerClaimTableRef',
  'productionWorkerEventTableRef',
  'productionAuditEventTableRef',
  'productionServiceRoleRollbackRef',
  'productionDispatchDryProofRef',
  'productionWorkerInstanceRef',
  'productionWorkerLeasePolicyRef',
  'productionWorkerDispatchPolicyRef',
] as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function trim(value: string | undefined): string {
  return value?.trim() ?? ''
}

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!hasValue(value)) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('production-evidence://')
}

function missingServiceRoleControls(
  input: AiGraphicsProductionServiceRoleQueueTransactionDryProofInput,
): string[] {
  return requiredPrivateRefFields
    .filter((field) => !isPrivateEvidenceRef(input[field]))
    .map((field) => `${field}: private/backend production evidence ref is required`)
}

function traceIdFromPayload(payload: ProductionWorkerJobPayload): string | null {
  const value = payload.metadata?.productionTraceId
  return typeof value === 'string' && value.length > 0 ? value : null
}

function workerModeGateBlocksProductionDispatch(
  gate: ProductionWorkerGateCheck,
  payload: ProductionWorkerJobPayload,
): boolean {
  return (
    gate.gateName === 'worker_mode' &&
    gate.status === 'blocked' &&
    gate.hardBlock === true &&
    payload.executionMode === 'production_blocked'
  )
}

function buildDryProofEnvelope(input: {
  source: AiGraphicsProductionServiceRoleQueueTransactionDryProofInput
  queueAdmission: AiGraphicsProductionWorkerQueueAdmission
  controlsAccepted: boolean
}): AiGraphicsProductionServiceRoleQueueTransactionDryProofEnvelope | null {
  const sourceEnvelope = input.queueAdmission.productionWorkerQueueAdmissionEnvelope
  if (!sourceEnvelope) return null
  const payload = sourceEnvelope.productionWorkerJobPayload
  const transactionId = `production-ai-graphics-service-role-tx-${sourceEnvelope.queueJobCandidate.jobId}`
  const jobBatchRowCandidate: AiGraphicsProductionServiceRoleJobBatchRowCandidate = {
    batchId: sourceEnvelope.queueBatchCandidate.batchId,
    workspaceId: sourceEnvelope.queueBatchCandidate.workspaceId,
    projectId: sourceEnvelope.queueBatchCandidate.projectId,
    queueName: sourceEnvelope.queueBatchCandidate.queueName,
    jobCount: 1,
    status: 'prepared_not_inserted',
    liveInsertPerformed: false,
  }
  const jobRowCandidate: AiGraphicsProductionServiceRoleJobRowCandidate = {
    jobId: sourceEnvelope.queueJobCandidate.jobId,
    jobType: sourceEnvelope.queueJobCandidate.jobType,
    workspaceId: sourceEnvelope.queueJobCandidate.workspaceId,
    projectId: sourceEnvelope.queueJobCandidate.projectId,
    approvedSnapshotId: sourceEnvelope.queueJobCandidate.approvedSnapshotId,
    creditReservationId: sourceEnvelope.queueJobCandidate.creditReservationId,
    toolExecutionPlanId: sourceEnvelope.queueJobCandidate.toolExecutionPlanId,
    workerType: sourceEnvelope.queueJobCandidate.workerType,
    runtimeTarget: sourceEnvelope.queueJobCandidate.runtimeTarget,
    idempotencyKey: sourceEnvelope.queueJobCandidate.idempotencyKey,
    payload,
    status: 'prepared_not_inserted',
    liveInsertPerformed: false,
  }
  const workerClaimInputCandidate: AiGraphicsProductionServiceRoleWorkerClaimInputCandidate = {
    jobId: sourceEnvelope.queueJobCandidate.jobId,
    workerType: sourceEnvelope.workerType,
    runtimeTarget: sourceEnvelope.runtimeTarget,
    workerInstanceRef: trim(input.source.productionWorkerInstanceRef),
    claimMode: 'dry_proof_no_live_claim',
    status: 'prepared_not_claimed',
    liveClaimPerformed: false,
  }
  const workerEventCandidates: [
    AiGraphicsProductionServiceRoleWorkerEventCandidate,
    AiGraphicsProductionServiceRoleWorkerEventCandidate,
  ] = [
    {
      jobId: sourceEnvelope.queueJobCandidate.jobId,
      eventName: 'production_ai_graphics_job_prepared_for_service_role_transaction',
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
    {
      jobId: sourceEnvelope.queueJobCandidate.jobId,
      eventName: 'production_ai_graphics_job_dispatch_dry_proof_blocked',
      status: 'prepared_not_inserted',
      liveInsertPerformed: false,
    },
  ]
  const auditEventCandidate: AiGraphicsProductionServiceRoleAuditEventCandidate = {
    auditEventRef: sourceEnvelope.queueAuditCandidate.auditEventRef,
    eventName: 'production_ai_graphics_service_role_transaction_dry_proof_prepared',
    toolId: sourceEnvelope.toolId,
    capabilityId: sourceEnvelope.capabilityId,
    traceId: traceIdFromPayload(payload),
    status: 'prepared_not_inserted',
    liveInsertPerformed: false,
  }
  const dispatchBlocked =
    workerModeGateBlocksProductionDispatch(sourceEnvelope.dispatchBlockGateCheck, payload)
  const controlledDispatchDryProofCandidate:
    AiGraphicsProductionControlledDispatchDryProofCandidate = {
      dryProofRef: trim(input.source.productionDispatchDryProofRef),
      jobId: sourceEnvelope.queueJobCandidate.jobId,
      workerType: sourceEnvelope.workerType,
      runtimeTarget: sourceEnvelope.runtimeTarget,
      workerInstanceRef: trim(input.source.productionWorkerInstanceRef),
      sourceWorkerModeGate: sourceEnvelope.dispatchBlockGateCheck,
      sourcePreDispatchGates: sourceEnvelope.preDispatchGateChecks,
      sourcePreDispatchGatesAccepted: sourceEnvelope.preDispatchGatesAccepted,
      dispatchBlockedByProductionBlockedMode: true,
      status: 'prepared_not_dispatched',
      liveWorkerLeaseCreatedNow: false,
      liveWorkerDispatchPerformedNow: false,
      toolExecutionPerformedNow: false,
      gpuRuntimeShouldStartNow: false,
    }
  const serviceRoleTransactionEnvelopeShapeValid = Boolean(
    input.controlsAccepted &&
      sourceEnvelope.queueAdmissionEnvelopeReadyWithProvidedEvidence === true &&
      sourceEnvelope.queueAdmissionEnvelopeShapeValid === true &&
      sourceEnvelope.queueJobCandidate.status === 'prepared_not_submitted' &&
      sourceEnvelope.queueBatchCandidate.status === 'prepared_not_submitted' &&
      sourceEnvelope.queueAuditCandidate.liveInsertPerformed === false &&
      jobBatchRowCandidate.status === 'prepared_not_inserted' &&
      jobRowCandidate.status === 'prepared_not_inserted' &&
      workerClaimInputCandidate.status === 'prepared_not_claimed' &&
      workerEventCandidates.every((event) => event.status === 'prepared_not_inserted') &&
      auditEventCandidate.status === 'prepared_not_inserted' &&
      controlledDispatchDryProofCandidate.status === 'prepared_not_dispatched' &&
      sourceEnvelope.preDispatchGatesAccepted === true &&
      dispatchBlocked,
  )
  const ready =
    input.controlsAccepted && serviceRoleTransactionEnvelopeShapeValid

  return {
    toolId: sourceEnvelope.toolId,
    productionToolId: sourceEnvelope.productionToolId,
    workerType: sourceEnvelope.workerType,
    runtimeTarget: sourceEnvelope.runtimeTarget,
    capabilityId: sourceEnvelope.capabilityId,
    queueName: sourceEnvelope.queueName,
    transactionId,
    serviceRoleQueueTransactionRef:
      trim(input.source.productionServiceRoleQueueTransactionRef),
    serviceRoleRpcSchemaRef: trim(input.source.productionServiceRoleRpcSchemaRef),
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    workerEventRpcName: 'record_ai_graphics_worker_event',
    auditEventRpcName: 'record_ai_graphics_audit_event',
    jobBatchTableRef: trim(input.source.productionJobBatchTableRef),
    jobTableRef: trim(input.source.productionJobTableRef),
    workerClaimTableRef: trim(input.source.productionWorkerClaimTableRef),
    workerEventTableRef: trim(input.source.productionWorkerEventTableRef),
    auditEventTableRef: trim(input.source.productionAuditEventTableRef),
    rollbackRef: trim(input.source.productionServiceRoleRollbackRef),
    workerLeasePolicyRef: trim(input.source.productionWorkerLeasePolicyRef),
    workerDispatchPolicyRef: trim(input.source.productionWorkerDispatchPolicyRef),
    sourceQueueAdmissionEnvelope: sourceEnvelope,
    sourceQueueAdmissionEnvelopeReadyWithProvidedEvidence: true,
    jobBatchRowCandidate,
    jobRowCandidate,
    workerClaimInputCandidate,
    workerEventCandidates,
    auditEventCandidate,
    controlledDispatchDryProofCandidate,
    serviceRoleTransactionEnvelopeShapeValid,
    serviceRoleTransactionDryProofReadyWithProvidedEvidence: ready,
    controlledDispatchDryProofReadyWithProvidedEvidence: ready,
    gpuRuntimeStartAllowedForAcceptedProductionJob:
      sourceEnvelope.gpuRuntimeStartAllowedForAcceptedProductionJob,
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

function statusFromInput(input: {
  executionRequested: boolean
  hasSourceQueueAdmission: boolean
  sourceAccepted: boolean
  ready: boolean
}): AiGraphicsProductionServiceRoleQueueTransactionDryProofStatus {
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.hasSourceQueueAdmission) return 'missing_production_worker_queue_admission'
  if (!input.sourceAccepted) return 'production_worker_queue_admission_rejected'
  return input.ready
    ? 'production_service_role_queue_transaction_dry_proof_prepared_dispatch_blocked'
    : 'missing_production_service_role_queue_transaction_controls'
}

export function acceptedAiGraphicsProductionServiceRoleQueueTransactionDryProof(
  packet: AiGraphicsProductionServiceRoleQueueTransactionDryProof | undefined,
): packet is AiGraphicsProductionServiceRoleQueueTransactionDryProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_SERVICE_ROLE_QUEUE_TRANSACTION_DRY_PROOF_DECISION &&
      packet.status ===
        'production_service_role_queue_transaction_dry_proof_prepared_dispatch_blocked' &&
      packet.sourceProductionWorkerQueueAdmissionAccepted === true &&
      packet.productionServiceRoleTransactionControlsAccepted === true &&
      packet.productionServiceRoleQueueTransactionDryProofReadyWithProvidedEvidence === true &&
      packet.productionControlledDispatchDryProofReadyWithProvidedEvidence === true &&
      packet.productionServiceRoleQueueTransactionDryProofEnvelope !== null &&
      packet.productionServiceRoleQueueTransactionDryProofEnvelope
        .serviceRoleTransactionEnvelopeShapeValid === true &&
      packet.productionServiceRoleQueueTransactionDryProofEnvelope
        .controlledDispatchDryProofCandidate.dispatchBlockedByProductionBlockedMode === true &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.liveServiceRoleTransactionsNow === 0 &&
      packet.liveWorkerDispatchesNow === 0 &&
      packet.liveToolExecutionsNow === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.serviceRoleTransactionPerformed === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.toolExecutionPerformed === false,
  )
}

export function evaluateAiGraphicsProductionServiceRoleQueueTransactionDryProof(
  input: AiGraphicsProductionServiceRoleQueueTransactionDryProofInput = {},
): AiGraphicsProductionServiceRoleQueueTransactionDryProof {
  const queueAdmission =
    input.sourceProductionWorkerQueueAdmissionPacket ??
    evaluateAiGraphicsProductionWorkerQueueAdmission(input)
  const executionRequested =
    input.executionRequested === true || queueAdmission.executionRequested === true
  const sourceAccepted =
    acceptedAiGraphicsProductionWorkerQueueAdmission(queueAdmission)
  const missingControls =
    executionRequested && sourceAccepted ? missingServiceRoleControls(input) : []
  const controlsAccepted =
    executionRequested && sourceAccepted && missingControls.length === 0
  const envelope = controlsAccepted
    ? buildDryProofEnvelope({ source: input, queueAdmission, controlsAccepted })
    : null
  const ready =
    envelope?.serviceRoleTransactionDryProofReadyWithProvidedEvidence === true &&
    envelope.controlledDispatchDryProofReadyWithProvidedEvidence === true
  const accepted = controlsAccepted && ready
  const rejectionReasons = [
    executionRequested && !input.sourceProductionWorkerQueueAdmissionPacket
      ? 'source production worker queue-admission packet is missing'
      : undefined,
    executionRequested && input.sourceProductionWorkerQueueAdmissionPacket && !sourceAccepted
      ? 'source production worker queue-admission packet is not accepted'
      : undefined,
    ...missingControls,
    controlsAccepted && !ready
      ? 'production service-role queue transaction dry-proof envelope is not valid'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_PRODUCTION_SERVICE_ROLE_QUEUE_TRANSACTION_DRY_PROOF_DECISION,
    sourceProductionWorkerQueueAdmissionDecision: queueAdmission.decision ?? null,
    status: statusFromInput({
      executionRequested,
      hasSourceQueueAdmission: Boolean(input.sourceProductionWorkerQueueAdmissionPacket),
      sourceAccepted,
      ready: accepted,
    }),
    capabilityId: queueAdmission.capabilityId,
    requestedToolId: queueAdmission.requestedToolId,
    executionRequested,
    sourceProductionWorkerQueueAdmissionAccepted: sourceAccepted,
    missingServiceRoleTransactionControls: missingControls,
    rejectionReasons,
    productionServiceRoleTransactionControlsAccepted: accepted,
    productionServiceRoleQueueTransactionDryProofReadyWithProvidedEvidence: accepted,
    productionControlledDispatchDryProofReadyWithProvidedEvidence: accepted,
    productionServiceRoleQueueTransactionDryProofEnvelope: envelope,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: 0,
    liveServiceRoleTransactionsNow: 0,
    liveJobBatchRowsInsertedNow: 0,
    liveJobRowsInsertedNow: 0,
    liveWorkerClaimRowsInsertedNow: 0,
    liveWorkerEventRowsInsertedNow: 0,
    liveAuditEventRowsInsertedNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    policy: {
      sideEffectFreeTransactionDryProof: true,
      sourceQueueAdmissionRequired: true,
      serviceRoleQueueTransactionRefRequired: true,
      serviceRoleRpcSchemaRequired: true,
      serviceRoleTablesRequired: true,
      workerLeasePolicyRequired: true,
      workerDispatchPolicyRequired: true,
      rollbackPlanRequired: true,
      transactionEnvelopeOnly: true,
      dispatchDryProofOnly: true,
      dispatchBlockedByProductionBlockedMode: true,
      runtimeStartsOnlyForAcceptedProductionWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      privateArtifactsOnly: true,
      noPublicArtifactsByGate: true,
      noSignedUrlsByGate: true,
    },
    booleans: {
      productionServiceRoleQueueTransactionDryProofPrepared: true,
      sourceProductionWorkerQueueAdmissionAccepted: sourceAccepted,
      productionServiceRoleTransactionControlsAccepted: accepted,
      productionServiceRoleQueueTransactionDryProofReadyWithProvidedEvidence: accepted,
      productionControlledDispatchDryProofReadyWithProvidedEvidence: accepted,
      serviceRoleTransactionEnvelopeShapeValid:
        envelope?.serviceRoleTransactionEnvelopeShapeValid === true,
      sourceQueueAdmissionEnvelopeAccepted:
        envelope?.sourceQueueAdmissionEnvelope.queueAdmissionEnvelopeReadyWithProvidedEvidence === true,
      sourceQueueJobCandidateAccepted:
        envelope?.sourceQueueAdmissionEnvelope.queueJobCandidate.status === 'prepared_not_submitted',
      sourceQueueBatchCandidateAccepted:
        envelope?.sourceQueueAdmissionEnvelope.queueBatchCandidate.status === 'prepared_not_submitted',
      sourceQueueAuditCandidateAccepted:
        envelope?.sourceQueueAdmissionEnvelope.queueAuditCandidate.liveInsertPerformed === false,
      serviceRoleQueueTransactionRefAccepted: accepted,
      serviceRoleRpcSchemaAccepted: accepted,
      serviceRoleTablesAccepted: accepted,
      workerLeasePolicyAccepted: accepted,
      workerDispatchPolicyAccepted: accepted,
      rollbackPlanAccepted: accepted,
      workerPayloadAcceptedByPreDispatchGates:
        envelope?.sourceQueueAdmissionEnvelope.preDispatchGatesAccepted === true,
      dispatchBlockedByProductionBlockedMode:
        envelope?.controlledDispatchDryProofCandidate.dispatchBlockedByProductionBlockedMode === true,
      workerModeGateBlocksDispatch:
        envelope
          ? workerModeGateBlocksProductionDispatch(
              envelope.sourceQueueAdmissionEnvelope.dispatchBlockGateCheck,
              envelope.sourceQueueAdmissionEnvelope.productionWorkerJobPayload,
            )
          : false,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: accepted,
      runtimeReadyForOnDemandProductionToolCall: accepted,
      productionRouteReadyNow: accepted,
      productionWorkerPathReadyNow: accepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
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
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
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
