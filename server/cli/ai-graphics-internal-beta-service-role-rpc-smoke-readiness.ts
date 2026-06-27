import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'
import type {
  AiGraphicsInternalBetaServiceRoleQueueTransactionReadiness,
} from '../tool-registry/ai-graphics-internal-beta-service-role-queue-transaction-readiness'
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

function readJsonPath(filePath: string): unknown {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function readJsonObjectFile(filePath: string): Record<string, unknown> {
  const packet = readJsonPath(filePath)
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    throw new Error(`Evidence packet must be a JSON object: ${filePath}`)
  }

  return packet as Record<string, unknown>
}

function isServiceRoleQueueTransactionReadinessPacket(
  packet: unknown,
): packet is AiGraphicsInternalBetaServiceRoleQueueTransactionReadiness {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false
  const record = packet as Record<string, unknown>
  const booleans = record.booleans
  return (
    record.decision ===
      'ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope' &&
    record.status === 'service_role_queue_transaction_envelope_prepared_live_writes_blocked' &&
    Array.isArray(record.serviceRoleTransactionRecords) &&
    record.serviceRoleTransactionRecords.length === 21 &&
    Boolean(
      booleans &&
      typeof booleans === 'object' &&
      !Array.isArray(booleans) &&
      (booleans as Record<string, unknown>).all21ServiceRoleTransactionRecordsReadyWithProvidedEvidence === true,
    )
  )
}

const falseGateKeys = [
  'serviceRoleQueueTransactionApprovedNow',
  'serviceRoleSupabaseWritesApprovedNow',
  'liveJobBatchInsertApprovedNow',
  'liveJobInsertApprovedNow',
  'liveWorkerClaimInsertApprovedNow',
  'liveWorkerEventInsertApprovedNow',
  'liveAuditEventInsertApprovedNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'workerLeaseCreationApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'supabaseMutationPerformed',
  'serviceRoleTransactionPerformed',
  'workerLeaseCreated',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
] as const

function assertBooleanField(
  object: Record<string, unknown>,
  key: string,
  expected: boolean,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(
      `${flag} must have ${key}=${String(expected)}; received ${String(object[key])}`,
    )
  }
}

function assertNumberField(
  object: Record<string, unknown>,
  key: string,
  expected: number,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(`${flag} must have ${key}=${expected}; received ${String(object[key])}`)
  }
}

