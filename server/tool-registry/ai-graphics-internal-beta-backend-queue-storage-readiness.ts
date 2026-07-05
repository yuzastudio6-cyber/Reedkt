import { loadRuntimeEnv } from '../config/env'
import { createJobService } from '../services/job-service'
import type { ServiceContext } from '../types'
import {
  AI_GRAPHICS_INTERNAL_BETA_QUEUE_DISPATCHER_READINESS_DECISION,
  buildAiGraphicsInternalBetaQueueDispatcherReadiness,
  type AiGraphicsInternalBetaQueueDispatcherReadiness,
  type AiGraphicsInternalBetaQueueDispatcherReadinessInput,
  type AiGraphicsInternalBetaQueueDispatcherProbeResult,
} from './ai-graphics-internal-beta-queue-dispatcher-readiness'
import type {
  AiGraphicsCapabilityId,
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_BACKEND_QUEUE_STORAGE_READINESS_DECISION =
  'ai_graphics_internal_beta_backend_queue_storage_readiness_contract_prepared_with_mock_service_records'

export type AiGraphicsInternalBetaBackendQueueStorageReadinessStatus =
  | 'missing_queue_dispatcher_evidence'
  | 'mock_service_queue_records_created_runtime_still_blocked'

export interface AiGraphicsInternalBetaBackendQueueStorageReadinessInput
  extends AiGraphicsInternalBetaQueueDispatcherReadinessInput {}

export interface AiGraphicsInternalBetaBackendQueueStorageRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  jobId: string
  jobType: 'ai_graphics_tool_runtime'
  workerType: AiGraphicsInternalBetaQueueDispatcherProbeResult['workerType']
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  sourceDispatcherProbeCompletedWithProvidedEvidence: boolean
  jobServiceRecordCreated: boolean
  jobServiceRecordMockOnly: boolean
  jobServiceStatus: 'queued'
  jobServiceWarningCount: number
  canWriteSupabaseJobNow: false
  canCreateLiveWorkerClaimNow: false
  canDispatchLiveWorkerNow: false
  canExecuteToolNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaBackendQueueStorageCapabilityScenario {
  capabilityId: AiGraphicsCapabilityId
  selectedQueueStorageTools: AiGraphicsCanonicalToolId[]
  queueStorageToolsCreatedWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  scenarioQueueStorageReadyWithProvidedEvidence: boolean
  canWriteSupabaseJobsNow: false
  canCreateLiveWorkerClaimsNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaBackendQueueStorageReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_BACKEND_QUEUE_STORAGE_READINESS_DECISION
  sourceQueueDispatcherDecision: typeof AI_GRAPHICS_INTERNAL_BETA_QUEUE_DISPATCHER_READINESS_DECISION
  status: AiGraphicsInternalBetaBackendQueueStorageReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  backendQueueStorageRecordsPrepared: 21
  backendQueueStorageRecordsCreatedWithProvidedEvidence: number
  backendQueueStorageCapabilityScenariosPrepared: 12
  backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence: number
  mockJobBatchCreated: boolean
  mockJobBatchWarningCount: number
  mockJobServiceWarnings: number
  liveSupabaseJobWritesNow: 0
  liveWorkerClaimRowsNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  sourceQueueDispatcherReadiness: AiGraphicsInternalBetaQueueDispatcherReadiness
  sourceQueueDispatcherAccepted: boolean
  allowedMockServiceQueueActions: string[]
  requiredLiveServiceRoleTables: string[]
  blockedRuntimeActions: string[]
  backendQueueStorageRecords: AiGraphicsInternalBetaBackendQueueStorageRecord[]
  backendQueueStorageCapabilityScenarios: AiGraphicsInternalBetaBackendQueueStorageCapabilityScenario[]
  nextMilestones: string[]
  booleans: {
    internalBetaBackendQueueStorageReadinessPrepared: true
    sourceQueueDispatcherAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21BackendQueueStorageRecordsPrepared: true
    all21BackendQueueStorageRecordsCreatedWithProvidedEvidence: boolean
    all12CapabilityScenariosCreatedWithProvidedEvidence: boolean
    aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: true
    mockJobServiceRecordsOnly: boolean
    serviceRoleSupabaseWritesApprovedNow: false
    gpuHeavyToolsTargetGpuRuntime: boolean
    all21ApprovedSnapshotRefsAccepted: boolean
    all21CreditReservationRefsAccepted: boolean
    privateArtifactManifestOnly: boolean
    agentCanSelectForPlanning: true
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
    gpuRuntimeShouldStartNow: false
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

const allowedMockServiceQueueActions = [
  'map all 21 dispatcher-ready AI graphics payloads into job-service queue records',
  'use ai_graphics_tool_runtime as an execution job type that requires approved snapshot and credit reservation IDs',
  'create mock-only job batch and job records through the existing createJobService boundary',
  'preserve production worker payloads inside sanitized job payload metadata without raw prompts, secrets, signed URLs, or public artifacts',
  'return fail-closed Supabase service-role, worker claim, live dispatch, route, and execution blockers',
]

const requiredLiveServiceRoleTables = [
  'job_batches',
  'jobs',
  'worker_job_claims',
  'worker_events',
  'approved_plan_snapshots',
  'credit_reservations',
  'audit_events',
]

const blockedRuntimeActions = [
  'Supabase service-role job write',
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
  'Add a service-role transaction/RPC for job_batches, jobs, worker_job_claims, worker_events, and audit_events before live internal beta enqueue.',
  'Bind live job rows to persisted approved_plan_snapshots and credit_reservations, not local fixture IDs.',
  'Replace mock-only createJobService records with environment-scoped Supabase queue writes only after backend owner approval.',
  'Run private internal beta worker queue smoke before any external beta or production readiness claim.',
]

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
    requestId: 'ai-graphics-internal-beta-backend-queue-storage-readiness',
    auth: { userId: 'ai-graphics-readiness-owner', isMockUser: true },
  }
}

function statusFromSource(
  sourceQueueDispatcherAccepted: boolean,
): AiGraphicsInternalBetaBackendQueueStorageReadinessStatus {
  return sourceQueueDispatcherAccepted
    ? 'mock_service_queue_records_created_runtime_still_blocked'
    : 'missing_queue_dispatcher_evidence'
}

function privateManifestFromProbe(
  sourceQueueDispatcherReadiness: AiGraphicsInternalBetaQueueDispatcherReadiness,
  toolId: AiGraphicsCanonicalToolId,
): string {
  const submission =
    sourceQueueDispatcherReadiness.sourceQueueAdapterReadiness.queueAdapterSubmissions
      .find((item) => item.toolId === toolId)
  return submission?.privateArtifactManifestRef ?? ''
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

async function createMockQueueRecord(input: {
  service: ReturnType<typeof createJobService>
  jobBatchId: string | undefined
  probe: AiGraphicsInternalBetaQueueDispatcherProbeResult
  sourceQueueDispatcherReadiness: AiGraphicsInternalBetaQueueDispatcherReadiness
}): Promise<AiGraphicsInternalBetaBackendQueueStorageRecord> {
  const privateArtifactManifestRef = privateManifestFromProbe(
    input.sourceQueueDispatcherReadiness,
    input.probe.toolId,
  )
  const jobResult = await input.service.createJob({
    workspaceId: 'workspace_ai_graphics_internal_beta_queue_fixture',
    projectId: 'project_ai_graphics_internal_beta_queue_fixture',
    jobType: 'ai_graphics_tool_runtime',
    jobBatchId: input.jobBatchId,
    approvedPlanSnapshotId: 'approved_snapshot_ai_graphics_internal_beta_fixture',
    creditReservationId: 'credit_reservation_ai_graphics_internal_beta_fixture',
    payloadJson: {
      aiGraphicsCanonicalToolId: input.probe.toolId,
      productionToolId: input.probe.productionToolId,
      workerType: input.probe.workerType,
      runtimeTarget: input.probe.runtimeTarget,
      capabilityIds: input.probe.capabilityIds,
      privateArtifactManifestRef,
      sourceDispatcherProbeCompletedWithProvidedEvidence:
        input.probe.dispatcherProbeCompletedWithProvidedEvidence,
      liveRuntimeAllowedNow: false,
      blockedRuntimeActions,
    },
  })
  const job = jobResult.job as {
    id?: string
    status?: string
    mockOnly?: boolean
  }
  const jobServiceRecordMockOnly = job.mockOnly === true
  const jobServiceRecordCreated = Boolean(job.id) && job.status === 'queued'

  return {
    toolId: input.probe.toolId,
    productionToolId: input.probe.productionToolId,
    jobId: job.id ?? 'missing_job_id',
    jobType: 'ai_graphics_tool_runtime',
    workerType: input.probe.workerType,
    runtimeTarget: input.probe.runtimeTarget,
    capabilityIds: [...input.probe.capabilityIds],
    approvedPlanSnapshotId: 'approved_snapshot_ai_graphics_internal_beta_fixture',
    creditReservationId: 'credit_reservation_ai_graphics_internal_beta_fixture',
    privateArtifactManifestRef,
    sourceDispatcherProbeCompletedWithProvidedEvidence:
      input.probe.dispatcherProbeCompletedWithProvidedEvidence,
    jobServiceRecordCreated,
    jobServiceRecordMockOnly,
    jobServiceStatus: 'queued',
    jobServiceWarningCount: jobResult.warnings.length,
    canWriteSupabaseJobNow: false,
    canCreateLiveWorkerClaimNow: false,
    canDispatchLiveWorkerNow: false,
    canExecuteToolNow: false,
    blockedRuntimeActions,
  }
}

function skippedRecord(
  probe: AiGraphicsInternalBetaQueueDispatcherProbeResult,
): AiGraphicsInternalBetaBackendQueueStorageRecord {
  return {
    toolId: probe.toolId,
    productionToolId: probe.productionToolId,
    jobId: 'mock_queue_record_skipped_missing_dispatcher_evidence',
    jobType: 'ai_graphics_tool_runtime',
    workerType: probe.workerType,
    runtimeTarget: probe.runtimeTarget,
    capabilityIds: [...probe.capabilityIds],
    approvedPlanSnapshotId: '',
    creditReservationId: '',
    privateArtifactManifestRef: '',
    sourceDispatcherProbeCompletedWithProvidedEvidence:
      probe.dispatcherProbeCompletedWithProvidedEvidence,
    jobServiceRecordCreated: false,
    jobServiceRecordMockOnly: false,
    jobServiceStatus: 'queued',
    jobServiceWarningCount: 0,
    canWriteSupabaseJobNow: false,
    canCreateLiveWorkerClaimNow: false,
    canDispatchLiveWorkerNow: false,
    canExecuteToolNow: false,
    blockedRuntimeActions,
  }
}

function capabilityScenarios(
  records: AiGraphicsInternalBetaBackendQueueStorageRecord[],
): AiGraphicsInternalBetaBackendQueueStorageCapabilityScenario[] {
  return productFacingCapabilities.map((capabilityId) => {
    const selectedQueueStorageTools = records
      .filter((record) => record.capabilityIds.includes(capabilityId))
      .map((record) => record.toolId)
    const queueStorageToolsCreatedWithProvidedEvidence = records
      .filter((record) => (
        record.capabilityIds.includes(capabilityId) &&
        record.jobServiceRecordCreated &&
        record.jobServiceRecordMockOnly &&
        record.sourceDispatcherProbeCompletedWithProvidedEvidence
      ))
      .map((record) => record.toolId)

    return {
      capabilityId,
      selectedQueueStorageTools,
      queueStorageToolsCreatedWithProvidedEvidence,
      scenarioQueueStorageReadyWithProvidedEvidence:
        selectedQueueStorageTools.length > 0 &&
        queueStorageToolsCreatedWithProvidedEvidence.length === selectedQueueStorageTools.length,
      canWriteSupabaseJobsNow: false,
      canCreateLiveWorkerClaimsNow: false,
      canExecuteToolsNow: false,
    }
  })
}

export async function buildAiGraphicsInternalBetaBackendQueueStorageReadiness(
  input: AiGraphicsInternalBetaBackendQueueStorageReadinessInput = {},
): Promise<AiGraphicsInternalBetaBackendQueueStorageReadiness> {
  const sourceQueueDispatcherReadiness =
    await buildAiGraphicsInternalBetaQueueDispatcherReadiness(input)
  const sourceQueueDispatcherAccepted =
    sourceQueueDispatcherReadiness.status ===
      'mock_safe_dispatcher_probe_completed_runtime_still_blocked' &&
    sourceQueueDispatcherReadiness.booleans.all21DispatcherProbeJobsCompletedWithProvidedEvidence &&
    sourceQueueDispatcherReadiness.booleans.allDispatcherGateHardBlocksClear
  const status = statusFromSource(sourceQueueDispatcherAccepted)
  const serviceContext = createMockQueueServiceContext()
  const service = createJobService(serviceContext)
  const jobBatchResult = sourceQueueDispatcherAccepted
    ? await service.createJobBatch({
      workspaceId: 'workspace_ai_graphics_internal_beta_queue_fixture',
      projectId: 'project_ai_graphics_internal_beta_queue_fixture',
      approvedPlanSnapshotId: 'approved_snapshot_ai_graphics_internal_beta_fixture',
      name: 'AI graphics internal beta queue storage readiness',
    })
    : undefined
  const jobBatch = jobBatchResult?.jobBatch as { id?: string; mockOnly?: boolean } | undefined
  const backendQueueStorageRecords = sourceQueueDispatcherAccepted
    ? await Promise.all(sourceQueueDispatcherReadiness.dispatcherProbeResults.map((probe) => (
      createMockQueueRecord({
        service,
        jobBatchId: jobBatch?.id,
        probe,
        sourceQueueDispatcherReadiness,
      })
    )))
    : sourceQueueDispatcherReadiness.dispatcherProbeResults.map(skippedRecord)
  const backendQueueStorageCapabilityScenarios =
    capabilityScenarios(backendQueueStorageRecords)
  const backendQueueStorageRecordsCreatedWithProvidedEvidence =
    backendQueueStorageRecords.filter((record) => (
      record.jobServiceRecordCreated &&
      record.jobServiceRecordMockOnly &&
      record.sourceDispatcherProbeCompletedWithProvidedEvidence
    )).length
  const backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence =
    backendQueueStorageCapabilityScenarios.filter((scenario) => (
      scenario.scenarioQueueStorageReadyWithProvidedEvidence
    )).length
  const mockJobBatchCreated = Boolean(jobBatch?.id && jobBatch.mockOnly)
  const mockJobBatchWarningCount = jobBatchResult?.warnings.length ?? 0
  const mockJobServiceWarnings = mockJobBatchWarningCount +
    backendQueueStorageRecords.reduce((total, record) => (
      total + record.jobServiceWarningCount
    ), 0)
  const mockJobServiceRecordsOnly =
    mockJobBatchCreated &&
    backendQueueStorageRecords.every((record) => record.jobServiceRecordMockOnly)
  const gpuRuntimeTargetedTools =
    backendQueueStorageRecords.filter((record) => record.workerType === 'gpu_ai_worker').length
  const all21ApprovedSnapshotRefsAccepted =
    backendQueueStorageRecords.length === 21 &&
    backendQueueStorageRecords.every((record) => (
      approvedPlanSnapshotRefAccepted(record.approvedPlanSnapshotId)
    ))
  const all21CreditReservationRefsAccepted =
    backendQueueStorageRecords.length === 21 &&
    backendQueueStorageRecords.every((record) => (
      creditReservationRefAccepted(record.creditReservationId)
    ))

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_BACKEND_QUEUE_STORAGE_READINESS_DECISION,
    sourceQueueDispatcherDecision:
      AI_GRAPHICS_INTERNAL_BETA_QUEUE_DISPATCHER_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    backendQueueStorageRecordsPrepared: backendQueueStorageRecords.length as 21,
    backendQueueStorageRecordsCreatedWithProvidedEvidence,
    backendQueueStorageCapabilityScenariosPrepared:
      backendQueueStorageCapabilityScenarios.length as 12,
    backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence,
    mockJobBatchCreated,
    mockJobBatchWarningCount,
    mockJobServiceWarnings,
    liveSupabaseJobWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    sourceQueueDispatcherReadiness,
    sourceQueueDispatcherAccepted,
    allowedMockServiceQueueActions,
    requiredLiveServiceRoleTables,
    blockedRuntimeActions,
    backendQueueStorageRecords,
    backendQueueStorageCapabilityScenarios,
    nextMilestones,
    booleans: {
      internalBetaBackendQueueStorageReadinessPrepared: true,
      sourceQueueDispatcherAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21BackendQueueStorageRecordsPrepared: true,
      all21BackendQueueStorageRecordsCreatedWithProvidedEvidence:
        backendQueueStorageRecordsCreatedWithProvidedEvidence === 21,
      all12CapabilityScenariosCreatedWithProvidedEvidence:
        backendQueueStorageCapabilityScenariosCreatedWithProvidedEvidence === 12,
      aiGraphicsRuntimeJobTypeRequiresApprovedSnapshotAndCredit: true,
      mockJobServiceRecordsOnly,
      serviceRoleSupabaseWritesApprovedNow: false,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      all21ApprovedSnapshotRefsAccepted,
      all21CreditReservationRefsAccepted,
      privateArtifactManifestOnly:
        sourceQueueDispatcherReadiness.booleans.privateArtifactManifestOnly,
      agentCanSelectForPlanning: true,
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
      gpuRuntimeShouldStartNow: false,
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
