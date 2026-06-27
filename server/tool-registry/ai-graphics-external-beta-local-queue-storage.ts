import { loadRuntimeEnv } from '../config/env'
import { createJobService } from '../services/job-service'
import type { ServiceContext } from '../types'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION,
  evaluateAiGraphicsExternalBetaServiceRoleQueueTransaction,
  type AiGraphicsExternalBetaServiceRoleQueueTransaction,
  type AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope,
  type AiGraphicsExternalBetaServiceRoleQueueTransactionInput,
} from './ai-graphics-external-beta-service-role-queue-transaction'
import type { ProductionToolId } from './production-tool-types'
import type { ProductionWorkerRuntimeType } from '../workers/production'

export const AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION =
  'ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaLocalQueueStorageStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_service_role_queue_transaction'
  | 'missing_external_beta_local_queue_storage_controls'
  | 'external_beta_local_queue_storage_mock_record_ready'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaLocalQueueStorageInput
  extends AiGraphicsExternalBetaServiceRoleQueueTransactionInput {
  sourceExternalBetaServiceRoleQueueTransactionPacket?: AiGraphicsExternalBetaServiceRoleQueueTransaction
  externalBetaLocalQueueStorageRef?: string
  externalBetaMockJobServiceRef?: string
  externalBetaLocalQueueStorageSchemaRef?: string
  externalBetaLocalQueueStorageIsolationRef?: string
}

export interface AiGraphicsExternalBetaLocalQueueStorageRecord {
  toolId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityId: string
  sourceTransactionId: string
  sourceJobId: string
  jobBatchId: string
  jobId: string
  jobType: 'ai_graphics_tool_runtime'
  approvedSnapshotId: string
  creditReservationId?: string
  privateArtifactManifestRef: string
  localQueueStatus: 'queued'
  jobBatchMockOnly: boolean
  jobRecordMockOnly: boolean
  jobServiceWarningCount: number
  sourceServiceRoleTransactionReadyWithProvidedEvidence: boolean
  localQueueRecordReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  canWriteSupabaseJobNow: false
  canCreateWorkerClaimNow: false
  canCreateWorkerLeaseNow: false
  canDispatchWorkerNow: false
  canExecuteToolNow: false
}