function validateServiceRoleQueueTransactionReadinessPacket(
  packet: AiGraphicsInternalBetaServiceRoleQueueTransactionReadiness,
  flag: string,
): void {
  const packetRecord = packet as unknown as Record<string, unknown>
  const booleans = packetRecord.booleans
  if (typeof booleans !== 'object' || booleans === null || Array.isArray(booleans)) {
    throw new Error(`${flag} must contain a booleans object`)
  }
  const booleanRecord = booleans as Record<string, unknown>

  assertNumberField(packetRecord, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(packetRecord, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(packetRecord, 'serviceRoleTransactionRecordsPrepared', 21, flag)
  assertNumberField(packetRecord, 'serviceRoleTransactionRecordsReadyWithProvidedEvidence', 21, flag)
  assertNumberField(packetRecord, 'serviceRoleCapabilityScenariosReadyWithProvidedEvidence', 12, flag)
  assertNumberField(packetRecord, 'serviceRoleJobRowsPrepared', 21, flag)
  assertNumberField(packetRecord, 'serviceRoleWorkerClaimTransactionInputsPrepared', 21, flag)
  assertNumberField(packetRecord, 'serviceRoleWorkerEventRowsPrepared', 42, flag)
  assertNumberField(packetRecord, 'serviceRoleAuditEventRowsPrepared', 21, flag)
  assertNumberField(packetRecord, 'liveServiceRoleTransactionsNow', 0, flag)
  assertNumberField(packetRecord, 'liveWorkerDispatchesNow', 0, flag)
  assertNumberField(packetRecord, 'liveToolExecutionsNow', 0, flag)

  for (const [key, expected] of Object.entries({
    internalBetaServiceRoleQueueTransactionReadinessPrepared: true,
    sourceBackendQueueStorageAccepted: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21ServiceRoleTransactionRecordsPrepared: true,
    all21ServiceRoleTransactionRecordsReadyWithProvidedEvidence: true,
    all12CapabilityTransactionScenariosReadyWithProvidedEvidence: true,
    serviceRoleRpcContractPrepared: true,
    serviceRoleTransactionRollbackPlanPrepared: true,
    all21IdempotencyKeysPrepared: true,
    all21ApprovedSnapshotRefsAccepted: true,
    all21CreditReservationRefsAccepted: true,
    all21ApprovedSnapshotCreditBindingsReady: true,
    privateArtifactManifestOnly: true,
    gpuHeavyToolsTargetGpuRuntime: true,
    agentCanSelectForPlanning: true,
  })) {
    assertBooleanField(booleanRecord, key, expected, flag)
  }
  for (const key of falseGateKeys) {
    assertBooleanField(booleanRecord, key, false, flag)
  }

  if (
    !Array.isArray(packet.serviceRoleTransactionRecords) ||
    packet.serviceRoleTransactionRecords.length !== 21
  ) {
    throw new Error(`${flag} must contain exactly 21 serviceRoleTransactionRecords`)
  }
  const gpuRecords = packet.serviceRoleTransactionRecords.filter((record) => (
    record.workerType === 'gpu_ai_worker'
  ))
  if (gpuRecords.length !== 8) {
    throw new Error(`${flag} must contain exactly 8 GPU worker transaction records`)
  }
  for (const record of packet.serviceRoleTransactionRecords) {
    if (record.serviceRoleTransactionEnvelopeReadyWithProvidedEvidence !== true) {
      throw new Error(`${flag} tool ${record.toolId} must have transaction envelope evidence`)
    }
    if (record.canRunServiceRoleTransactionNow !== false) {
      throw new Error(`${flag} tool ${record.toolId} must have canRunServiceRoleTransactionNow=false`)
    }
    if (record.canDispatchWorkerNow !== false) {
      throw new Error(`${flag} tool ${record.toolId} must have canDispatchWorkerNow=false`)
    }
    if (record.canExecuteToolNow !== false) {
      throw new Error(`${flag} tool ${record.toolId} must have canExecuteToolNow=false`)
    }
  }
}

function readSourceServiceRoleQueueTransactionReadinessPacket(): {
  sourceServiceRoleQueueTransactionReadinessPacket?: AiGraphicsInternalBetaServiceRoleQueueTransactionReadiness
  sourceEvidenceMode:
    | 'constructed_from_committed_readiness_docs'
    | 'internal_beta_service_role_queue_transaction_readiness_packet'
} {
  const filePath = valueAfterFlag('--internal-beta-service-role-queue-transaction-readiness-packet')
  if (!filePath) {
    return { sourceEvidenceMode: 'constructed_from_committed_readiness_docs' }
  }

  const packet = readJsonObjectFile(filePath)
  if (!isServiceRoleQueueTransactionReadinessPacket(packet)) {
    throw new Error(
      'Service-role queue transaction readiness packet must report service_role_queue_transaction_envelope_prepared_live_writes_blocked with all 21 transaction records ready.',
    )
  }
  validateServiceRoleQueueTransactionReadinessPacket(
    packet,
    '--internal-beta-service-role-queue-transaction-readiness-packet',
  )

  return {
    sourceServiceRoleQueueTransactionReadinessPacket: packet,
    sourceEvidenceMode: 'internal_beta_service_role_queue_transaction_readiness_packet',
  }
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

  const {
    sourceServiceRoleQueueTransactionReadinessPacket,
    sourceEvidenceMode,
  } = readSourceServiceRoleQueueTransactionReadinessPacket()
  const readiness = await buildAiGraphicsInternalBetaServiceRoleRpcSmokeReadiness()
  console.log(JSON.stringify({
    ...readiness,
    input: {
      validatorOnly: true,
      executeLiveSmoke: false,
      sourceEvidenceMode,
      internalBetaServiceRoleQueueTransactionReadinessPacketRead:
        Boolean(sourceServiceRoleQueueTransactionReadinessPacket),
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
