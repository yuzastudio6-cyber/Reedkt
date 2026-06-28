import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import type { ServiceContext } from '../types'
import type { ProductionWorkerRuntimeType } from '../workers/production'
import type { ProductionToolId } from './production-tool-types'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION,
  evaluateAiGraphicsExternalBetaLocalQueueStorage,
  type AiGraphicsExternalBetaLocalQueueStorage,
  type AiGraphicsExternalBetaLocalQueueStorageInput,
  type AiGraphicsExternalBetaLocalQueueStorageRecord,
} from './ai-graphics-external-beta-local-queue-storage'
import type { AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope } from './ai-graphics-external-beta-service-role-queue-transaction'

export const AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION =
  'ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRuntimeQueueServiceBridgeStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_local_queue_storage'
  | 'missing_external_beta_runtime_queue_service_controls'
  | 'external_beta_runtime_queue_service_payload_ready'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput
  extends AiGraphicsExternalBetaLocalQueueStorageInput {
  sourceExternalBetaLocalQueueStoragePacket?: AiGraphicsExternalBetaLocalQueueStorage
  externalBetaRuntimeQueueServiceRef?: string
  externalBetaRuntimeQueueRpcSchemaRef?: string
  externalBetaWorkerClaimReadinessRef?: string
  externalBetaQueueTelemetryRef?: string
}

export interface AiGraphicsExternalBetaRuntimeQueueServiceBridgeRecord {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  sourceGatewayRuntimeAdmissionMode: string
  capabilityIds: string[]
  sourceLocalQueueJobBatchId: string
  sourceLocalQueueJobId: string
  sourceTransactionId: string
  approvedSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  runtimeQueueJobBatchId: string
  runtimeQueueJobIds: string[]
  insertedJobCount: number
  queueServiceMockOnly: boolean
  queueServiceWarningCount: number
  enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs'
  claimRpcName: 'claim_ai_graphics_tool_runtime_job'
  sourceLocalQueueStorageProofBridgeAccepted: boolean
  runtimeQueueServicePayloadReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  canWriteSupabaseQueueNow: false
  canClaimWorkerNow: false
  canCreateWorkerLeaseNow: false
  canDispatchWorkerNow: false
  canExecuteToolNow: false
}

