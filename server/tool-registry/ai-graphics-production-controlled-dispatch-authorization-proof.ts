import {
  AI_GRAPHICS_PRODUCTION_SERVICE_ROLE_QUEUE_TRANSACTION_DRY_PROOF_DECISION,
  acceptedAiGraphicsProductionServiceRoleQueueTransactionDryProof,
  evaluateAiGraphicsProductionServiceRoleQueueTransactionDryProof,
  type AiGraphicsProductionServiceRoleQueueTransactionDryProof,
  type AiGraphicsProductionServiceRoleQueueTransactionDryProofEnvelope,
  type AiGraphicsProductionServiceRoleQueueTransactionDryProofInput,
} from './ai-graphics-production-service-role-queue-transaction-dry-proof'
import type { ProductionToolId } from './production-tool-types'
import type { ProductionWorkerRuntimeType } from '../workers/production'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_DISPATCH_AUTHORIZATION_PROOF_DECISION =
  'ai_graphics_production_controlled_dispatch_authorization_proof_recorded_dispatch_blocked'

export type AiGraphicsProductionControlledDispatchAuthorizationProofStatus =
  | 'planning_metadata_selected'
  | 'missing_production_service_role_queue_transaction_dry_proof'
  | 'production_service_role_queue_transaction_dry_proof_rejected'
  | 'awaiting_production_controlled_dispatch_authorization'
  | 'production_controlled_dispatch_authorization_recorded_dispatch_still_blocked'

export interface AiGraphicsProductionControlledDispatchAuthorizationProofInput
  extends AiGraphicsProductionServiceRoleQueueTransactionDryProofInput {
  sourceProductionServiceRoleQueueTransactionDryProofPacket?:
    AiGraphicsProductionServiceRoleQueueTransactionDryProof
  productionControlledDispatchAuthorizationGranted?: boolean
  productionControlledDispatchAuthorizationRef?: string
  productionControlledDispatchOperatorRole?: string
  productionWorkerLeaseApprovalRef?: string
  productionWorkerDispatchApprovalRef?: string
  productionToolRouteExecutionBlockRef?: string
  productionPrivateArtifactRuntimeBindingRef?: string
  productionCostGuardrailRuntimeRef?: string
  productionTelemetryRuntimeRef?: string
  productionRollbackRuntimeRef?: string
  productionPostDispatchReviewRef?: string
}

export interface AiGraphicsProductionControlledDispatchAuthorizationRecord {
  accepted: boolean
  operatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR'
  authorizationRef: string | null
  workerLeaseApprovalRef: string | null
  workerDispatchApprovalRef: string | null
  toolRouteExecutionBlockRef: string | null
  privateArtifactRuntimeBindingRef: string | null
  costGuardrailRuntimeRef: string | null
  telemetryRuntimeRef: string | null
  rollbackRuntimeRef: string | null
  postDispatchReviewRef: string | null
  authorizesWorkerLeaseCreationNow: false
  authorizesWorkerDispatchNow: false
  authorizesToolExecutionNow: false
  authorizesRuntimeNow: false
  authorizesGpuRuntimeStartNow: false
}

export interface AiGraphicsProductionControlledDispatchAuthorizationCandidate {
  authorizationId: 'ai_graphics_production_controlled_dispatch_authorization_proof'
  toolId: string
  productionToolId: ProductionToolId
  capabilityId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  queueName: string
  jobId: string
  transactionId: string
  sourceServiceRoleDryProofAccepted: boolean
  sourceWorkerPayloadAcceptedByPreDispatchGates: boolean
  sourceWorkerModeGateBlocksDispatch: boolean
  controlledDispatchAuthorizationRecordedWithProvidedEvidence: boolean
  dispatchDryProofCandidateAccepted: boolean
  gpuRuntimeStartAllowedForAcceptedProductionJob: boolean
  gpuRuntimeShouldStartNow: false
  workerLeaseCreationApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  routeExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
  status: 'authorization_recorded_dispatch_blocked'
  nextProductionMilestone: string
}

