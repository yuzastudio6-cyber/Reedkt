import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'
import {
  buildAiGraphicsInternalBetaServiceRoleRpcSmokeReadiness,
  buildAiGraphicsServiceRoleRpcSmokeJobs,
} from '../tool-registry/ai-graphics-internal-beta-service-role-rpc-smoke-readiness'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function requiredFlag(flag: string): string {
  const value = valueAfterFlag(flag)
  if (!value?.trim()) throw new Error(`Missing required flag ${flag}`)
  return value.trim()
}

function assertLiveSmokeAllowed(): void {
  if (process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE !== 'true') {
    throw new Error('Set REEDITPRO_CONFIRM_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE=true to run the live non-production RPC smoke.')
  }

  const smokeEnv =
    valueAfterFlag('--smoke-env') ??
    process.env.REEDITPRO_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE_ENV
  if (smokeEnv !== 'local' && smokeEnv !== 'staging') {
    throw new Error('Live RPC smoke requires --smoke-env local|staging or REEDITPRO_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE_ENV=local|staging.')
  }

  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('AI graphics service-role RPC smoke is blocked in production.')
  }
}

async function runLiveSmoke() {
  assertLiveSmokeAllowed()

  const workspaceId = requiredFlag('--workspace-id')
  const projectId = requiredFlag('--project-id')
  const approvedPlanSnapshotId = requiredFlag('--approved-plan-snapshot-id')
  const creditReservationId = requiredFlag('--credit-reservation-id')
  const idempotencyKey =
    valueAfterFlag('--idempotency-key') ??
    `ai_graphics_service_role_rpc_smoke:${Date.now()}`
  const workerInstanceId =
    valueAfterFlag('--worker-instance-id') ??
    process.env.WORKER_INSTANCE_ID ??
    'ai-graphics-rpc-smoke-worker'

  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: process.env.NODE_ENV === 'production' ? 'test' : process.env.NODE_ENV,
    E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
    WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'false',
  })
  const admin = createSupabaseAdminClient(env)
  if (!admin || env.mockOnly) {
    throw new Error('Supabase admin client is unavailable; live RPC smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  const context: ServiceContext = {
    env,
    clients: { admin, public: null },
    requestId: 'ai-graphics-service-role-rpc-live-smoke',
    auth: { userId: 'ai-graphics-rpc-smoke', isMockUser: true },
  }
  const service = createAiGraphicsToolRuntimeQueueService(context)
  const jobs = buildAiGraphicsServiceRoleRpcSmokeJobs()

  const enqueue = await service.enqueueToolRuntimeJobs({
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    jobs,
    idempotencyKey,
    batchName: 'AI graphics service-role RPC smoke',
    createdByAgent: 'ai_graphics_service_role_rpc_smoke',
  })
  const queueResult = enqueue.queueResult as {
    jobBatchId?: string
    jobIds?: unknown[]
    insertedJobCount?: number
    idempotentReplay?: boolean
  }
  const firstJobId = Array.isArray(queueResult.jobIds) ? String(queueResult.jobIds[0] ?? '') : ''
  if (!firstJobId) throw new Error('enqueue_ai_graphics_tool_runtime_jobs did not return a claimable job ID.')

  const claim = await service.claimToolRuntimeJob({
    jobId: firstJobId,
    workerType: jobs[0].workerType,
    workerInstanceId,
    idempotencyKey: `${idempotencyKey}:claim:first`,
    leaseSeconds: 60,
  })
  const workerEvent = await service.recordWorkerEvent({
    jobId: firstJobId,
    eventType: 'ai_graphics_rpc_smoke_probe',
    message: 'RPC smoke probe recorded metadata only.',
    payload: { smokeOnly: true, toolExecutionPerformed: false },
    progressPercent: 0,
  })
  const auditEvent = await service.recordAuditEvent({
    workspaceId,
    projectId,
    eventType: 'ai_graphics_rpc_smoke_probe',
    eventJson: { smokeOnly: true, toolExecutionPerformed: false },
  })

  return {
    ok: true,
    mode: 'live_non_production_rpc_smoke',
    smokeEnv: valueAfterFlag('--smoke-env') ?? process.env.REEDITPRO_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE_ENV,
    toolsCovered: jobs.length,
    serviceRoleRpcsExercised: [
      'enqueue_ai_graphics_tool_runtime_jobs',
      'claim_ai_graphics_tool_runtime_job',
      'record_ai_graphics_worker_event',
      'record_ai_graphics_audit_event',
    ],
    jobBatchIdReturned: Boolean(queueResult.jobBatchId),
    jobIdsReturned: Array.isArray(queueResult.jobIds) ? queueResult.jobIds.length : 0,
    insertedJobCount: queueResult.insertedJobCount ?? null,
    idempotentReplay: queueResult.idempotentReplay === true,
    workerClaimReturned: Boolean((claim.claimResult as { workerClaimId?: string }).workerClaimId),
    workerEventReturned: Boolean((workerEvent.eventResult as { jobEventId?: string }).jobEventId),
    auditEventReturned: Boolean((auditEvent.auditResult as { auditEventId?: string }).auditEventId),
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

async function main() {
  if (hasFlag('--execute-live-smoke')) {
    console.log(JSON.stringify(await runLiveSmoke(), null, 2))
    return
  }

  const readiness = await buildAiGraphicsInternalBetaServiceRoleRpcSmokeReadiness()
  console.log(JSON.stringify({
    ...readiness,
    input: {
      validatorOnly: true,
      executeLiveSmoke: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }, null, 2))

  if (
    hasFlag('--require-live-smoke') ||
    hasFlag('--require-runtime-ready') ||
    hasFlag('--require-production-ready')
  ) {
    process.exitCode = 3
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