export interface AiGraphicsExternalBetaRuntimeQueueServiceBridge {
  decision: AiGraphicsExternalBetaRuntimeQueueServiceBridgeStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION
  sourceExternalBetaLocalQueueStorageDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaLocalQueueStorage: AiGraphicsExternalBetaLocalQueueStorage
  sourceExternalBetaLocalQueueStorageAccepted: boolean
  sourceExternalBetaLocalQueueStorageProofBridgeAccepted: boolean
  missingRuntimeQueueServiceControls: string[]
  externalBetaRuntimeQueueServiceControlsSatisfied: boolean
  runtimeQueueServicePayloadReadyWithProvidedEvidence: boolean
  externalBetaRuntimeQueueServiceBridgeRecord:
    AiGraphicsExternalBetaRuntimeQueueServiceBridgeRecord | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  localMockRuntimeQueueServiceBatchesCreatedNow: 0 | 1
  localMockRuntimeQueueServiceJobsCreatedNow: 0 | 1
  liveSupabaseQueueWritesNow: 0
  liveWorkerClaimRowsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  runtimeQueueServiceBridgePolicy: {
    sideEffectFreeQueueServiceCheck: true
    sourceLocalQueueStoragePacketRequired: true
    runtimeQueueServiceRefRequired: true
    runtimeQueueRpcSchemaRequired: true
    workerClaimReadinessRefRequired: true
    queueTelemetryRefRequired: true
    usesExistingAiGraphicsRuntimeQueueService: true
    validatesCanonical21ToolPayloads: true
    serviceRoleRpcNamesPreserved: true
    localMockRecordsOnly: true
    noSupabaseWrites: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaRuntimeQueueServiceBridgePrepared: true
    sourceExternalBetaLocalQueueStorageAccepted: boolean
    sourceExternalBetaLocalQueueStorageProofBridgeAccepted: boolean
    externalBetaRuntimeQueueServiceControlsSatisfied: boolean
    runtimeQueueServicePayloadReadyWithProvidedEvidence: boolean
    canonicalRuntimeQueueServiceValidationPassed: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    usesExistingAiGraphicsRuntimeQueueService: true
    runtimeQueueServiceMockOnly: boolean
    runtimeQueueServiceUsesServiceRoleRpcNames: true
    aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: boolean
    approvedSnapshotRefAccepted: boolean
    creditReservationRefAccepted: boolean
    privateArtifactManifestOnly: boolean
    workerClaimReadinessPreparedButNotCalled: boolean
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
    supabaseMutationPerformed: false
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

const runtimeQueueServiceBridgePolicy = {
  sideEffectFreeQueueServiceCheck: true,
  sourceLocalQueueStoragePacketRequired: true,
  runtimeQueueServiceRefRequired: true,
  runtimeQueueRpcSchemaRequired: true,
  workerClaimReadinessRefRequired: true,
  queueTelemetryRefRequired: true,
  usesExistingAiGraphicsRuntimeQueueService: true,
  validatesCanonical21ToolPayloads: true,
  serviceRoleRpcNamesPreserved: true,
  localMockRecordsOnly: true,
  noSupabaseWrites: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function localQueueStorageProofBridgeAccepted(
  packet: AiGraphicsExternalBetaLocalQueueStorage,
): boolean {
  const record = packet.externalBetaLocalQueueStorageRecord
  const envelope = sourceEnvelope(packet)

  return (
    packet.sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted === true &&
    record?.sourceServiceRoleTransactionProofBridgeAccepted === true &&
    envelope?.sourceQueueSubmissionProofBridgeAccepted === true &&
    envelope?.sourceQueueSubmissionEnvelope?.sourceAdapterProofBridgeAccepted === true &&
    envelope?.sourceQueueSubmissionEnvelope?.productionWorkerJobPayload.metadata
      ?.sourceGatewayRuntimeAdmissionProofBridgeAccepted === true
  )
}

function localQueueStorageAccepted(
  packet: AiGraphicsExternalBetaLocalQueueStorage,
): boolean {
  return packet.decision === 'external_beta_local_queue_storage_mock_record_ready' &&
    localQueueStorageProofBridgeAccepted(packet) &&
    packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION &&
    packet.externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence === true &&
    packet.externalBetaLocalQueueStorageRecord !== null &&
    packet.externalBetaLocalQueueStorageRecord.jobRecordMockOnly === true &&
    packet.externalBetaLocalQueueStorageRecord.localQueueStatus === 'queued' &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingRuntimeQueueServiceControls(
  input: AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput,
): string[] {
  return [
    !hasValue(input.externalBetaRuntimeQueueServiceRef)
      ? 'external beta runtime queue service reference is missing'
      : undefined,
    !hasValue(input.externalBetaRuntimeQueueRpcSchemaRef)
      ? 'external beta runtime queue RPC schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerClaimReadinessRef)
      ? 'external beta worker claim readiness reference is missing'
      : undefined,
    !hasValue(input.externalBetaQueueTelemetryRef)
      ? 'external beta queue telemetry reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  localQueueStorage: AiGraphicsExternalBetaLocalQueueStorage
  sourceLocalQueueAccepted: boolean
  executionRequested: boolean
  runtimeQueueServicePayloadReady: boolean
}): AiGraphicsExternalBetaRuntimeQueueServiceBridgeStatus {
  if (input.localQueueStorage.decision === 'invalid_capability_blocked') {
    return 'invalid_capability_blocked'
  }
  if (input.localQueueStorage.decision === 'requested_tool_eliminated') {
    return 'requested_tool_eliminated'
  }
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.sourceLocalQueueAccepted) return 'missing_external_beta_local_queue_storage'
  return input.runtimeQueueServicePayloadReady
    ? 'external_beta_runtime_queue_service_payload_ready'
    : 'missing_external_beta_runtime_queue_service_controls'
}

function createMockRuntimeQueueServiceContext(): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      STORAGE_MODE: 'local',
      WORKER_RUNTIME_MODE: 'mock',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    }),
    clients: { admin: null, public: null },
    requestId: 'ai-graphics-external-beta-runtime-queue-service-bridge',
    auth: {
      userId: 'ai-graphics-external-beta-runtime-queue-service-bridge',
      isMockUser: true,
    },
  }
}

function sourceEnvelope(
  packet: AiGraphicsExternalBetaLocalQueueStorage,
): AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope | null {
  return packet.sourceExternalBetaServiceRoleQueueTransaction
    .externalBetaServiceRoleQueueTransactionEnvelope
}

function approvedPlanSnapshotRefAccepted(ref: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref) ||
    /^approved_snapshot_[a-z0-9_]+$/i.test(ref)
}

function creditReservationRefAccepted(ref?: string): boolean {
  return Boolean(ref) && (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref ?? '') ||
    /^credit_reservation_[a-z0-9_]+$/i.test(ref ?? '')
  )
}