export interface AiGraphicsProductionControlledDispatchAuthorizationProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_DISPATCH_AUTHORIZATION_PROOF_DECISION
  sourceProductionServiceRoleQueueTransactionDryProofDecision:
    typeof AI_GRAPHICS_PRODUCTION_SERVICE_ROLE_QUEUE_TRANSACTION_DRY_PROOF_DECISION | null
  status: AiGraphicsProductionControlledDispatchAuthorizationProofStatus
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceProductionServiceRoleQueueTransactionDryProofAccepted: boolean
  productionControlledDispatchAuthorizationRecordAccepted: boolean
  missingAuthorizationControls: string[]
  rejectionReasons: string[]
  productionControlledDispatchAuthorizationPreparedWithProvidedEvidence: boolean
  productionControlledDispatchAuthorizationRequestsWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 0 | 21
  runtimeReadyForOnDemandProductionToolCallTools: 0 | 21
  productionReadyNowTools: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  sourceServiceRoleQueueTransactionDryProofEnvelope:
    AiGraphicsProductionServiceRoleQueueTransactionDryProofEnvelope | null
  controlledDispatchAuthorizationRecord:
    AiGraphicsProductionControlledDispatchAuthorizationRecord
  controlledDispatchAuthorizationCandidate:
    AiGraphicsProductionControlledDispatchAuthorizationCandidate | null
  allowedControlledDispatchAuthorizationActions: string[]
  blockedRuntimeActions: string[]
  policy: {
    sideEffectFreeAuthorizationCheck: true
    sourceServiceRoleDryProofRequired: true
    productionRuntimeOperatorRequired: true
    privateAuthorizationRefsRequired: true
    workerLeaseCreationStillBlocked: true
    workerDispatchStillBlocked: true
    toolExecutionStillBlocked: true
    runtimeStartsOnlyForAcceptedProductionWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    privateArtifactsOnly: true
    noPublicArtifactsByGate: true
    noSignedUrlsByGate: true
  }
  booleans: {
    productionControlledDispatchAuthorizationProofPrepared: true
    sourceProductionServiceRoleQueueTransactionDryProofAccepted: boolean
    productionControlledDispatchAuthorizationRecordAccepted: boolean
    productionControlledDispatchAuthorizationPreparedWithProvidedEvidence: boolean
    sourceServiceRoleTransactionEnvelopeAccepted: boolean
    sourceControlledDispatchDryProofAccepted: boolean
    sourceWorkerPayloadAcceptedByPreDispatchGates: boolean
    sourceWorkerModeGateBlocksDispatch: boolean
    controlledDispatchAuthorizationRefAccepted: boolean
    workerLeaseApprovalRefAccepted: boolean
    workerDispatchApprovalRefAccepted: boolean
    toolRouteExecutionBlockRefAccepted: boolean
    privateArtifactRuntimeBindingRefAccepted: boolean
    costGuardrailRuntimeRefAccepted: boolean
    telemetryRuntimeRefAccepted: boolean
    rollbackRuntimeRefAccepted: boolean
    postDispatchReviewRefAccepted: boolean
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
    workerLeaseCreationApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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

const allowedControlledDispatchAuthorizationActions = [
  'accept production service-role queue transaction dry-proof evidence',
  'record production runtime operator authorization metadata',
  'bind worker lease and dispatch approval refs without creating a live lease',
  'keep dispatch blocked by production_blocked worker mode',
  'keep GPU startup bound to a future accepted production worker/tool job only',
]

const blockedRuntimeActions = [
  'live worker lease creation',
  'worker dispatch',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'production runtime unlock',
]

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function trim(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
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

function authorizationRecordAccepted(
  input: AiGraphicsProductionControlledDispatchAuthorizationProofInput,
): boolean {
  return input.productionControlledDispatchAuthorizationGranted === true &&
    isPrivateEvidenceRef(input.productionControlledDispatchAuthorizationRef) &&
    (input.productionControlledDispatchOperatorRole ??
      'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR') ===
        'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR' &&
    isPrivateEvidenceRef(input.productionWorkerLeaseApprovalRef) &&
    isPrivateEvidenceRef(input.productionWorkerDispatchApprovalRef) &&
    isPrivateEvidenceRef(input.productionToolRouteExecutionBlockRef) &&
    isPrivateEvidenceRef(input.productionPrivateArtifactRuntimeBindingRef) &&
    isPrivateEvidenceRef(input.productionCostGuardrailRuntimeRef) &&
    isPrivateEvidenceRef(input.productionTelemetryRuntimeRef) &&
    isPrivateEvidenceRef(input.productionRollbackRuntimeRef) &&
    isPrivateEvidenceRef(input.productionPostDispatchReviewRef)
}

function missingAuthorizationControls(
  input: AiGraphicsProductionControlledDispatchAuthorizationProofInput,
): string[] {
  return [
    input.productionControlledDispatchAuthorizationGranted !== true
      ? 'production controlled dispatch authorization flag is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledDispatchAuthorizationRef)
      ? 'productionControlledDispatchAuthorizationRef: private/backend production evidence ref is required'
      : undefined,
    (input.productionControlledDispatchOperatorRole ??
      'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR') !==
        'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR'
      ? 'production controlled dispatch operator role must be AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR'
      : undefined,
    !isPrivateEvidenceRef(input.productionWorkerLeaseApprovalRef)
      ? 'productionWorkerLeaseApprovalRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionWorkerDispatchApprovalRef)
      ? 'productionWorkerDispatchApprovalRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionToolRouteExecutionBlockRef)
      ? 'productionToolRouteExecutionBlockRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionPrivateArtifactRuntimeBindingRef)
      ? 'productionPrivateArtifactRuntimeBindingRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionCostGuardrailRuntimeRef)
      ? 'productionCostGuardrailRuntimeRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionTelemetryRuntimeRef)
      ? 'productionTelemetryRuntimeRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionRollbackRuntimeRef)
      ? 'productionRollbackRuntimeRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionPostDispatchReviewRef)
      ? 'productionPostDispatchReviewRef: private/backend production evidence ref is required'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function buildAuthorizationRecord(
  input: AiGraphicsProductionControlledDispatchAuthorizationProofInput,
  accepted: boolean,
): AiGraphicsProductionControlledDispatchAuthorizationRecord {
  return {
    accepted,
    operatorRole: 'AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR',
    authorizationRef: trim(input.productionControlledDispatchAuthorizationRef),
    workerLeaseApprovalRef: trim(input.productionWorkerLeaseApprovalRef),
    workerDispatchApprovalRef: trim(input.productionWorkerDispatchApprovalRef),
    toolRouteExecutionBlockRef: trim(input.productionToolRouteExecutionBlockRef),
    privateArtifactRuntimeBindingRef:
      trim(input.productionPrivateArtifactRuntimeBindingRef),
    costGuardrailRuntimeRef: trim(input.productionCostGuardrailRuntimeRef),
    telemetryRuntimeRef: trim(input.productionTelemetryRuntimeRef),
    rollbackRuntimeRef: trim(input.productionRollbackRuntimeRef),
    postDispatchReviewRef: trim(input.productionPostDispatchReviewRef),
    authorizesWorkerLeaseCreationNow: false,
    authorizesWorkerDispatchNow: false,
    authorizesToolExecutionNow: false,
    authorizesRuntimeNow: false,
    authorizesGpuRuntimeStartNow: false,
  }
}

function buildCandidate(input: {
  source: AiGraphicsProductionServiceRoleQueueTransactionDryProof
  authorizationAccepted: boolean
}): AiGraphicsProductionControlledDispatchAuthorizationCandidate | null {
  const envelope = input.source.productionServiceRoleQueueTransactionDryProofEnvelope
  if (!envelope || !input.authorizationAccepted) return null
  return {
    authorizationId: 'ai_graphics_production_controlled_dispatch_authorization_proof',
    toolId: envelope.toolId,
    productionToolId: envelope.productionToolId,
    capabilityId: envelope.capabilityId,
    workerType: envelope.workerType,
    runtimeTarget: envelope.runtimeTarget,
    queueName: envelope.queueName,
    jobId: envelope.jobRowCandidate.jobId,
    transactionId: envelope.transactionId,
    sourceServiceRoleDryProofAccepted: true,
    sourceWorkerPayloadAcceptedByPreDispatchGates:
      envelope.sourceQueueAdmissionEnvelope.preDispatchGatesAccepted,
    sourceWorkerModeGateBlocksDispatch:
      envelope.controlledDispatchDryProofCandidate
        .dispatchBlockedByProductionBlockedMode,
    controlledDispatchAuthorizationRecordedWithProvidedEvidence: true,
    dispatchDryProofCandidateAccepted:
      envelope.controlledDispatchDryProofReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedProductionJob:
      envelope.gpuRuntimeStartAllowedForAcceptedProductionJob,
    gpuRuntimeShouldStartNow: false,
    workerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    routeExecutionApprovedNow: false,
    providerRuntimeApprovedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
    status: 'authorization_recorded_dispatch_blocked',
    nextProductionMilestone:
      'controlled worker dispatch smoke proof with production_blocked mode still preventing runtime execution',
  }
}

function statusFromInput(input: {
  executionRequested: boolean
  hasSource: boolean
  sourceAccepted: boolean
  authorizationAccepted: boolean
}): AiGraphicsProductionControlledDispatchAuthorizationProofStatus {
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.hasSource) {
    return 'missing_production_service_role_queue_transaction_dry_proof'
  }
  if (!input.sourceAccepted) {
    return 'production_service_role_queue_transaction_dry_proof_rejected'
  }
  return input.authorizationAccepted
    ? 'production_controlled_dispatch_authorization_recorded_dispatch_still_blocked'
    : 'awaiting_production_controlled_dispatch_authorization'
}

export function acceptedAiGraphicsProductionControlledDispatchAuthorizationProof(
  packet: AiGraphicsProductionControlledDispatchAuthorizationProof | undefined,
): packet is AiGraphicsProductionControlledDispatchAuthorizationProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_DISPATCH_AUTHORIZATION_PROOF_DECISION &&
      packet.status ===
        'production_controlled_dispatch_authorization_recorded_dispatch_still_blocked' &&
      packet.sourceProductionServiceRoleQueueTransactionDryProofAccepted === true &&
      packet.productionControlledDispatchAuthorizationRecordAccepted === true &&
      packet.productionControlledDispatchAuthorizationPreparedWithProvidedEvidence === true &&
      packet.controlledDispatchAuthorizationCandidate !== null &&
      packet.controlledDispatchAuthorizationCandidate
        .sourceWorkerModeGateBlocksDispatch === true &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.productionReadyNowTools === 0 &&
      packet.liveWorkerDispatchesNow === 0 &&
      packet.liveToolExecutionsNow === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.toolExecutionPerformed === false &&
      packet.booleans.runtimeReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function evaluateAiGraphicsProductionControlledDispatchAuthorizationProof(
  input: AiGraphicsProductionControlledDispatchAuthorizationProofInput = {},
): AiGraphicsProductionControlledDispatchAuthorizationProof {
  const source =
    input.sourceProductionServiceRoleQueueTransactionDryProofPacket ??
    evaluateAiGraphicsProductionServiceRoleQueueTransactionDryProof(input)
  const executionRequested =
    input.executionRequested === true || source.executionRequested === true
  const sourceAccepted =
    acceptedAiGraphicsProductionServiceRoleQueueTransactionDryProof(source)
  const missingControls =
    executionRequested && sourceAccepted ? missingAuthorizationControls(input) : []
  const authorizationAccepted =
    executionRequested && sourceAccepted && authorizationRecordAccepted(input)
  const accepted = authorizationAccepted && missingControls.length === 0
  const candidate = buildCandidate({ source, authorizationAccepted: accepted })
  const rejectionReasons = [
    executionRequested && !input.sourceProductionServiceRoleQueueTransactionDryProofPacket
      ? 'source production service-role queue transaction dry-proof packet is missing'
      : undefined,
    executionRequested &&
      input.sourceProductionServiceRoleQueueTransactionDryProofPacket &&
      !sourceAccepted
      ? 'source production service-role queue transaction dry-proof packet is not accepted'
      : undefined,
    ...missingControls,
  ].filter((reason): reason is string => Boolean(reason))
  const record = buildAuthorizationRecord(input, accepted)

  return {
    decision: AI_GRAPHICS_PRODUCTION_CONTROLLED_DISPATCH_AUTHORIZATION_PROOF_DECISION,
    sourceProductionServiceRoleQueueTransactionDryProofDecision:
      source.decision ?? null,
    status: statusFromInput({
      executionRequested,
      hasSource: Boolean(input.sourceProductionServiceRoleQueueTransactionDryProofPacket),
      sourceAccepted,
      authorizationAccepted: accepted,
    }),
    capabilityId: source.capabilityId,
    requestedToolId: source.requestedToolId,
    executionRequested,
    sourceProductionServiceRoleQueueTransactionDryProofAccepted: sourceAccepted,
    productionControlledDispatchAuthorizationRecordAccepted: accepted,
    missingAuthorizationControls: missingControls,
    rejectionReasons,
    productionControlledDispatchAuthorizationPreparedWithProvidedEvidence: accepted,
    productionControlledDispatchAuthorizationRequestsWithProvidedEvidence:
      accepted ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    sourceServiceRoleQueueTransactionDryProofEnvelope:
      source.productionServiceRoleQueueTransactionDryProofEnvelope,
    controlledDispatchAuthorizationRecord: record,
    controlledDispatchAuthorizationCandidate: candidate,
    allowedControlledDispatchAuthorizationActions,
    blockedRuntimeActions,
    policy: {
      sideEffectFreeAuthorizationCheck: true,
      sourceServiceRoleDryProofRequired: true,
      productionRuntimeOperatorRequired: true,
      privateAuthorizationRefsRequired: true,
      workerLeaseCreationStillBlocked: true,
      workerDispatchStillBlocked: true,
      toolExecutionStillBlocked: true,
      runtimeStartsOnlyForAcceptedProductionWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      privateArtifactsOnly: true,
      noPublicArtifactsByGate: true,
      noSignedUrlsByGate: true,
    },
    booleans: {
      productionControlledDispatchAuthorizationProofPrepared: true,
      sourceProductionServiceRoleQueueTransactionDryProofAccepted: sourceAccepted,
      productionControlledDispatchAuthorizationRecordAccepted: accepted,
      productionControlledDispatchAuthorizationPreparedWithProvidedEvidence: accepted,
      sourceServiceRoleTransactionEnvelopeAccepted:
        source.productionServiceRoleQueueTransactionDryProofEnvelope
          ?.serviceRoleTransactionDryProofReadyWithProvidedEvidence === true,
      sourceControlledDispatchDryProofAccepted:
        source.productionControlledDispatchDryProofReadyWithProvidedEvidence === true,
      sourceWorkerPayloadAcceptedByPreDispatchGates:
        source.productionServiceRoleQueueTransactionDryProofEnvelope
          ?.sourceQueueAdmissionEnvelope.preDispatchGatesAccepted === true,
      sourceWorkerModeGateBlocksDispatch:
        source.productionServiceRoleQueueTransactionDryProofEnvelope
          ?.controlledDispatchDryProofCandidate
          .dispatchBlockedByProductionBlockedMode === true,
      controlledDispatchAuthorizationRefAccepted: accepted,
      workerLeaseApprovalRefAccepted: accepted,
      workerDispatchApprovalRefAccepted: accepted,
      toolRouteExecutionBlockRefAccepted: accepted,
      privateArtifactRuntimeBindingRefAccepted: accepted,
      costGuardrailRuntimeRefAccepted: accepted,
      telemetryRuntimeRefAccepted: accepted,
      rollbackRuntimeRefAccepted: accepted,
      postDispatchReviewRefAccepted: accepted,
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
      workerLeaseCreationApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
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
