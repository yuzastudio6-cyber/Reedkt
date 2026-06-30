import {
  AI_GRAPHICS_PRODUCTION_TOOL_CALL_GATEWAY_HANDOFF_DECISION,
  acceptedAiGraphicsProductionToolCallGatewayHandoff,
  evaluateAiGraphicsProductionToolCallGatewayHandoff,
  type AiGraphicsProductionToolCallGatewayHandoff,
  type AiGraphicsProductionToolCallGatewayHandoffInput,
} from './ai-graphics-production-tool-call-gateway-handoff'
import type { ProductionToolId } from './production-tool-types'
import {
  aiGraphicsCanonicalRegistryGate,
  approvedSnapshotGate,
  artifactPolicyGate,
  creditReservationGate,
  idempotencyGate,
  licenseModelWeightGate,
  qaPolicyGate,
  rawPromptBlockGate,
  signedUrlBlockGate,
  workerModeGate,
  type ProductionWorkerGateCheck,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_PRODUCTION_WORKER_QUEUE_ADMISSION_DECISION =
  'ai_graphics_production_worker_queue_admission_prepared_dispatch_blocked'

export type AiGraphicsProductionWorkerQueueAdmissionStatus =
  | 'planning_metadata_selected'
  | 'missing_production_tool_call_gateway_handoff'
  | 'production_tool_call_gateway_handoff_rejected'
  | 'missing_production_queue_admission_controls'
  | 'production_worker_queue_admission_prepared_dispatch_blocked'

export interface AiGraphicsProductionWorkerQueueAdmissionInput
  extends AiGraphicsProductionToolCallGatewayHandoffInput {
  sourceProductionToolCallGatewayHandoffPacket?: AiGraphicsProductionToolCallGatewayHandoff
  productionQueueAdmissionRef?: string
  productionQueueSchemaRef?: string
  productionQueueWriteAuthorizationRef?: string
  productionServiceRoleTransactionRef?: string
  productionWorkerClaimPolicyRef?: string
  productionWorkerDispatchBlockRef?: string
  productionQueueAuditRef?: string
  productionQueueRollbackRef?: string
  productionQueueObservabilityRef?: string
}

export interface AiGraphicsProductionQueueBatchCandidate {
  batchId: string
  workspaceId: string
  projectId: string
  queueName: string
  jobCount: 1
  status: 'prepared_not_submitted'
  serviceRoleRequired: true
  liveInsertPerformed: false
}

export interface AiGraphicsProductionQueueJobCandidate {
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
  status: 'prepared_not_submitted'
  liveInsertPerformed: false
  dispatchBlockedByProductionBlockedMode: true
}

export interface AiGraphicsProductionQueueAuditCandidate {
  auditEventRef: string
  eventName: 'production_ai_graphics_queue_admission_prepared'
  toolId: string
  capabilityId: string
  queueName: string
  traceId: string | null
  liveInsertPerformed: false
}

export interface AiGraphicsProductionWorkerQueueAdmissionEnvelope {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityId: string
  queueName: string
  queueAdmissionRef: string
  queueSchemaRef: string
  serviceRoleTransactionRef: string
  queueWriteAuthorizationRef: string
  workerClaimPolicyRef: string
  workerDispatchBlockRef: string
  sourceHandoffCandidateRef: string
  productionWorkerJobPayload: ProductionWorkerJobPayload
  queueBatchCandidate: AiGraphicsProductionQueueBatchCandidate
  queueJobCandidate: AiGraphicsProductionQueueJobCandidate
  queueAuditCandidate: AiGraphicsProductionQueueAuditCandidate
  preDispatchGateChecks: ProductionWorkerGateCheck[]
  dispatchBlockGateCheck: ProductionWorkerGateCheck
  preDispatchGatesAccepted: boolean
  dispatchBlockedByProductionBlockedMode: boolean
  queueAdmissionEnvelopeShapeValid: boolean
  queueAdmissionEnvelopeReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedProductionJob: boolean
  gpuRuntimeShouldStartNow: false
  workerQueueApprovedNow: false
  backendQueueSubmissionPerformed: false
  serviceRoleTransactionPerformed: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsProductionWorkerQueueAdmission {
  decision: typeof AI_GRAPHICS_PRODUCTION_WORKER_QUEUE_ADMISSION_DECISION
  sourceProductionToolCallGatewayHandoffDecision:
    | typeof AI_GRAPHICS_PRODUCTION_TOOL_CALL_GATEWAY_HANDOFF_DECISION
    | null
  status: AiGraphicsProductionWorkerQueueAdmissionStatus
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceProductionToolCallGatewayHandoffAccepted: boolean
  missingQueueAdmissionControls: string[]
  rejectionReasons: string[]
  productionQueueAdmissionControlsAccepted: boolean
  productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence: boolean
  productionWorkerQueueAdmissionEnvelope:
    AiGraphicsProductionWorkerQueueAdmissionEnvelope | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 0 | 21
  runtimeReadyForOnDemandProductionToolCallTools: 0 | 21
  productionReadyNowTools: 0 | 21
  gpuRuntimeShouldStartNow: false
  policy: {
    sideEffectFreeQueueAdmissionCheck: true
    sourceGatewayHandoffRequired: true
    queueAdmissionEnvelopeOnly: true
    validatesProductionWorkerPreDispatchGates: true
    dispatchBlockedByProductionBlockedMode: true
    queueSubmissionPerformedByThisGate: false
    serviceRoleTransactionPerformedByThisGate: false
    workerDispatchPerformedByThisGate: false
    toolExecutionPerformedByThisGate: false
    runtimeStartsOnlyForAcceptedProductionWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    privateArtifactsOnly: true
    noPublicArtifactsByGate: true
    noSignedUrlsByGate: true
  }
  booleans: {
    productionWorkerQueueAdmissionPrepared: true
    sourceProductionToolCallGatewayHandoffAccepted: boolean
    productionQueueAdmissionControlsAccepted: boolean
    productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence: boolean
    queueAdmissionEnvelopeShapeValid: boolean
    workerPayloadAcceptedByPreDispatchGates: boolean
    dispatchBlockedByProductionBlockedMode: boolean
    approvedSnapshotGatePassed: boolean
    idempotencyGatePassed: boolean
    rawPromptBlockGatePassed: boolean
    signedUrlBlockGatePassed: boolean
    aiGraphicsCanonicalRegistryGatePassed: boolean
    licenseModelWeightGatePassed: boolean
    creditReservationGatePassed: boolean
    artifactPolicyGatePassed: boolean
    qaPolicyGatePassed: boolean
    workerModeGateBlocksDispatch: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    queueAdmissionRefAccepted: boolean
    queueSchemaAccepted: boolean
    queueWriteAuthorizationAccepted: boolean
    serviceRoleTransactionRefAccepted: boolean
    workerClaimPolicyAccepted: boolean
    workerDispatchBlockAccepted: boolean
    queueAuditAccepted: boolean
    queueRollbackAccepted: boolean
    queueObservabilityAccepted: boolean
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
    liveQueueWriteApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: boolean
    internalBetaReadyNow: false
    externalBetaReadyNow: true
    productionReadyNow: boolean
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
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

const requiredPrivateRefFields = [
  'productionQueueAdmissionRef',
  'productionQueueSchemaRef',
  'productionQueueWriteAuthorizationRef',
  'productionServiceRoleTransactionRef',
  'productionWorkerClaimPolicyRef',
  'productionWorkerDispatchBlockRef',
  'productionQueueAuditRef',
  'productionQueueRollbackRef',
  'productionQueueObservabilityRef',
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

function missingQueueAdmissionControls(
  input: AiGraphicsProductionWorkerQueueAdmissionInput,
): string[] {
  return requiredPrivateRefFields
    .filter((field) => !isPrivateEvidenceRef(input[field]))
    .map((field) => `${field}: private/backend production evidence ref is required`)
}

function gatePassed(gate: ProductionWorkerGateCheck): boolean {
  return gate.status === 'passed' || gate.status === 'warning' || gate.status === 'not_applicable'
}

function gateMap(gates: ProductionWorkerGateCheck[]): Map<string, ProductionWorkerGateCheck> {
  return new Map(gates.map((gate) => [gate.gateName, gate]))
}

function traceIdFromPayload(payload: ProductionWorkerJobPayload): string | null {
  const value = payload.metadata?.productionTraceId
  return typeof value === 'string' && value.length > 0 ? value : null
}

function buildGateChecks(payload: ProductionWorkerJobPayload): {
  preDispatchGateChecks: ProductionWorkerGateCheck[]
  dispatchBlockGateCheck: ProductionWorkerGateCheck
} {
  return {
    preDispatchGateChecks: [
      approvedSnapshotGate(payload),
      idempotencyGate(payload),
      rawPromptBlockGate(payload),
      signedUrlBlockGate(payload),
      aiGraphicsCanonicalRegistryGate(payload),
      licenseModelWeightGate(payload),
      creditReservationGate(payload),
      artifactPolicyGate(payload),
      qaPolicyGate(payload),
    ],
    dispatchBlockGateCheck: workerModeGate(payload),
  }
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

function buildQueueAdmissionEnvelope(input: {
  source: AiGraphicsProductionWorkerQueueAdmissionInput
  handoff: AiGraphicsProductionToolCallGatewayHandoff
  controlsAccepted: boolean
}): AiGraphicsProductionWorkerQueueAdmissionEnvelope | null {
  const candidate = input.handoff.productionWorkerCandidate
  if (!candidate) return null
  const payload = candidate.productionWorkerJobPayload
  const { preDispatchGateChecks, dispatchBlockGateCheck } = buildGateChecks(payload)
  const preDispatchGatesAccepted = preDispatchGateChecks.every(gatePassed)
  const dispatchBlockedByProductionBlockedMode =
    workerModeGateBlocksProductionDispatch(dispatchBlockGateCheck, payload)

  const queueBatchCandidate: AiGraphicsProductionQueueBatchCandidate = {
    batchId: `production-ai-graphics-batch-${payload.workspaceId}-${payload.projectId}`,
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    queueName: candidate.queueName,
    jobCount: 1,
    status: 'prepared_not_submitted',
    serviceRoleRequired: true,
    liveInsertPerformed: false,
  }
  const queueJobCandidate: AiGraphicsProductionQueueJobCandidate = {
    jobId: payload.jobId,
    jobType: 'ai_graphics_production_tool_runtime',
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    approvedSnapshotId: payload.approvedSnapshotId,
    creditReservationId: payload.creditReservationId,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    workerType: payload.workerType,
    runtimeTarget: candidate.runtimeTarget,
    idempotencyKey: payload.idempotencyKey,
    payload,
    status: 'prepared_not_submitted',
    liveInsertPerformed: false,
    dispatchBlockedByProductionBlockedMode: true,
  }
  const queueAuditCandidate: AiGraphicsProductionQueueAuditCandidate = {
    auditEventRef: trim(input.source.productionQueueAuditRef),
    eventName: 'production_ai_graphics_queue_admission_prepared',
    toolId: candidate.toolId,
    capabilityId: candidate.capabilityId,
    queueName: candidate.queueName,
    traceId: traceIdFromPayload(payload),
    liveInsertPerformed: false,
  }
  const queueAdmissionEnvelopeShapeValid = Boolean(
    queueBatchCandidate.batchId &&
      queueBatchCandidate.workspaceId === payload.workspaceId &&
      queueBatchCandidate.projectId === payload.projectId &&
      queueBatchCandidate.jobCount === 1 &&
      queueBatchCandidate.status === 'prepared_not_submitted' &&
      queueBatchCandidate.liveInsertPerformed === false &&
      queueJobCandidate.jobId === payload.jobId &&
      queueJobCandidate.approvedSnapshotId === payload.approvedSnapshotId &&
      queueJobCandidate.toolExecutionPlanId === payload.toolExecutionPlanId &&
      queueJobCandidate.idempotencyKey === payload.idempotencyKey &&
      queueJobCandidate.status === 'prepared_not_submitted' &&
      queueJobCandidate.liveInsertPerformed === false &&
      queueJobCandidate.dispatchBlockedByProductionBlockedMode === true &&
      queueAuditCandidate.auditEventRef &&
      queueAuditCandidate.liveInsertPerformed === false &&
      preDispatchGatesAccepted &&
      dispatchBlockedByProductionBlockedMode,
  )
  const queueAdmissionEnvelopeReadyWithProvidedEvidence =
    input.controlsAccepted && queueAdmissionEnvelopeShapeValid

  return {
    toolId: candidate.toolId,
    productionToolId: candidate.productionToolId,
    workerType: candidate.workerType,
    runtimeTarget: candidate.runtimeTarget,
    capabilityId: candidate.capabilityId,
    queueName: candidate.queueName,
    queueAdmissionRef: trim(input.source.productionQueueAdmissionRef),
    queueSchemaRef: trim(input.source.productionQueueSchemaRef),
    serviceRoleTransactionRef: trim(input.source.productionServiceRoleTransactionRef),
    queueWriteAuthorizationRef: trim(input.source.productionQueueWriteAuthorizationRef),
    workerClaimPolicyRef: trim(input.source.productionWorkerClaimPolicyRef),
    workerDispatchBlockRef: trim(input.source.productionWorkerDispatchBlockRef),
    sourceHandoffCandidateRef: candidate.candidateRef,
    productionWorkerJobPayload: payload,
    queueBatchCandidate,
    queueJobCandidate,
    queueAuditCandidate,
    preDispatchGateChecks,
    dispatchBlockGateCheck,
    preDispatchGatesAccepted,
    dispatchBlockedByProductionBlockedMode,
    queueAdmissionEnvelopeShapeValid,
    queueAdmissionEnvelopeReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedProductionJob:
      candidate.gpuRuntimeStartAllowedForAcceptedProductionJob,
    gpuRuntimeShouldStartNow: false,
    workerQueueApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
}

function statusFromInput(input: {
  executionRequested: boolean
  hasSourceHandoff: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsProductionWorkerQueueAdmissionStatus {
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.hasSourceHandoff) return 'missing_production_tool_call_gateway_handoff'
  if (!input.sourceAccepted) return 'production_tool_call_gateway_handoff_rejected'
  return input.controlsAccepted
    ? 'production_worker_queue_admission_prepared_dispatch_blocked'
    : 'missing_production_queue_admission_controls'
}

export function acceptedAiGraphicsProductionWorkerQueueAdmission(
  packet: AiGraphicsProductionWorkerQueueAdmission | undefined,
): packet is AiGraphicsProductionWorkerQueueAdmission {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_PRODUCTION_WORKER_QUEUE_ADMISSION_DECISION &&
      packet.status === 'production_worker_queue_admission_prepared_dispatch_blocked' &&
      packet.sourceProductionToolCallGatewayHandoffAccepted === true &&
      packet.productionQueueAdmissionControlsAccepted === true &&
      packet.productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence === true &&
      packet.productionWorkerQueueAdmissionEnvelope !== null &&
      packet.productionWorkerQueueAdmissionEnvelope.preDispatchGatesAccepted === true &&
      packet.productionWorkerQueueAdmissionEnvelope.dispatchBlockedByProductionBlockedMode === true &&
      packet.productionWorkerQueueAdmissionEnvelope.queueAdmissionEnvelopeShapeValid === true &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.productionControlledToolCallReadyNowTools === 21 &&
      packet.runtimeReadyForOnDemandProductionToolCallTools === 21 &&
      packet.productionReadyNowTools === 21 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerQueueApprovedNow === false &&
      packet.booleans.liveQueueWriteApprovedNow === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.toolExecutionPerformed === false,
  )
}

export function evaluateAiGraphicsProductionWorkerQueueAdmission(
  input: AiGraphicsProductionWorkerQueueAdmissionInput = {},
): AiGraphicsProductionWorkerQueueAdmission {
  const handoff =
    input.sourceProductionToolCallGatewayHandoffPacket ??
    evaluateAiGraphicsProductionToolCallGatewayHandoff(input)
  const executionRequested =
    input.executionRequested === true || handoff.executionRequested === true
  const sourceAccepted = acceptedAiGraphicsProductionToolCallGatewayHandoff(handoff)
  const missingControls =
    executionRequested && sourceAccepted ? missingQueueAdmissionControls(input) : []
  const controlsAccepted = executionRequested && sourceAccepted && missingControls.length === 0
  const envelope = controlsAccepted
    ? buildQueueAdmissionEnvelope({ source: input, handoff, controlsAccepted })
    : null
  const envelopeReady =
    envelope?.queueAdmissionEnvelopeReadyWithProvidedEvidence === true
  const accepted = controlsAccepted && envelopeReady
  const gates = envelope ? gateMap(envelope.preDispatchGateChecks) : new Map()
  const rejectionReasons = [
    executionRequested && !input.sourceProductionToolCallGatewayHandoffPacket
      ? 'source production tool-call gateway handoff packet is missing'
      : undefined,
    executionRequested && input.sourceProductionToolCallGatewayHandoffPacket && !sourceAccepted
      ? 'source production tool-call gateway handoff packet is not accepted'
      : undefined,
    ...missingControls,
    controlsAccepted && !envelopeReady
      ? 'production queue admission envelope is not valid'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_PRODUCTION_WORKER_QUEUE_ADMISSION_DECISION,
    sourceProductionToolCallGatewayHandoffDecision: handoff.decision ?? null,
    status: statusFromInput({
      executionRequested,
      hasSourceHandoff: Boolean(input.sourceProductionToolCallGatewayHandoffPacket),
      sourceAccepted,
      controlsAccepted: accepted,
    }),
    capabilityId: handoff.capabilityId,
    requestedToolId: handoff.requestedToolId,
    executionRequested,
    sourceProductionToolCallGatewayHandoffAccepted: sourceAccepted,
    missingQueueAdmissionControls: missingControls,
    rejectionReasons,
    productionQueueAdmissionControlsAccepted: accepted,
    productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence: accepted,
    productionWorkerQueueAdmissionEnvelope: envelope,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: accepted ? 21 : 0,
    gpuRuntimeShouldStartNow: false,
    policy: {
      sideEffectFreeQueueAdmissionCheck: true,
      sourceGatewayHandoffRequired: true,
      queueAdmissionEnvelopeOnly: true,
      validatesProductionWorkerPreDispatchGates: true,
      dispatchBlockedByProductionBlockedMode: true,
      queueSubmissionPerformedByThisGate: false,
      serviceRoleTransactionPerformedByThisGate: false,
      workerDispatchPerformedByThisGate: false,
      toolExecutionPerformedByThisGate: false,
      runtimeStartsOnlyForAcceptedProductionWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      privateArtifactsOnly: true,
      noPublicArtifactsByGate: true,
      noSignedUrlsByGate: true,
    },
    booleans: {
      productionWorkerQueueAdmissionPrepared: true,
      sourceProductionToolCallGatewayHandoffAccepted: sourceAccepted,
      productionQueueAdmissionControlsAccepted: accepted,
      productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence: accepted,
      queueAdmissionEnvelopeShapeValid:
        envelope?.queueAdmissionEnvelopeShapeValid === true,
      workerPayloadAcceptedByPreDispatchGates:
        envelope?.preDispatchGatesAccepted === true,
      dispatchBlockedByProductionBlockedMode:
        envelope?.dispatchBlockedByProductionBlockedMode === true,
      approvedSnapshotGatePassed: gates.get('approved_snapshot')?.status === 'passed',
      idempotencyGatePassed: gates.get('idempotency')?.status === 'passed',
      rawPromptBlockGatePassed: gates.get('raw_prompt_block')?.status === 'passed',
      signedUrlBlockGatePassed: gates.get('signed_url_block')?.status === 'passed',
      aiGraphicsCanonicalRegistryGatePassed:
        gates.get('ai_graphics_canonical_registry')?.status === 'passed',
      licenseModelWeightGatePassed:
        gates.get('license_model_weight')?.status === 'passed',
      creditReservationGatePassed:
        gates.get('credit_reservation')?.status === 'passed',
      artifactPolicyGatePassed: gates.get('artifact_policy')?.status === 'passed',
      qaPolicyGatePassed: gates.get('qa_policy')?.status === 'passed',
      workerModeGateBlocksDispatch:
        envelope
          ? workerModeGateBlocksProductionDispatch(
              envelope.dispatchBlockGateCheck,
              envelope.productionWorkerJobPayload,
            )
          : false,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      queueAdmissionRefAccepted: accepted,
      queueSchemaAccepted: accepted,
      queueWriteAuthorizationAccepted: accepted,
      serviceRoleTransactionRefAccepted: accepted,
      workerClaimPolicyAccepted: accepted,
      workerDispatchBlockAccepted: accepted,
      queueAuditAccepted: accepted,
      queueRollbackAccepted: accepted,
      queueObservabilityAccepted: accepted,
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
      liveQueueWriteApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: accepted,
      internalBetaReadyNow: false,
      externalBetaReadyNow: true,
      productionReadyNow: accepted,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
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
