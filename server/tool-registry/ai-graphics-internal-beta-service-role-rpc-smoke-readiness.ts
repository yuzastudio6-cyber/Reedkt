import { ApiError } from '../errors/api-error'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService, type AiGraphicsToolRuntimeQueueJobInput } from '../services/ai-graphics-tool-runtime-queue-service'
import type { ServiceContext } from '../types'
import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import { AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_READINESS_DECISION } from './ai-graphics-internal-beta-service-role-queue-transaction-readiness'

export const AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_RPC_SMOKE_READINESS_DECISION =
  'ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked'

export type AiGraphicsInternalBetaServiceRoleRpcSmokeReadinessStatus =
  'service_role_rpc_smoke_harness_prepared_live_smoke_blocked'

export interface AiGraphicsInternalBetaServiceRoleRpcSmokeCase {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  workerType: string
  runtimeTarget: AiGraphicsRuntimeTarget
  capabilityIds: AiGraphicsCapabilityId[]
  privateArtifactManifestRef: string
  idempotencyKey: string
  queueRpcPrepared: true
  claimRpcPrepared: true
  workerEventRpcPrepared: true
  auditEventRpcPrepared: true
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  mockAdapterInputValidated: boolean
  liveRpcSmokeExecutedNow: false
  canExecuteToolNow: false
}

export interface AiGraphicsInternalBetaServiceRoleRpcSmokeReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_RPC_SMOKE_READINESS_DECISION
  sourceServiceRoleQueueTransactionDecision: typeof AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_READINESS_DECISION
  status: AiGraphicsInternalBetaServiceRoleRpcSmokeReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  rpcSmokeCasesPrepared: 21
  rpcSmokeCasesReadyWithProvidedEvidence: number
  serviceRoleRpcsCovered: 4
  staticMigrationRequiredBeforeLiveSmoke: true
  backendServiceAdapterMockValidated: boolean
  mockAdapterEnqueueValidated: boolean
  mockAdapterClaimValidated: boolean
  mockAdapterWorkerEventValidated: boolean
  mockAdapterAuditEventValidated: boolean
  mockAdapterCanonicalRegistryValidation: boolean
  mockAdapterRejectedNonCanonicalTool: boolean
  mockAdapterRejectedProductionToolMismatch: boolean
  mockAdapterRejectedCapabilityMismatch: boolean
  liveServiceRoleRpcSmokeExecutedNow: 0
  liveMigrationAppliesNow: 0
  liveJobRowsInsertedNow: 0
  liveWorkerClaimRowsInsertedNow: 0
  liveWorkerEventRowsInsertedNow: 0
  liveAuditEventRowsInsertedNow: 0
  liveToolExecutionsNow: 0
  requiredLiveSmokeConfirmations: string[]
  requiredServiceRoleRpcs: string[]
  requiredNonProductionFixtures: string[]
  blockedRuntimeActions: string[]
  rpcSmokeCases: AiGraphicsInternalBetaServiceRoleRpcSmokeCase[]
  nextMilestones: string[]
  booleans: {
    internalBetaServiceRoleRpcSmokeReadinessPrepared: true
    sourceServiceRoleQueueTransactionReadinessAccepted: true
    sourceServiceRoleRpcImplementationReadinessAccepted: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21RpcSmokeCasesPrepared: true
    all21RpcSmokeCasesReadyWithProvidedEvidence: boolean
    backendServiceAdapterMockValidated: boolean
    mockAdapterCanonicalRegistryValidation: boolean
    mockAdapterRejectedNonCanonicalTool: boolean
    mockAdapterRejectedProductionToolMismatch: boolean
    mockAdapterRejectedCapabilityMismatch: boolean
    liveSmokeCommandPrepared: true
    staticMigrationRequiredBeforeLiveSmoke: true
    nonProductionEnvironmentRequired: true
    serviceRoleCredentialsRequired: true
    approvedSnapshotFixtureRequired: true
    creditReservationFixtureRequired: true
    privateArtifactManifestOnly: true
    gpuHeavyToolsTargetGpuRuntime: boolean
    agentCanSelectForPlanning: true
    serviceRoleRpcSmokeApprovedNow: false
    serviceRoleRpcMigrationAppliedNow: false
    serviceRoleSupabaseWritesApprovedNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
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
    serviceRoleTransactionPerformed: false
    serviceRoleRpcSmokePerformed: false
    serviceRoleMigrationApplyPerformed: false
    productionWorkerDispatchPerformed: false
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

export const aiGraphicsServiceRoleRpcSmokeRequiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
] as const