async function createRuntimeQueueServiceBridgeRecord(
  packet: AiGraphicsExternalBetaLocalQueueStorage,
  localRecord: AiGraphicsExternalBetaLocalQueueStorageRecord,
  envelope: AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope,
): Promise<AiGraphicsExternalBetaRuntimeQueueServiceBridgeRecord> {
  const service = createAiGraphicsToolRuntimeQueueService(
    createMockRuntimeQueueServiceContext(),
  )
  const capabilityIds = [localRecord.capabilityId]
  const queue = await service.enqueueToolRuntimeJobs({
    workspaceId: envelope.jobBatchRowCandidate.workspaceId,
    projectId: envelope.jobBatchRowCandidate.projectId,
    approvedPlanSnapshotId: localRecord.approvedSnapshotId,
    creditReservationId: localRecord.creditReservationId ?? '',
    idempotencyKey: envelope.jobRowCandidate.idempotencyKey,
    batchName: 'AI graphics external beta runtime queue service bridge',
    createdByAgent: 'ai_graphics_external_beta_runtime_queue_service_bridge',
    jobs: [{
      toolId: localRecord.toolId,
      productionToolId: localRecord.productionToolId,
      workerType: localRecord.workerType,
      runtimeTarget: localRecord.runtimeTarget,
      capabilityIds,
      privateArtifactManifestRef: localRecord.privateArtifactManifestRef,
      idempotencyKey: envelope.jobRowCandidate.idempotencyKey,
      inputPayload: {
        sourceTransactionId: localRecord.sourceTransactionId,
        sourceLocalQueueJobBatchId: localRecord.jobBatchId,
        sourceLocalQueueJobId: localRecord.jobId,
        sourceGatewayRuntimeAdmissionMode: localRecord.sourceGatewayRuntimeAdmissionMode,
        sourceLocalQueueStorageProofBridgeAccepted:
          localRecord.sourceServiceRoleTransactionProofBridgeAccepted,
        runtimeTarget: localRecord.runtimeTarget,
        liveRuntimeAllowedNow: false,
        serviceRoleTransactionPerformed: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      },
    }],
  })
  const queueResult = queue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
    mockOnly?: boolean
  }
  const runtimeQueueServicePayloadReadyWithProvidedEvidence = Boolean(
    queueResult.mockOnly === true &&
      queueResult.jobBatchId &&
      Array.isArray(queueResult.jobIds) &&
      queueResult.jobIds.length === 1 &&
      queueResult.insertedJobCount === 1 &&
      localRecord.privateArtifactManifestRef.startsWith('private://') &&
      packet.sourceExternalBetaServiceRoleQueueTransactionAccepted === true &&
      packet.sourceExternalBetaServiceRoleQueueTransactionProofBridgeAccepted === true &&
      localRecord.sourceServiceRoleTransactionProofBridgeAccepted === true,
  )

  return {
    toolId: localRecord.toolId,
    productionToolId: localRecord.productionToolId,
    workerType: localRecord.workerType,
    runtimeTarget: localRecord.runtimeTarget,
    sourceGatewayRuntimeAdmissionMode: localRecord.sourceGatewayRuntimeAdmissionMode,
    capabilityIds,
    sourceLocalQueueJobBatchId: localRecord.jobBatchId,
    sourceLocalQueueJobId: localRecord.jobId,
    sourceTransactionId: localRecord.sourceTransactionId,
    approvedSnapshotId: localRecord.approvedSnapshotId,
    creditReservationId: localRecord.creditReservationId ?? '',
    privateArtifactManifestRef: localRecord.privateArtifactManifestRef,
    runtimeQueueJobBatchId: queueResult.jobBatchId ?? 'missing_runtime_queue_job_batch_id',
    runtimeQueueJobIds: queueResult.jobIds ?? [],
    insertedJobCount: queueResult.insertedJobCount ?? 0,
    queueServiceMockOnly: queueResult.mockOnly === true,
    queueServiceWarningCount: queue.warnings.length,
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    sourceLocalQueueStorageProofBridgeAccepted:
      localRecord.sourceServiceRoleTransactionProofBridgeAccepted,
    runtimeQueueServicePayloadReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      localRecord.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    canWriteSupabaseQueueNow: false,
    canClaimWorkerNow: false,
    canCreateWorkerLeaseNow: false,
    canDispatchWorkerNow: false,
    canExecuteToolNow: false,
  }
}

