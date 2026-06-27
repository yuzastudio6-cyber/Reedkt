import {
  AI_GRAPHICS_INTERNAL_BETA_BACKEND_QUEUE_STORAGE_READINESS_DECISION,
  buildAiGraphicsInternalBetaBackendQueueStorageReadiness,
  type AiGraphicsInternalBetaBackendQueueStorageReadiness,
  type AiGraphicsInternalBetaBackendQueueStorageReadinessInput,
} from './ai-graphics-internal-beta-backend-queue-storage-readiness'
import type {
  AiGraphicsCapabilityId,
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_READINESS_DECISION =
  'ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope'

export type AiGraphicsInternalBetaServiceRoleQueueTransactionReadinessStatus =
  | 'missing_backend_queue_storage_evidence'
  | 'service_role_queue_transaction_envelope_prepared_live_writes_blocked'

export interface AiGraphicsInternalBetaServiceRoleQueueTransactionReadinessInput
  extends AiGraphicsInternalBetaBackendQueueStorageReadinessInput {}

export interface AiGraphicsInternalBetaServiceRoleQueueTransactionRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  sourceJobId: string
  transactionId: string
  enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs'
  claimRpcName: 'claim_ai_graphics_tool_runtime_job'
  workerEventRpcName: 'record_ai_graphics_worker_event'
  auditEventRpcName: 'record_ai_graphics_audit_event'
  idempotencyKey: string
  jobType: 'ai_graphics_tool_runtime'
  workerType: string
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  jobBatchRowPrepared: boolean
  jobRowPrepared: boolean
  workerClaimTransactionInputPrepared: boolean
  workerEventRowsPrepared: 2 | 0
  auditEventRowsPrepared: 1 | 0
  sourceBackendQueueStorageRecordReady: boolean
  serviceRoleTransactionEnvelopeReadyWithProvidedEvidence: boolean
  canRunServiceRoleTransactionNow: false
  canInsertJobBatchNow: false
  canInsertJobNow: false
  canInsertWorkerClaimNow: false
  canInsertWorkerEventNow: false
  canInsertAuditEventNow: false
  canDispatchWorkerNow: false
  canExecuteToolNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaServiceRoleQueueTransactionCapabilityScenario {
  capabilityId: AiGraphicsCapabilityId
  selectedTransactionTools: AiGraphicsCanonicalToolId[]
  transactionToolsReadyWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  scenarioTransactionReadyWithProvidedEvidence: boolean
  canRunServiceRoleTransactionNow: false
  canDispatchWorkersNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaServiceRoleQueueTransactionReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_READINESS_DECISION
  sourceBackendQueueStorageDecision: typeof AI_GRAPHICS_INTERNAL_BETA_BACKEND_QUEUE_STORAGE_READINESS_DECISION
  status: AiGraphicsInternalBetaServiceRoleQueueTransactionReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  serviceRoleTransactionRecordsPrepared: 21
  serviceRoleTransactionRecordsReadyWithProvidedEvidence: number
  serviceRoleCapabilityScenariosPrepared: 12
  serviceRoleCapabilityScenariosReadyWithProvidedEvidence: number
  serviceRoleJobBatchRowsPrepared: 1 | 0
  serviceRoleJobRowsPrepared: number
  serviceRoleWorkerClaimTransactionInputsPrepared: number
  serviceRoleWorkerEventRowsPrepared: number
  serviceRoleAuditEventRowsPrepared: number
  liveServiceRoleTransactionsNow: 0
  liveJobBatchRowsInsertedNow: 0
  liveJobRowsInsertedNow: 0
  liveWorkerClaimRowsInsertedNow: 0
  liveWorkerEventRowsInsertedNow: 0
  liveAuditEventRowsInsertedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  sourceBackendQueueStorageReadiness: AiGraphicsInternalBetaBackendQueueStorageReadiness
  sourceBackendQueueStorageAccepted: boolean
  requiredServiceRoleRpcs: string[]
  requiredServiceRoleTables: string[]
  transactionGuarantees: string[]
  rollbackRequirements: string[]
  blockedRuntimeActions: string[]
  serviceRoleTransactionRecords: AiGraphicsInternalBetaServiceRoleQueueTransactionRecord[]
  serviceRoleCapabilityScenarios: AiGraphicsInternalBetaServiceRoleQueueTransactionCapabilityScenario[]
  nextMilestones: string[]
  booleans: {
    internalBetaServiceRoleQueueTransactionReadinessPrepared: true
    sourceBackendQueueStorageAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ServiceRoleTransactionRecordsPrepared: true
    all21ServiceRoleTransactionRecordsReadyWithProvidedEvidence: boolean
    all12CapabilityTransactionScenariosReadyWithProvidedEvidence: boolean
    serviceRoleRpcContractPrepared: true
    serviceRoleTransactionRollbackPlanPrepared: true
    all21IdempotencyKeysPrepared: boolean
    all21ApprovedSnapshotRefsAccepted: boolean
    all21CreditReservationRefsAccepted: boolean
    all21ApprovedSnapshotCreditBindingsReady: boolean
    privateArtifactManifestOnly: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    agentCanSelectForPlanning: true
    serviceRoleQueueTransactionApprovedNow: false
    serviceRoleSupabaseWritesApprovedNow: false
    liveJobBatchInsertApprovedNow: false
    liveJobInsertApprovedNow: false
    liveWorkerClaimInsertApprovedNow: false
    liveWorkerEventInsertApprovedNow: false
    liveAuditEventInsertApprovedNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionWorkerRouteExecutionApprovedNow: false
    workerLeaseCreationApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    supabaseMutationPerformed: false
    serviceRoleTransactionPerformed: false
    workerLeaseCreated: false
    productionWorkerDispatchPerformed: false
    productionWorkerRouteExecutionPerformed: false
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

const productFacingCapabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
] satisfies AiGraphicsCapabilityId[]

const requiredServiceRoleRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const requiredServiceRoleTables = [
  'job_batches',
  'jobs',
  'worker_job_claims',
  'worker_events',
  'approved_plan_snapshots',
  'credit_reservations',
  'audit_events',
]

const transactionGuarantees = [
  'every ai_graphics_tool_runtime job row must reference an immutable approved_plan_snapshot',
  'every ai_graphics_tool_runtime job row must reference an approved credit_reservation',
  'every tool payload must use a private artifact manifest reference and reject signed URLs or public artifacts',
  'enqueue writes must be idempotent by workspace, approved snapshot, tool ID, and source job ID',
  'worker claims must be created by a service-role claim transaction, not by frontend/user clients',
  'worker_events and audit_events must be append-only and created with the same transaction context',
  'a failed enqueue or claim transaction must roll back without partial tool-runtime readiness',
]

const rollbackRequirements = [
  'job batch insert rolls back if any required job row is invalid',
  'job row insert rolls back if approved snapshot, credit reservation, private manifest, or idempotency is missing',
  'worker claim transaction rolls back if an active claim already exists for the target job',
  'worker event insert rolls back with the associated service-role transaction',
  'audit event insert rolls back with the associated service-role transaction',
  'no partial live readiness claim is allowed after a failed service-role transaction',
]

const blockedRuntimeActions = [
  'live service-role queue transaction execution',
  'Supabase service-role job write',
  'job batch row insertion',
  'job row insertion',
  'worker claim row insertion',
  'worker event row insertion',
  'audit event row insertion',
  'backend queue submission',
  'live worker queue enqueue',
  'live worker claim row creation',
  'live worker lease creation',
  'live production worker dispatch',
  'production worker route execution',
  'worker execution',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta runtime unlock',
  'external beta unlock',
  'production unlock',
]

const nextMilestones = [
  'Implement reviewed Supabase RPCs for enqueue_ai_graphics_tool_runtime_jobs and claim_ai_graphics_tool_runtime_job with service-role-only access.',
  'Bind transaction input IDs to persisted approved_plan_snapshots and credit_reservations instead of fixture IDs.',
  'Run a private internal beta queue-write smoke in a non-production Supabase environment before enabling live worker dispatch.',
  'Keep external beta and production blocked until live queue writes, worker claims, worker dispatch, tool execution, artifacts, QA, and rollback evidence are owner-approved.',
]

function statusFromSource(
  sourceBackendQueueStorageAccepted: boolean,
): AiGraphicsInternalBetaServiceRoleQueueTransactionReadinessStatus {
  return sourceBackendQueueStorageAccepted
    ? 'service_role_queue_transaction_envelope_prepared_live_writes_blocked'
    : 'missing_backend_queue_storage_evidence'
}

function transactionIdFor(toolId: AiGraphicsCanonicalToolId, jobId: string): string {
  return `ai_graphics_service_role_queue_transaction:${toolId}:${jobId}`
}

function idempotencyKeyFor(toolId: AiGraphicsCanonicalToolId, jobId: string): string {
  return `ai_graphics_internal_beta_service_role_queue:${toolId}:${jobId}`
}

function isUuidRef(ref: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)
}

function approvedPlanSnapshotRefAccepted(ref: string): boolean {
  return isUuidRef(ref) || /^approved_snapshot_[a-z0-9_]+$/i.test(ref)
}

function creditReservationRefAccepted(ref: string): boolean {
  return isUuidRef(ref) || /^credit_reservation_[a-z0-9_]+$/i.test(ref)
}

function buildTransactionRecord(input: {
  sourceBackendQueueStorageAccepted: boolean
  record: AiGraphicsInternalBetaBackendQueueStorageReadiness['backendQueueStorageRecords'][number]
}): AiGraphicsInternalBetaServiceRoleQueueTransactionRecord {
  const sourceReady = input.sourceBackendQueueStorageAccepted &&
    input.record.jobServiceRecordCreated &&
    input.record.jobServiceRecordMockOnly &&
    input.record.sourceDispatcherProbeCompletedWithProvidedEvidence &&
    approvedPlanSnapshotRefAccepted(input.record.approvedPlanSnapshotId) &&
    creditReservationRefAccepted(input.record.creditReservationId) &&
    input.record.privateArtifactManifestRef.startsWith('private://')
  const transactionId = transactionIdFor(input.record.toolId, input.record.jobId)
  const idempotencyKey = idempotencyKeyFor(input.record.toolId, input.record.jobId)

  return {
    toolId: input.record.toolId,
    productionToolId: input.record.productionToolId,
    sourceJobId: input.record.jobId,
    transactionId,
    enqueueRpcName: 'enqueue_ai_graphics_tool_runtime_jobs',
    claimRpcName: 'claim_ai_graphics_tool_runtime_job',
    workerEventRpcName: 'record_ai_graphics_worker_event',
    auditEventRpcName: 'record_ai_graphics_audit_event',
    idempotencyKey,
    jobType: 'ai_graphics_tool_runtime',
    workerType: input.record.workerType,
    runtimeTarget: input.record.runtimeTarget,
    capabilityIds: [...input.record.capabilityIds],
    approvedPlanSnapshotId: input.record.approvedPlanSnapshotId,
    creditReservationId: input.record.creditReservationId,
    privateArtifactManifestRef: input.record.privateArtifactManifestRef,
    jobBatchRowPrepared: sourceReady,
    jobRowPrepared: sourceReady,
    workerClaimTransactionInputPrepared: sourceReady,
    workerEventRowsPrepared: sourceReady ? 2 : 0,
    auditEventRowsPrepared: sourceReady ? 1 : 0,
    sourceBackendQueueStorageRecordReady: sourceReady,
    serviceRoleTransactionEnvelopeReadyWithProvidedEvidence: sourceReady,
    canRunServiceRoleTransactionNow: false,
    canInsertJobBatchNow: false,
    canInsertJobNow: false,
    canInsertWorkerClaimNow: false,
    canInsertWorkerEventNow: false,
    canInsertAuditEventNow: false,
    canDispatchWorkerNow: false,
    canExecuteToolNow: false,
    blockedRuntimeActions,
  }
}

function capabilityScenarios(
  records: AiGraphicsInternalBetaServiceRoleQueueTransactionRecord[],
): AiGraphicsInternalBetaServiceRoleQueueTransactionCapabilityScenario[] {
  return productFacingCapabilities.map((capabilityId) => {
    const selectedTransactionTools = records
      .filter((record) => record.capabilityIds.includes(capabilityId))
      .map((record) => record.toolId)
    const transactionToolsReadyWithProvidedEvidence = records
      .filter((record) => (
        record.capabilityIds.includes(capabilityId) &&
        record.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence
      ))
      .map((record) => record.toolId)

    return {
      capabilityId,
      selectedTransactionTools,
      transactionToolsReadyWithProvidedEvidence,
      scenarioTransactionReadyWithProvidedEvidence:
        selectedTransactionTools.length > 0 &&
        transactionToolsReadyWithProvidedEvidence.length === selectedTransactionTools.length,
      canRunServiceRoleTransactionNow: false,
      canDispatchWorkersNow: false,
      canExecuteToolsNow: false,
    }
  })
}

export async function buildAiGraphicsInternalBetaServiceRoleQueueTransactionReadiness(
  input: AiGraphicsInternalBetaServiceRoleQueueTransactionReadinessInput = {},
): Promise<AiGraphicsInternalBetaServiceRoleQueueTransactionReadiness> {
  const sourceBackendQueueStorageReadiness =
    await buildAiGraphicsInternalBetaBackendQueueStorageReadiness(input)
  const sourceBackendQueueStorageAccepted =
    sourceBackendQueueStorageReadiness.status ===
      'mock_service_queue_records_created_runtime_still_blocked' &&
    sourceBackendQueueStorageReadiness.booleans.all21BackendQueueStorageRecordsCreatedWithProvidedEvidence &&
    sourceBackendQueueStorageReadiness.booleans.all12CapabilityScenariosCreatedWithProvidedEvidence
  const status = statusFromSource(sourceBackendQueueStorageAccepted)
  const serviceRoleTransactionRecords =
    sourceBackendQueueStorageReadiness.backendQueueStorageRecords.map((record) => (
      buildTransactionRecord({ sourceBackendQueueStorageAccepted, record })
    ))
  const serviceRoleCapabilityScenarios =
    capabilityScenarios(serviceRoleTransactionRecords)
  const serviceRoleTransactionRecordsReadyWithProvidedEvidence =
    serviceRoleTransactionRecords.filter((record) => (
      record.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence
    )).length
  const serviceRoleCapabilityScenariosReadyWithProvidedEvidence =
    serviceRoleCapabilityScenarios.filter((scenario) => (
      scenario.scenarioTransactionReadyWithProvidedEvidence
    )).length
  const serviceRoleWorkerEventRowsPrepared = serviceRoleTransactionRecords.reduce(
    (total, record) => total + record.workerEventRowsPrepared,
    0,
  )
  const serviceRoleAuditEventRowsPrepared = serviceRoleTransactionRecords.reduce(
    (total, record) => total + record.auditEventRowsPrepared,
    0,
  )
  const all21ApprovedSnapshotRefsAccepted =
    serviceRoleTransactionRecords.length === 21 &&
    serviceRoleTransactionRecords.every((record) => (
      approvedPlanSnapshotRefAccepted(record.approvedPlanSnapshotId)
    ))
  const all21CreditReservationRefsAccepted =
    serviceRoleTransactionRecords.length === 21 &&
    serviceRoleTransactionRecords.every((record) => (
      creditReservationRefAccepted(record.creditReservationId)
    ))

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_READINESS_DECISION,
    sourceBackendQueueStorageDecision:
      AI_GRAPHICS_INTERNAL_BETA_BACKEND_QUEUE_STORAGE_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    serviceRoleTransactionRecordsPrepared: serviceRoleTransactionRecords.length as 21,
    serviceRoleTransactionRecordsReadyWithProvidedEvidence,
    serviceRoleCapabilityScenariosPrepared:
      serviceRoleCapabilityScenarios.length as 12,
    serviceRoleCapabilityScenariosReadyWithProvidedEvidence,
    serviceRoleJobBatchRowsPrepared:
      serviceRoleTransactionRecordsReadyWithProvidedEvidence === 21 ? 1 : 0,
    serviceRoleJobRowsPrepared: serviceRoleTransactionRecordsReadyWithProvidedEvidence,
    serviceRoleWorkerClaimTransactionInputsPrepared:
      serviceRoleTransactionRecordsReadyWithProvidedEvidence,
    serviceRoleWorkerEventRowsPrepared,
    serviceRoleAuditEventRowsPrepared,
    liveServiceRoleTransactionsNow: 0,
    liveJobBatchRowsInsertedNow: 0,
    liveJobRowsInsertedNow: 0,
    liveWorkerClaimRowsInsertedNow: 0,
    liveWorkerEventRowsInsertedNow: 0,
    liveAuditEventRowsInsertedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    sourceBackendQueueStorageReadiness,
    sourceBackendQueueStorageAccepted,
    requiredServiceRoleRpcs,
    requiredServiceRoleTables,
    transactionGuarantees,
    rollbackRequirements,
    blockedRuntimeActions,
    serviceRoleTransactionRecords,
    serviceRoleCapabilityScenarios,
    nextMilestones,
    booleans: {
      internalBetaServiceRoleQueueTransactionReadinessPrepared: true,
      sourceBackendQueueStorageAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ServiceRoleTransactionRecordsPrepared: true,
      all21ServiceRoleTransactionRecordsReadyWithProvidedEvidence:
        serviceRoleTransactionRecordsReadyWithProvidedEvidence === 21,
      all12CapabilityTransactionScenariosReadyWithProvidedEvidence:
        serviceRoleCapabilityScenariosReadyWithProvidedEvidence === 12,
      serviceRoleRpcContractPrepared: true,
      serviceRoleTransactionRollbackPlanPrepared: true,
      all21IdempotencyKeysPrepared:
        serviceRoleTransactionRecords.every((record) => record.idempotencyKey.length > 0),
      all21ApprovedSnapshotRefsAccepted,
      all21CreditReservationRefsAccepted,
      all21ApprovedSnapshotCreditBindingsReady:
        serviceRoleTransactionRecordsReadyWithProvidedEvidence === 21 &&
        all21ApprovedSnapshotRefsAccepted &&
        all21CreditReservationRefsAccepted,
      privateArtifactManifestOnly:
        sourceBackendQueueStorageReadiness.booleans.privateArtifactManifestOnly,
      gpuHeavyToolsTargetGpuRuntime:
        sourceBackendQueueStorageReadiness.booleans.gpuHeavyToolsTargetGpuRuntime,
      agentCanSelectForPlanning: true,
      serviceRoleQueueTransactionApprovedNow: false,
      serviceRoleSupabaseWritesApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      supabaseMutationPerformed: false,
      serviceRoleTransactionPerformed: false,
      workerLeaseCreated: false,
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
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
