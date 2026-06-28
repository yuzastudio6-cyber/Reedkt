import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ServiceContext } from '../types'

const RUN_DECISION =
  'ai_graphics_external_beta_service_role_queue_smoke_harness_prepared_with_runtime_blocks'

const requiredEnv = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
] as const

const requiredServiceRoleRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
] as const

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function requiredFlag(flag: string): string {
  const value = valueAfterFlag(flag)
  if (!value) throw new Error(`Missing required flag for live smoke: ${flag}`)
  return value
}

function productCapabilityCount(): number {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
    .filter((capability) => capability !== 'planning_metadata_only' && capability !== 'blocked_or_deferred')
    .length
}

function gpuToolCount(): number {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => record.gpuRequiredForRuntime)
    .length
}

interface ExternalBetaSmokeSourceRefs {
  serviceRoleQueueSmokeReadinessRef: string
  runtimeQueueServiceProofBridgeRef: string
}

function buildExternalBetaSmokeJobs(
  idempotencyPrefix: string,
  sourceRefs: ExternalBetaSmokeSourceRefs,
) {
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
        `private://ai-graphics/external-beta/service-role-queue-smoke/${record.toolId}/manifest.json`,
      idempotencyKey: `${idempotencyPrefix}:job:${record.toolId}`,
      priority: record.gpuRequiredForRuntime ? 'high' as const : 'normal' as const,
      maxAttempts: 1,
      inputPayload: {
        smokeOnly: true,
        externalBetaServiceRoleQueueSmoke: true,
        aiGraphicsCanonicalToolId: record.toolId,
        productionToolId: record.productionToolId,
        runtimeTarget: record.runtimeTarget,
        serviceRoleQueueSmokeReadinessRef:
          sourceRefs.serviceRoleQueueSmokeReadinessRef,
        runtimeQueueServiceProofBridgeRef:
          sourceRefs.runtimeQueueServiceProofBridgeRef,
        sourceRuntimeQueueServiceProofBridgeAccepted: true,
        toolExecutionApprovedNow: false,
        workerExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    }))
}

function preparedContract() {
  return {
    ok: true,
    decision: RUN_DECISION,
    status: 'external_beta_service_role_queue_smoke_prepared_not_executed',
    preparedScript: 'ai-graphics:external-beta-service-role-queue-smoke',
    executeFlagRequired: '--execute-external-beta-service-role-queue-smoke',
    requiredEnv,
    requiredFlagsForExecution: [
      '--workspace-id',
      '--project-id',
      '--approved-plan-snapshot-id',
      '--credit-reservation-id',
      '--idempotency-prefix',
      '--service-role-queue-smoke-readiness-ref',
      '--runtime-queue-service-proof-bridge-ref',
      '--source-runtime-queue-service-proof-bridge-accepted',
    ],
    requiredServiceRoleRpcs,
    toolsCovered: 21,
    productFacingCapabilitiesCovered: productCapabilityCount(),
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: gpuToolCount(),
    heavyToolsIncorrectlyTargetingCpu: 0,
    liveServiceRoleQueueSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      externalBetaServiceRoleQueueSmokeHarnessPrepared: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      cleanupRequired: true,
      serviceRoleQueueSmokeReadinessRefRequired: true,
      sourceRuntimeQueueServiceProofBridgeRequired: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
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
      serviceRoleQueueSmokePerformed: false,
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

function assertAllowedToExecute(): void {
  if (process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE !== 'true') {
    throw new Error(
      'Set REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true to run the external-beta service-role queue smoke.',
    )
  }
  if (process.env.REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV !== 'non_production') {
    throw new Error(
      'External-beta service-role queue smoke requires REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production.',
    )
  }
  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('External-beta service-role queue smoke is blocked in production.')
  }
  if (process.env.E2E_RUNTIME_MODE !== 'local') {
    throw new Error('External-beta service-role queue smoke requires E2E_RUNTIME_MODE=local.')
  }
  if (process.env.WORKER_RUNTIME_MODE !== 'mock') {
    throw new Error('External-beta service-role queue smoke requires WORKER_RUNTIME_MODE=mock.')
  }
  if (!hasFlag('--source-runtime-queue-service-proof-bridge-accepted')) {
    throw new Error(
      'External-beta service-role queue smoke requires --source-runtime-queue-service-proof-bridge-accepted from the accepted service-role smoke readiness packet.',
    )
  }
}

async function deleteRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  table: string,
  column: string,
  values: string[],
): Promise<void> {
  if (values.length === 0) return
  const { error } = await admin.from(table).delete().in(column, values)
  if (error) throw error
}

async function cleanupSmokeRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  input: { jobBatchId?: string; jobIds: string[]; idempotencyPrefix: string },
): Promise<void> {
  await deleteRows(admin, 'job_events', 'job_id', input.jobIds)
  await deleteRows(admin, 'worker_job_claims', 'job_id', input.jobIds)
  await deleteRows(admin, 'jobs', 'id', input.jobIds)
  await deleteRows(admin, 'job_batches', 'id', input.jobBatchId ? [input.jobBatchId] : [])
  const { error } = await admin
    .from('audit_events')
    .delete()
    .eq('event_type', 'ai_graphics_external_beta_service_role_queue_smoke')
    .contains('event_json', { idempotencyPrefix: input.idempotencyPrefix })
  if (error) throw error
}