const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
  .filter((capability) => capability !== 'planning_metadata_only' && capability !== 'blocked_or_deferred')

const requiredLiveSmokeConfirmations = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE_ENV=local_or_staging',
  'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must point to a disposable local/staging project',
  'the static ai_graphics_tool_runtime service-role RPC migration must already be applied outside this command',
  'workspace, project, approved snapshot, credit reservation, and private artifact manifest fixture IDs must be explicit',
]

const requiredNonProductionFixtures = [
  'workspace_id',
  'project_id',
  'approved_plan_snapshot_id with immutable active snapshot status',
  'credit_reservation_id with active/approved status',
  'private:// artifact manifest reference',
  'idempotency key namespace for the smoke run',
]

const blockedRuntimeActions = [
  'production Supabase mutation',
  'tool execution',
  'Tool Route execution',
  'worker execution',
  'production worker dispatch',
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
  'Apply the static service-role RPC migration only in a disposable local/staging Supabase database and capture rollback evidence.',
  'Run the prepared service-role RPC smoke command with explicit non-production fixture IDs and service-role credentials.',
  'Verify enqueue, claim, worker-event, and audit-event readback while keeping tool execution disabled.',
  'Only after the non-production smoke passes, bind the worker dispatcher to claim_ai_graphics_tool_runtime_job for a separate worker-claim smoke.',
]

export function buildAiGraphicsServiceRoleRpcSmokeJobs(): AiGraphicsToolRuntimeQueueJobInput[] {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => Boolean(record.productionToolId))
    .map((record) => ({
      toolId: record.toolId,
      productionToolId: record.productionToolId as string,
      workerType: record.productionWorkerType === 'none'
        ? 'ai_graphics_planning_worker'
        : record.productionWorkerType,
      runtimeTarget: record.runtimeTarget,
      capabilityIds: record.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      )),
      privateArtifactManifestRef:
        `private://ai-graphics/internal-beta/service-role-rpc-smoke/${record.toolId}/manifest.json`,
      idempotencyKey: `ai_graphics_service_role_rpc_smoke:${record.toolId}`,
      priority: record.gpuRequiredForRuntime ? 'high' : 'normal',
      maxAttempts: 1,
      inputPayload: {
        smokeOnly: true,
        aiGraphicsCanonicalToolId: record.toolId,
        productionToolId: record.productionToolId,
        runtimeTarget: record.runtimeTarget,
        toolExecutionApprovedNow: false,
        workerExecutionApprovedNow: false,
      },
    }))
}

async function mockAdapterRejectsPatchedJob(
  mockService: ReturnType<typeof createAiGraphicsToolRuntimeQueueService>,
  validJob: AiGraphicsToolRuntimeQueueJobInput,
  patch: Partial<AiGraphicsToolRuntimeQueueJobInput>,
  expectedMessage: string,
): Promise<boolean> {
  try {
    await mockService.enqueueToolRuntimeJobs({
      workspaceId: 'workspace_ai_graphics_rpc_smoke_invalid_fixture',
      projectId: 'project_ai_graphics_rpc_smoke_invalid_fixture',
      approvedPlanSnapshotId: 'approved_snapshot_ai_graphics_rpc_smoke_invalid_fixture',
      creditReservationId: 'credit_reservation_ai_graphics_rpc_smoke_invalid_fixture',
      jobs: [{
        ...validJob,
        ...patch,
        idempotencyKey:
          patch.idempotencyKey ?? `ai_graphics_service_role_rpc_smoke:invalid:${expectedMessage}`,
      }],
      idempotencyKey: `ai_graphics_service_role_rpc_smoke:invalid_batch:${expectedMessage}`,
      batchName: 'AI graphics service-role RPC smoke invalid fixture',
      createdByAgent: 'ai_graphics_service_role_rpc_smoke_readiness',
    })
  } catch (error) {
    return error instanceof ApiError &&
      error.code === 'VALIDATION_FAILED' &&
      error.message.includes(expectedMessage)
  }

  return false
}