export interface AiGraphicsExternalBetaLocalQueueStorage {
  decision: AiGraphicsExternalBetaLocalQueueStorageStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION
  sourceExternalBetaServiceRoleQueueTransactionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceExternalBetaServiceRoleQueueTransaction: AiGraphicsExternalBetaServiceRoleQueueTransaction
  sourceExternalBetaServiceRoleQueueTransactionAccepted: boolean
  missingLocalQueueStorageControls: string[]
  externalBetaLocalQueueStorageControlsSatisfied: boolean
  externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence: boolean
  externalBetaLocalQueueStorageRecord: AiGraphicsExternalBetaLocalQueueStorageRecord | null
  localMockJobBatchRecordsCreatedNow: 0 | 1
  localMockJobRecordsCreatedNow: 0 | 1
  liveSupabaseJobWritesNow: 0
  liveWorkerClaimRowsNow: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  localQueueStoragePolicy: {
    sideEffectFreeLocalQueueCheck: true
    sourceServiceRoleTransactionEnvelopeRequired: true
    localQueueStorageRefRequired: true
    mockJobServiceRequired: true
    localQueueStorageSchemaRequired: true
    localQueueStorageIsolationRequired: true
    useExistingJobServiceBoundary: true
    localMockRecordsOnly: true
    noSupabaseWrites: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    externalBetaLocalQueueStoragePrepared: true
    sourceExternalBetaServiceRoleQueueTransactionAccepted: boolean
    externalBetaLocalQueueStorageControlsSatisfied: boolean
    externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    usesExistingJobServiceBoundary: true
    jobBatchMockOnly: boolean
    jobRecordMockOnly: boolean
    aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: boolean
    approvedSnapshotRefAccepted: boolean
    creditReservationRefAccepted: boolean
    privateArtifactManifestOnly: boolean
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

const localQueueStoragePolicy = {
  sideEffectFreeLocalQueueCheck: true,
  sourceServiceRoleTransactionEnvelopeRequired: true,
  localQueueStorageRefRequired: true,
  mockJobServiceRequired: true,
  localQueueStorageSchemaRequired: true,
  localQueueStorageIsolationRequired: true,
  useExistingJobServiceBoundary: true,
  localMockRecordsOnly: true,
  noSupabaseWrites: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function serviceRoleTransactionAccepted(
  packet: AiGraphicsExternalBetaServiceRoleQueueTransaction,
): boolean {
  return packet.decision === 'external_beta_service_role_queue_transaction_envelope_ready' &&
    packet.externalBetaServiceRoleQueueTransactionEnvelopeReadyWithProvidedEvidence === true &&
    packet.externalBetaServiceRoleQueueTransactionEnvelope !== null &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.serviceRoleTransactionPerformed === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingLocalQueueStorageControls(
  input: AiGraphicsExternalBetaLocalQueueStorageInput,
): string[] {
  return [
    !hasValue(input.externalBetaLocalQueueStorageRef)
      ? 'external beta local queue storage reference is missing'
      : undefined,
    !hasValue(input.externalBetaMockJobServiceRef)
      ? 'external beta mock job service reference is missing'
      : undefined,
    !hasValue(input.externalBetaLocalQueueStorageSchemaRef)
      ? 'external beta local queue storage schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaLocalQueueStorageIsolationRef)
      ? 'external beta local queue storage isolation reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  transaction: AiGraphicsExternalBetaServiceRoleQueueTransaction
  sourceTransactionAccepted: boolean
  executionRequested: boolean
  localQueueRecordReady: boolean
}): AiGraphicsExternalBetaLocalQueueStorageStatus {
  if (input.transaction.decision === 'invalid_capability_blocked') {
    return 'invalid_capability_blocked'
  }
  if (input.transaction.decision === 'requested_tool_eliminated') {
    return 'requested_tool_eliminated'
  }
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.sourceTransactionAccepted) {
    return 'missing_external_beta_service_role_queue_transaction'
  }
  return input.localQueueRecordReady
    ? 'external_beta_local_queue_storage_mock_record_ready'
    : 'missing_external_beta_local_queue_storage_controls'
}

function createMockQueueServiceContext(): ServiceContext {
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
    requestId: 'ai-graphics-external-beta-local-queue-storage',
    auth: { userId: 'ai-graphics-external-beta-local-queue-storage', isMockUser: true },
  }
}

function privateArtifactManifestRef(
  envelope: AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope,
): string {
  return envelope.sourceQueueSubmissionEnvelope.productionWorkerJobPayload
    .storageReferenceIds[0] ?? ''
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

async function createLocalQueueStorageRecord(
  envelope: AiGraphicsExternalBetaServiceRoleQueueTransactionEnvelope,
): Promise<AiGraphicsExternalBetaLocalQueueStorageRecord> {
  const service = createJobService(createMockQueueServiceContext())
  const batchResult = await service.createJobBatch({
    workspaceId: envelope.jobBatchRowCandidate.workspaceId,
    projectId: envelope.jobBatchRowCandidate.projectId,
    approvedPlanSnapshotId: envelope.jobRowCandidate.approvedSnapshotId,
    name: 'AI graphics external beta local queue storage',
  })
  const jobBatch = batchResult.jobBatch as { id?: string; mockOnly?: boolean }
  const jobResult = await service.createJob({
    workspaceId: envelope.jobRowCandidate.workspaceId,
    projectId: envelope.jobRowCandidate.projectId,
    jobType: 'ai_graphics_tool_runtime',
    jobBatchId: jobBatch.id,
    approvedPlanSnapshotId: envelope.jobRowCandidate.approvedSnapshotId,
    creditReservationId: envelope.jobRowCandidate.creditReservationId,
    payloadJson: {
      aiGraphicsCanonicalToolId: envelope.toolId,
      productionToolId: envelope.productionToolId,
      workerType: envelope.workerType,
      runtimeTarget: envelope.runtimeTarget,
      capabilityId: envelope.capabilityId,
      sourceTransactionId: envelope.transactionId,
      privateArtifactManifestRef: privateArtifactManifestRef(envelope),
      sourceServiceRoleTransactionReadyWithProvidedEvidence:
        envelope.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence,
      liveRuntimeAllowedNow: false,
      serviceRoleTransactionPerformed: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  })
  const job = jobResult.job as { id?: string; status?: string; mockOnly?: boolean }
  const privateManifest = privateArtifactManifestRef(envelope)
  const jobBatchMockOnly = jobBatch.mockOnly === true
  const jobRecordMockOnly = job.mockOnly === true
  const localQueueRecordReadyWithProvidedEvidence = Boolean(
    jobBatch.id &&
      job.id &&
      job.status === 'queued' &&
      jobBatchMockOnly &&
      jobRecordMockOnly &&
      envelope.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence &&
      privateManifest.startsWith('private://'),
  )

  return {
    toolId: envelope.toolId,
    productionToolId: envelope.productionToolId,
    workerType: envelope.workerType,
    runtimeTarget: envelope.runtimeTarget,
    capabilityId: envelope.capabilityId,
    sourceTransactionId: envelope.transactionId,
    sourceJobId: envelope.jobRowCandidate.jobId,
    jobBatchId: jobBatch.id ?? 'missing_job_batch_id',
    jobId: job.id ?? 'missing_job_id',
    jobType: 'ai_graphics_tool_runtime',
    approvedSnapshotId: envelope.jobRowCandidate.approvedSnapshotId,
    creditReservationId: envelope.jobRowCandidate.creditReservationId,
    privateArtifactManifestRef: privateManifest,
    localQueueStatus: 'queued',
    jobBatchMockOnly,
    jobRecordMockOnly,
    jobServiceWarningCount: batchResult.warnings.length + jobResult.warnings.length,
    sourceServiceRoleTransactionReadyWithProvidedEvidence:
      envelope.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence,
    localQueueRecordReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      envelope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    canWriteSupabaseJobNow: false,
    canCreateWorkerClaimNow: false,
    canCreateWorkerLeaseNow: false,
    canDispatchWorkerNow: false,
    canExecuteToolNow: false,
  }
}

export async function evaluateAiGraphicsExternalBetaLocalQueueStorage(
  input: AiGraphicsExternalBetaLocalQueueStorageInput,
): Promise<AiGraphicsExternalBetaLocalQueueStorage> {
  const transaction =
    input.sourceExternalBetaServiceRoleQueueTransactionPacket ??
    evaluateAiGraphicsExternalBetaServiceRoleQueueTransaction(input)
  const executionRequested =
    input.executionRequested === true || transaction.executionRequested === true
  const sourceTransactionAccepted = serviceRoleTransactionAccepted(transaction)
  const missingControls = executionRequested ? missingLocalQueueStorageControls(input) : []
  const controlsSatisfied =
    executionRequested &&
    sourceTransactionAccepted &&
    missingControls.length === 0
  const transactionEnvelope =
    transaction.externalBetaServiceRoleQueueTransactionEnvelope
  const localQueueRecord =
    controlsSatisfied && transactionEnvelope
      ? await createLocalQueueStorageRecord(transactionEnvelope)
      : null
  const localQueueRecordReady =
    localQueueRecord?.localQueueRecordReadyWithProvidedEvidence === true
  const approvedSnapshotRefAccepted = localQueueRecord
    ? approvedPlanSnapshotRefAccepted(localQueueRecord.approvedSnapshotId)
    : false
  const creditReservationAccepted = localQueueRecord
    ? creditReservationRefAccepted(localQueueRecord.creditReservationId)
    : false
  const privateArtifactManifestOnly = localQueueRecord
    ? localQueueRecord.privateArtifactManifestRef.startsWith('private://')
    : false
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    localQueueRecordReady &&
    localQueueRecord.gpuRuntimeStartAllowedForAcceptedExternalBetaJob

  return {
    decision: decisionFromInput({
      transaction,
      sourceTransactionAccepted,
      executionRequested,
      localQueueRecordReady,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_LOCAL_QUEUE_STORAGE_DECISION,
    sourceExternalBetaServiceRoleQueueTransactionDecision:
      AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_DECISION,
    capabilityId: transaction.capabilityId,
    requestedToolId: transaction.requestedToolId,
    executionRequested,
    sourceExternalBetaServiceRoleQueueTransaction: transaction,
    sourceExternalBetaServiceRoleQueueTransactionAccepted: sourceTransactionAccepted,
    missingLocalQueueStorageControls: missingControls,
    externalBetaLocalQueueStorageControlsSatisfied: controlsSatisfied,
    externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence:
      localQueueRecordReady,
    externalBetaLocalQueueStorageRecord: localQueueRecord,
    localMockJobBatchRecordsCreatedNow: localQueueRecordReady ? 1 : 0,
    localMockJobRecordsCreatedNow: localQueueRecordReady ? 1 : 0,
    liveSupabaseJobWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    localQueueStoragePolicy,
    booleans: {
      externalBetaLocalQueueStoragePrepared: true,
      sourceExternalBetaServiceRoleQueueTransactionAccepted: sourceTransactionAccepted,
      externalBetaLocalQueueStorageControlsSatisfied: controlsSatisfied,
      externalBetaLocalQueueStorageRecordReadyWithProvidedEvidence:
        localQueueRecordReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      usesExistingJobServiceBoundary: true,
      jobBatchMockOnly: localQueueRecord?.jobBatchMockOnly === true,
      jobRecordMockOnly: localQueueRecord?.jobRecordMockOnly === true,
      aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit:
        approvedSnapshotRefAccepted && creditReservationAccepted,
      approvedSnapshotRefAccepted,
      creditReservationRefAccepted: creditReservationAccepted,
      privateArtifactManifestOnly,
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