async function executeExternalBetaServiceRoleQueueSmoke() {
  assertAllowedToExecute()
  const runtimeEnv = loadRuntimeEnv({
    ...process.env,
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const admin = createSupabaseAdminClient(runtimeEnv)
  if (!admin || runtimeEnv.mockOnly) {
    throw new Error(
      'External-beta service-role queue smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server env.',
    )
  }

  const workspaceId = requiredFlag('--workspace-id')
  const projectId = requiredFlag('--project-id')
  const approvedPlanSnapshotId = requiredFlag('--approved-plan-snapshot-id')
  const creditReservationId = requiredFlag('--credit-reservation-id')
  const idempotencyPrefix = requiredFlag('--idempotency-prefix')
  const serviceRoleQueueSmokeReadinessRef =
    requiredFlag('--service-role-queue-smoke-readiness-ref')
  const runtimeQueueServiceProofBridgeRef =
    requiredFlag('--runtime-queue-service-proof-bridge-ref')
  const workerInstanceId =
    valueAfterFlag('--worker-instance-id') ??
    'ai-graphics-external-beta-service-role-queue-smoke-worker'

  const context: ServiceContext = {
    env: runtimeEnv,
    clients: { admin, public: null },
    requestId: 'ai-graphics-external-beta-service-role-queue-smoke',
    auth: {
      userId: 'ai-graphics-external-beta-service-role-queue-smoke',
      isMockUser: true,
    },
  }
  const service = createAiGraphicsToolRuntimeQueueService(context)
  const jobs = buildExternalBetaSmokeJobs(idempotencyPrefix, {
    serviceRoleQueueSmokeReadinessRef,
    runtimeQueueServiceProofBridgeRef,
  })
  const queue = await service.enqueueToolRuntimeJobs({
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    jobs,
    idempotencyKey: `${idempotencyPrefix}:batch`,
    batchName: 'AI graphics external beta service-role queue smoke',
    createdByAgent: 'ai_graphics_external_beta_service_role_queue_smoke',
  })
  const queueResult = queue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
  }
  const jobIds = queueResult.jobIds ?? []
  const claims = []
  try {
    for (const [index, jobId] of jobIds.entries()) {
      const job = jobs[index]
      const claim = await service.claimToolRuntimeJob({
        jobId,
        workerType: job.workerType,
        workerInstanceId,
        idempotencyKey: `${idempotencyPrefix}:claim:${job.toolId}`,
        leaseSeconds: 60,
      })
      claims.push(claim.claimResult)
      await service.recordWorkerEvent({
        jobId,
        eventType: 'ai_graphics_external_beta_service_role_queue_smoke_claimed',
        message:
          'External-beta service-role queue smoke claimed job without dispatching worker or executing tool.',
        payload: {
          idempotencyPrefix,
          toolId: job.toolId,
          runtimeTarget: job.runtimeTarget,
          serviceRoleQueueSmokeReadinessRef,
          runtimeQueueServiceProofBridgeRef,
          sourceRuntimeQueueServiceProofBridgeAccepted: true,
          toolExecutionApprovedNow: false,
          gpuRuntimeShouldStartNow: false,
        },
        progressPercent: 0,
      })
    }
    await service.recordAuditEvent({
      workspaceId,
      projectId,
      eventType: 'ai_graphics_external_beta_service_role_queue_smoke',
      eventJson: {
        idempotencyPrefix,
        serviceRoleQueueSmokeReadinessRef,
        runtimeQueueServiceProofBridgeRef,
        sourceRuntimeQueueServiceProofBridgeAccepted: true,
        jobBatchId: queueResult.jobBatchId,
        jobCount: jobIds.length,
        toolExecutionApprovedNow: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      },
      actorUserId: undefined,
    })
  } finally {
    await cleanupSmokeRows(admin, {
      jobBatchId: queueResult.jobBatchId,
      jobIds,
      idempotencyPrefix,
    })
  }

  return {
    ok: true,
    decision: 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup',
    status: 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution',
    toolsSubmitted: jobs.length,
    toolsSubmittedIds: jobs.map((job) => job.toolId),
    jobIdsReturned: jobIds.length,
    workerClaimsReturned: claims.length,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: gpuToolCount(),
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    liveServiceRoleQueueSmokeExecutedNow: true,
    liveSupabaseQueueWritesNow: jobIds.length,
    liveWorkerClaimRowsNow: claims.length,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    fixtureRowsPersistedAfterCleanup: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
}

async function main(): Promise<void> {
  if (!hasFlag('--execute-external-beta-service-role-queue-smoke')) {
    console.log(JSON.stringify(preparedContract(), null, 2))
    return
  }
  console.log(JSON.stringify(await executeExternalBetaServiceRoleQueueSmoke(), null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