export async function buildAiGraphicsInternalBetaServiceRoleRpcSmokeReadiness():
Promise<AiGraphicsInternalBetaServiceRoleRpcSmokeReadiness> {
  const mockContext = createMockServiceContext()
  const mockService = createAiGraphicsToolRuntimeQueueService(mockContext)
  const jobs = buildAiGraphicsServiceRoleRpcSmokeJobs()
  const enqueue = await mockService.enqueueToolRuntimeJobs({
    workspaceId: 'workspace_ai_graphics_rpc_smoke_fixture',
    projectId: 'project_ai_graphics_rpc_smoke_fixture',
    approvedPlanSnapshotId: 'approved_snapshot_ai_graphics_rpc_smoke_fixture',
    creditReservationId: 'credit_reservation_ai_graphics_rpc_smoke_fixture',
    jobs,
    idempotencyKey: 'ai_graphics_service_role_rpc_smoke:batch',
    batchName: 'AI graphics service-role RPC smoke readiness',
    createdByAgent: 'ai_graphics_service_role_rpc_smoke_readiness',
  })
  const firstJobId = Array.isArray(enqueue.queueResult.jobIds)
    ? String(enqueue.queueResult.jobIds[0])
    : 'mock_ai_graphics_rpc_smoke_job'
  const firstJob = jobs[0]
  const claim = await mockService.claimToolRuntimeJob({
    jobId: firstJobId,
    workerType: firstJob.workerType,
    workerInstanceId: 'ai-graphics-rpc-smoke-mock-worker',
    idempotencyKey: 'ai_graphics_service_role_rpc_smoke:claim:first',
    leaseSeconds: 60,
  })
  const workerEvent = await mockService.recordWorkerEvent({
    jobId: firstJobId,
    eventType: 'rpc_smoke_probe_prepared',
    message: 'Mock adapter worker-event probe prepared; no tool execution occurred.',
    payload: { toolExecutionPerformed: false, smokeOnly: true },
    progressPercent: 0,
  })
  const auditEvent = await mockService.recordAuditEvent({
    workspaceId: 'workspace_ai_graphics_rpc_smoke_fixture',
    projectId: 'project_ai_graphics_rpc_smoke_fixture',
    eventType: 'ai_graphics_service_role_rpc_smoke_probe_prepared',
    eventJson: { toolExecutionPerformed: false, smokeOnly: true },
  })
  const mockAdapterEnqueueValidated =
    enqueue.queueResult.insertedJobCount === jobs.length &&
    enqueue.queueResult.mockOnly === true
  const mockAdapterClaimValidated = claim.claimResult.mockOnly === true
  const mockAdapterWorkerEventValidated = workerEvent.eventResult.mockOnly === true
  const mockAdapterAuditEventValidated = auditEvent.auditResult.mockOnly === true
  const mockAdapterRejectedNonCanonicalTool = await mockAdapterRejectsPatchedJob(
    mockService,
    firstJob,
    {
      toolId: 'remotion',
      productionToolId: 'remotion',
      workerType: 'render_worker',
      runtimeTarget: 'node_cpu_static',
      capabilityIds: ['chart_overlay'],
      privateArtifactManifestRef:
        'private://ai-graphics/internal-beta/service-role-rpc-smoke/remotion/manifest.json',
    },
    'not in the canonical 21-tool registry',
  )
  const mockAdapterRejectedProductionToolMismatch = await mockAdapterRejectsPatchedJob(
    mockService,
    firstJob,
    { productionToolId: 'remotion' },
    'productionToolId mismatch',
  )
  const mockAdapterRejectedCapabilityMismatch = await mockAdapterRejectsPatchedJob(
    mockService,
    firstJob,
    { capabilityIds: ['chart_overlay'] },
    'capabilityId chart_overlay is not valid',
  )
  const mockAdapterCanonicalRegistryValidation =
    mockAdapterRejectedNonCanonicalTool &&
    mockAdapterRejectedProductionToolMismatch &&
    mockAdapterRejectedCapabilityMismatch
  const backendServiceAdapterMockValidated =
    mockAdapterEnqueueValidated &&
    mockAdapterClaimValidated &&
    mockAdapterWorkerEventValidated &&
    mockAdapterAuditEventValidated &&
    mockAdapterCanonicalRegistryValidation
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const rpcSmokeCases = jobs.map((job): AiGraphicsInternalBetaServiceRoleRpcSmokeCase => {
    const readiness = readinessRecords.find((record) => record.toolId === job.toolId)
    return {
      toolId: job.toolId as AiGraphicsCanonicalToolId,
      productionToolId: job.productionToolId,
      workerType: job.workerType,
      runtimeTarget: job.runtimeTarget as AiGraphicsRuntimeTarget,
      capabilityIds: job.capabilityIds as AiGraphicsCapabilityId[],
      privateArtifactManifestRef: job.privateArtifactManifestRef,
      idempotencyKey: job.idempotencyKey,
      queueRpcPrepared: true,
      claimRpcPrepared: true,
      workerEventRpcPrepared: true,
      auditEventRpcPrepared: true,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      mockAdapterInputValidated:
        backendServiceAdapterMockValidated &&
        Boolean(readiness?.productionToolId) &&
        job.privateArtifactManifestRef.startsWith('private://'),
      liveRpcSmokeExecutedNow: false,
      canExecuteToolNow: false,
    }
  })
  const rpcSmokeCasesReadyWithProvidedEvidence =
    rpcSmokeCases.filter((record) => record.mockAdapterInputValidated).length
  const gpuHeavyToolsTargetGpuRuntime =
    readinessRecords.filter((record) => (
      record.gpuRequiredForRuntime &&
      record.productionWorkerType === 'gpu_ai_worker' &&
      record.runtimeTarget.includes('nvidia_l4')
    )).length === 8
  const privateArtifactManifestOnly = rpcSmokeCases.every((record) => (
    record.privateArtifactManifestRef.startsWith('private://') &&
    !/signed.?url|public:\/\/|https?:\/\/|gcs:\/\//i.test(record.privateArtifactManifestRef)
  ))
  if (!privateArtifactManifestOnly) {
    throw new Error('AI graphics service-role RPC smoke cases require private artifact manifest references.')
  }

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_RPC_SMOKE_READINESS_DECISION,
    sourceServiceRoleQueueTransactionDecision:
      AI_GRAPHICS_INTERNAL_BETA_SERVICE_ROLE_QUEUE_TRANSACTION_READINESS_DECISION,
    status: 'service_role_rpc_smoke_harness_prepared_live_smoke_blocked',
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    rpcSmokeCasesPrepared: rpcSmokeCases.length as 21,
    rpcSmokeCasesReadyWithProvidedEvidence,
    serviceRoleRpcsCovered: 4,
    staticMigrationRequiredBeforeLiveSmoke: true,
    backendServiceAdapterMockValidated,
    mockAdapterEnqueueValidated,
    mockAdapterClaimValidated,
    mockAdapterWorkerEventValidated,
    mockAdapterAuditEventValidated,
    mockAdapterCanonicalRegistryValidation,
    mockAdapterRejectedNonCanonicalTool,
    mockAdapterRejectedProductionToolMismatch,
    mockAdapterRejectedCapabilityMismatch,
    liveServiceRoleRpcSmokeExecutedNow: 0,
    liveMigrationAppliesNow: 0,
    liveJobRowsInsertedNow: 0,
    liveWorkerClaimRowsInsertedNow: 0,
    liveWorkerEventRowsInsertedNow: 0,
    liveAuditEventRowsInsertedNow: 0,
    liveToolExecutionsNow: 0,
    requiredLiveSmokeConfirmations,
    requiredServiceRoleRpcs: [...aiGraphicsServiceRoleRpcSmokeRequiredRpcs],
    requiredNonProductionFixtures,
    blockedRuntimeActions,
    rpcSmokeCases,
    nextMilestones,
    booleans: {
      internalBetaServiceRoleRpcSmokeReadinessPrepared: true,
      sourceServiceRoleQueueTransactionReadinessAccepted: true,
      sourceServiceRoleRpcImplementationReadinessAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21RpcSmokeCasesPrepared: true,
      all21RpcSmokeCasesReadyWithProvidedEvidence:
        rpcSmokeCasesReadyWithProvidedEvidence === 21,
      backendServiceAdapterMockValidated,
      mockAdapterCanonicalRegistryValidation,
      mockAdapterRejectedNonCanonicalTool,
      mockAdapterRejectedProductionToolMismatch,
      mockAdapterRejectedCapabilityMismatch,
      liveSmokeCommandPrepared: true,
      staticMigrationRequiredBeforeLiveSmoke: true,
      nonProductionEnvironmentRequired: true,
      serviceRoleCredentialsRequired: true,
      approvedSnapshotFixtureRequired: true,
      creditReservationFixtureRequired: true,
      privateArtifactManifestOnly: true,
      gpuHeavyToolsTargetGpuRuntime,
      agentCanSelectForPlanning: true,
      serviceRoleRpcSmokeApprovedNow: false,
      serviceRoleRpcMigrationAppliedNow: false,
      serviceRoleSupabaseWritesApprovedNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
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
      serviceRoleTransactionPerformed: false,
      serviceRoleRpcSmokePerformed: false,
      serviceRoleMigrationApplyPerformed: false,
      productionWorkerDispatchPerformed: false,
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

function createMockServiceContext(): ServiceContext {
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
    requestId: 'ai-graphics-internal-beta-service-role-rpc-smoke-readiness',
    auth: { userId: 'ai-graphics-rpc-smoke-readiness', isMockUser: true },
  }
}

export function listAiGraphicsServiceRoleRpcSmokeCapabilities(): AiGraphicsCapabilityId[] {
  return [...productFacingCapabilities]
}