export async function evaluateAiGraphicsExternalBetaRuntimeQueueServiceBridge(
  input: AiGraphicsExternalBetaRuntimeQueueServiceBridgeInput,
): Promise<AiGraphicsExternalBetaRuntimeQueueServiceBridge> {
  const localQueueStorage =
    input.sourceExternalBetaLocalQueueStoragePacket ??
    await evaluateAiGraphicsExternalBetaLocalQueueStorage(input)
  const executionRequested =
    input.executionRequested === true || localQueueStorage.executionRequested === true
  const sourceLocalQueueProofBridgeAccepted =
    localQueueStorageProofBridgeAccepted(localQueueStorage)
  const sourceLocalQueueAccepted = localQueueStorageAccepted(localQueueStorage)
  const missingControls = executionRequested
    ? missingRuntimeQueueServiceControls(input)
    : []
  const controlsSatisfied =
    executionRequested &&
    sourceLocalQueueAccepted &&
    missingControls.length === 0
  const localRecord = localQueueStorage.externalBetaLocalQueueStorageRecord
  const envelope = sourceEnvelope(localQueueStorage)
  const bridgeRecord =
    controlsSatisfied && localRecord && envelope
      ? await createRuntimeQueueServiceBridgeRecord(
        localQueueStorage,
        localRecord,
        envelope,
      )
      : null
  const runtimeQueueServicePayloadReady =
    bridgeRecord?.runtimeQueueServicePayloadReadyWithProvidedEvidence === true
  const approvedSnapshotRefAccepted = bridgeRecord
    ? approvedPlanSnapshotRefAccepted(bridgeRecord.approvedSnapshotId)
    : false
  const creditReservationAccepted = bridgeRecord
    ? creditReservationRefAccepted(bridgeRecord.creditReservationId)
    : false
  const privateArtifactManifestOnly = bridgeRecord
    ? bridgeRecord.privateArtifactManifestRef.startsWith('private://')
    : false
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    runtimeQueueServicePayloadReady &&
    bridgeRecord.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      localQueueStorage,
      sourceLocalQueueAccepted,
      executionRequested,
      runtimeQueueServicePayloadReady,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_QUEUE_SERVICE_BRIDGE_DECISION,
    sourceExternalBetaLocalQueueStorageDecision:
      AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION,
    capabilityId: localQueueStorage.capabilityId,
    requestedToolId: localQueueStorage.requestedToolId,
    executionRequested,
    sourceExternalBetaLocalQueueStorage: localQueueStorage,
    sourceExternalBetaLocalQueueStorageAccepted: sourceLocalQueueAccepted,
    sourceExternalBetaLocalQueueStorageProofBridgeAccepted:
      sourceLocalQueueProofBridgeAccepted,
    missingRuntimeQueueServiceControls: missingControls,
    externalBetaRuntimeQueueServiceControlsSatisfied: controlsSatisfied,
    runtimeQueueServicePayloadReadyWithProvidedEvidence:
      runtimeQueueServicePayloadReady,
    externalBetaRuntimeQueueServiceBridgeRecord: bridgeRecord,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    localMockRuntimeQueueServiceBatchesCreatedNow:
      runtimeQueueServicePayloadReady ? 1 : 0,
    localMockRuntimeQueueServiceJobsCreatedNow:
      runtimeQueueServicePayloadReady ? 1 : 0,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    runtimeQueueServiceBridgePolicy,
    booleans: {
      externalBetaRuntimeQueueServiceBridgePrepared: true,
      sourceExternalBetaLocalQueueStorageAccepted: sourceLocalQueueAccepted,
      sourceExternalBetaLocalQueueStorageProofBridgeAccepted:
        sourceLocalQueueProofBridgeAccepted,
      externalBetaRuntimeQueueServiceControlsSatisfied: controlsSatisfied,
      runtimeQueueServicePayloadReadyWithProvidedEvidence:
        runtimeQueueServicePayloadReady,
      canonicalRuntimeQueueServiceValidationPassed:
        runtimeQueueServicePayloadReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      usesExistingAiGraphicsRuntimeQueueService: true,
      runtimeQueueServiceMockOnly: bridgeRecord?.queueServiceMockOnly === true,
      runtimeQueueServiceUsesServiceRoleRpcNames: true,
      aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit:
        approvedSnapshotRefAccepted && creditReservationAccepted,
      approvedSnapshotRefAccepted,
      creditReservationRefAccepted: creditReservationAccepted,
      privateArtifactManifestOnly,
      workerClaimReadinessPreparedButNotCalled:
        runtimeQueueServicePayloadReady,
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
      supabaseMutationPerformed: false,
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
