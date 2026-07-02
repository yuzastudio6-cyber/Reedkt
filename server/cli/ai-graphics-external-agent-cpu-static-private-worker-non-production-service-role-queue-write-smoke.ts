import fs from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type {
  AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import type { ServiceContext } from '../types'

const RUNNER_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_runner_prepared_with_runtime_blocks'

const executeFlag =
  '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke'
const operatorPreflightFlag = '--operator-preflight'

const proofTools = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'] as const

const sourcePreflightPath =
  'docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json'
const localOnlySuggestedResultPath =
  '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json'

const requiredEnv = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
] as const

const requiredFlags = [
  executeFlag,
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  '--idempotency-prefix',
  '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  '--service-role-boundary-ref',
  '--private-evidence-ref',
  '--telemetry-ref',
  '--cleanup-proof-ref',
  '--rollback-ref',
  '--output-result',
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
  if (!value) throw new Error(`Missing required flag for CPU/static queue-write smoke: ${flag}`)
  return value
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length === 0 || /^<[^>]+>$/.test(trimmed) || trimmed.includes('<') || trimmed.includes('>')
}

function flagValueRejection(flag: string, value: string): string | null {
  if (isPlaceholderValue(value)) {
    return `${flag} must be a real non-production value, not a placeholder`
  }
  if (/\s/.test(value)) return `${flag} must not contain whitespace`
  if (flag === '--idempotency-prefix') {
    return /^[a-z0-9][a-z0-9:_-]{15,160}$/i.test(value) && value.includes('smoke')
      ? null
      : `${flag} must be a unique smoke idempotency prefix with 16-160 safe characters`
  }
  if (flag === '--source-non-production-service-role-queue-write-smoke-preflight-packet') {
    return value.endsWith('.json') && !value.includes('..')
      ? null
      : `${flag} must point at a JSON source packet without parent traversal`
  }
  if (flag === '--service-role-boundary-ref') {
    return value.startsWith('service-role-boundary://')
      ? null
      : `${flag} must use a service-role-boundary:// reference`
  }
  if (
    flag === '--private-evidence-ref' ||
    flag === '--telemetry-ref' ||
    flag === '--cleanup-proof-ref' ||
    flag === '--rollback-ref'
  ) {
    return value.startsWith('private://') ? null : `${flag} must use a private:// reference`
  }
  if (flag === '--output-result') {
    return value === localOnlySuggestedResultPath
      ? null
      : `${flag} must write only to ${localOnlySuggestedResultPath}`
  }
  return value.length >= 4 ? null : `${flag} must be at least four characters`
}

function invalidFlagValueFindings(): Array<{ flag: string; value: string; reason: string }> {
  return requiredFlags
    .filter((flag) => flag !== executeFlag)
    .map((flag) => {
      const value = valueAfterFlag(flag)
      if (!value) return undefined
      const reason = flagValueRejection(flag, value)
      return reason ? { flag, value, reason } : undefined
    })
    .filter((entry): entry is { flag: string; value: string; reason: string } => Boolean(entry))
}

function assertRuntimeFlagValues(): void {
  const invalidFlagValues = invalidFlagValueFindings()
  if (invalidFlagValues.length > 0) {
    throw new Error(
      `CPU/static queue-write smoke received unsafe runtime flag values: ${invalidFlagValues
        .map((entry) => `${entry.flag}: ${entry.reason}`)
        .join('; ')}`,
    )
  }
}

function preparedContract() {
  return {
    ok: true,
    decision: RUNNER_DECISION,
    status:
      'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_runner_prepared_not_executed',
    preparedScript:
      'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke',
    executeFlagRequired: executeFlag,
    operatorPreflightFlag,
    sourcePreflightPacket: sourcePreflightPath,
    requiredEnv,
    requiredFlags,
    localOnlySuggestedResultPath,
    validatorCommand:
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof -- --external-agent-cpu-static-service-role-queue-write-smoke-result <local-result.json> --print-only',
    toolsSubmitted: 5,
    toolsSubmittedIds: [...proofTools],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    expectedQueueRowsWritten: 5,
    expectedQueueRowsCleanedUp: 5,
    expectedQueueRowsPersistedAfterCleanup: 0,
    expectedWorkerClaimsCreated: 0,
    expectedWorkerDispatchesPerformed: 0,
    expectedWorkerExecutionsPerformed: 0,
    expectedToolExecutionsPerformed: 0,
    liveServiceRoleQueueWriteSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    agentCanExecuteToolsNow: false,
    liveQueueWriteApprovedNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    booleans: {
      externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeRunnerPrepared:
        true,
      exactFiveCpuStaticToolsOnly: true,
      sourcePreflightPacketRequired: true,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      explicitOperatorConfirmationRequired: true,
      cleanupRequired: true,
      savedResultMustBeValidatedSeparately: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      serviceRoleQueueWriteSmokeApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      serviceRoleQueueWriteSmokePerformed: false,
      backendQueueSubmissionPerformed: false,
      workerEnqueuePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      workerExecutionPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
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

function splitRequiredEnv(entry: string): { name: string; expectedValue?: string } {
  const separator = entry.indexOf('=')
  if (separator === -1) return { name: entry }
  return {
    name: entry.slice(0, separator),
    expectedValue: entry.slice(separator + 1),
  }
}

function requiredFlagSatisfiedForOperatorPreflight(flag: string): boolean {
  if (flag === executeFlag) return hasFlag(flag)
  return hasFlag(flag) && Boolean(valueAfterFlag(flag))
}

function buildOperatorPreflightReport() {
  const missingOrMismatchedEnv = requiredEnv
    .map((entry) => {
      const { name, expectedValue } = splitRequiredEnv(entry)
      const actualValue = process.env[name]
      if (expectedValue == null) {
        return actualValue && actualValue.trim().length > 0
          ? undefined
          : { name, expectedValue: 'present', actualValue: actualValue ?? null }
      }
      return actualValue === expectedValue
        ? undefined
        : { name, expectedValue, actualValue: actualValue ?? null }
    })
    .filter((value): value is { name: string; expectedValue: string; actualValue: string | null } =>
      Boolean(value),
    )

  const missingFlags = requiredFlags.filter(
    (flag) => !requiredFlagSatisfiedForOperatorPreflight(flag),
  )
  const invalidFlagValues = invalidFlagValueFindings()
  const explicitSourcePreflightPath = valueAfterFlag(
    '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  )
  const checkedSourcePreflightPath = explicitSourcePreflightPath ?? sourcePreflightPath
  const sourcePreflightExists = fs.existsSync(checkedSourcePreflightPath)
  let sourcePreflightAccepted = false
  let sourcePreflightError: string | null = null

  if (sourcePreflightExists) {
    try {
      const sourcePreflight = readJsonFile<
        AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport
      >(checkedSourcePreflightPath)
      acceptedPreflightRows(sourcePreflight)
      sourcePreflightAccepted = true
    } catch (error) {
      sourcePreflightError = error instanceof Error ? error.message : String(error)
    }
  } else {
    sourcePreflightError = 'source preflight packet is missing'
  }

  const productionBlocked = hasFlag('--production') || process.env.NODE_ENV === 'production'
  const canRunQueueWriteSmokeNow =
    missingOrMismatchedEnv.length === 0 &&
    missingFlags.length === 0 &&
    invalidFlagValues.length === 0 &&
    sourcePreflightAccepted &&
    productionBlocked === false

  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_operator_preflight_completed_with_runtime_blocks',
    status: canRunQueueWriteSmokeNow
      ? 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_operator_preflight_ready_for_explicit_non_production_run'
      : 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_operator_preflight_blocked_pending_runtime_prerequisites',
    operatorPreflightOnly: true,
    canRunQueueWriteSmokeNow,
    preparedScript:
      'ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke',
    executeFlagRequired: executeFlag,
    sourcePreflightPacket: checkedSourcePreflightPath,
    sourcePreflightChecks: {
      sourcePreflightExists,
      sourcePreflightAccepted,
      sourcePreflightError,
    },
    missingOrMismatchedEnv,
    missingFlags,
    invalidFlagValues,
    productionBlocked,
    requiredEnv,
    requiredFlags,
    toolsSubmitted: 5,
    toolsSubmittedIds: [...proofTools],
    expectedQueueRowsWritten: 5,
    expectedQueueRowsCleanedUp: 5,
    expectedQueueRowsPersistedAfterCleanup: 0,
    liveServiceRoleQueueWriteSmokeExecutedNow: false,
    liveSupabaseQueueWritesNow: 0,
    workerClaimsCreatedNow: 0,
    workerDispatchesPerformedNow: 0,
    workerExecutionsPerformedNow: 0,
    toolExecutionsPerformedNow: 0,
    agentCanExecuteToolsNow: false,
    liveQueueWriteApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    booleans: {
      operatorPreflightOnly: true,
      canRunQueueWriteSmokeNow,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      serviceRoleQueueWriteSmokeApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      serviceRoleQueueWriteSmokePerformed: false,
      backendQueueSubmissionPerformed: false,
      workerEnqueuePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      workerExecutionPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
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

function assertAllowedToExecute(): void {
  if (
    process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE !==
    'true'
  ) {
    throw new Error(
      'Set REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true to run the CPU/static non-production queue-write smoke.',
    )
  }
  if (
    process.env.REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV !==
    'non_production'
  ) {
    throw new Error(
      'CPU/static queue-write smoke requires REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production.',
    )
  }
  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('CPU/static queue-write smoke is blocked in production.')
  }
  if (process.env.E2E_RUNTIME_MODE !== 'local') {
    throw new Error('CPU/static queue-write smoke requires E2E_RUNTIME_MODE=local.')
  }
  if (process.env.WORKER_RUNTIME_MODE !== 'mock') {
    throw new Error('CPU/static queue-write smoke requires WORKER_RUNTIME_MODE=mock.')
  }
}

function acceptedPreflightRows(
  packet: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow[] {
  const rows = packet.rows.filter(
    (row) =>
      proofTools.includes(row.toolId as (typeof proofTools)[number]) &&
      row.nonProductionServiceRoleQueueWriteSmokePreflightReady === true &&
      row.preflightEvidence != null,
  )
  const accepted =
    packet.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked' &&
    packet.queueName === AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
    packet.counts?.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools === 5 &&
    packet.booleans?.sourceLiveAdapterQueueWriteProofAccepted === true &&
    packet.booleans?.allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady === true &&
    packet.booleans?.serviceRoleQueueWriteSmokeApprovedNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    rows.length === 5 &&
    proofTools.every((toolId) => rows.some((row) => row.toolId === toolId))

  if (!accepted) {
    throw new Error(
      'CPU/static queue-write smoke requires the accepted five-tool non-production service-role queue-write smoke preflight packet.',
    )
  }
  return rows
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

async function countRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  table: string,
  column: string,
  values: string[],
): Promise<number> {
  if (values.length === 0) return 0
  const { count, error } = await admin
    .from(table)
    .select(column, { count: 'exact', head: true })
    .in(column, values)
  if (error) throw error
  return count ?? 0
}

async function cleanupSmokeRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  input: { jobBatchId?: string; jobIds: string[]; idempotencyPrefix: string },
): Promise<number> {
  await deleteRows(admin, 'job_events', 'job_id', input.jobIds)
  await deleteRows(admin, 'worker_job_claims', 'job_id', input.jobIds)
  await deleteRows(admin, 'jobs', 'id', input.jobIds)
  await deleteRows(admin, 'job_batches', 'id', input.jobBatchId ? [input.jobBatchId] : [])
  const { error } = await admin
    .from('audit_events')
    .delete()
    .eq('event_type', 'ai_graphics_external_agent_cpu_static_service_role_queue_write_smoke')
    .contains('event_json', { idempotencyPrefix: input.idempotencyPrefix })
  if (error) throw error
  return countRows(admin, 'jobs', 'id', input.jobIds)
}

function buildJobs(
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow[],
  idempotencyPrefix: string,
) {
  return rows.map((row) => ({
    toolId: row.toolId,
    productionToolId: row.productionToolId,
    workerType: row.workerType,
    runtimeTarget: row.runtimeTarget,
    capabilityIds: row.capabilityId ? [row.capabilityId] : [],
    privateArtifactManifestRef: row.preflightEvidence?.privateArtifactManifestRef ?? '',
    idempotencyKey: `${idempotencyPrefix}:job:${row.toolId}`,
    priority: 'normal' as const,
    maxAttempts: 1,
    inputPayload: {
      smokeOnly: true,
      externalAgentCpuStaticNonProductionServiceRoleQueueWriteSmoke: true,
      aiGraphicsCanonicalToolId: row.toolId,
      productionToolId: row.productionToolId,
      runtimeTarget: row.runtimeTarget,
      sourcePreflightDecision:
        AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
      sourceLiveAdapterQueueWriteProofRef:
        row.preflightEvidence?.sourceLiveAdapterQueueWriteProofRef,
      sourceWorkerEnqueuePayloadRef:
        row.preflightEvidence?.sourceWorkerEnqueuePayloadRef,
      sourceBackendQueueAdapterRef:
        row.preflightEvidence?.sourceBackendQueueAdapterRef,
      privateArtifactManifestRef:
        row.preflightEvidence?.privateArtifactManifestRef,
      toolExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
    },
  }))
}

async function executeSmoke(): Promise<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult> {
  assertAllowedToExecute()
  assertRuntimeFlagValues()
  const sourcePreflight = readJsonFile<
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport
  >(requiredFlag('--source-non-production-service-role-queue-write-smoke-preflight-packet'))
  const rows = acceptedPreflightRows(sourcePreflight)
  const runtimeEnv = loadRuntimeEnv({
    ...process.env,
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const admin = createSupabaseAdminClient(runtimeEnv)
  if (!admin || runtimeEnv.mockOnly) {
    throw new Error(
      'CPU/static queue-write smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server env.',
    )
  }

  const workspaceId = requiredFlag('--workspace-id')
  const projectId = requiredFlag('--project-id')
  const approvedPlanSnapshotId = requiredFlag('--approved-plan-snapshot-id')
  const creditReservationId = requiredFlag('--credit-reservation-id')
  const idempotencyPrefix = requiredFlag('--idempotency-prefix')
  const serviceRoleBoundaryRef = requiredFlag('--service-role-boundary-ref')
  const privateEvidenceRef = requiredFlag('--private-evidence-ref')
  const telemetryRef = requiredFlag('--telemetry-ref')
  const cleanupProofRef = requiredFlag('--cleanup-proof-ref')
  const rollbackRef = requiredFlag('--rollback-ref')
  requiredFlag('--output-result')

  const context: ServiceContext = {
    env: runtimeEnv,
    clients: { admin, public: null },
    requestId: 'ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
    auth: {
      userId: 'ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
      isMockUser: true,
    },
  }
  const service = createAiGraphicsToolRuntimeQueueService(context)
  const jobs = buildJobs(rows, idempotencyPrefix)
  const queue = await service.enqueueToolRuntimeJobs({
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    jobs,
    idempotencyKey: `${idempotencyPrefix}:batch`,
    batchName: 'AI graphics external-agent CPU/static non-production queue-write smoke',
    createdByAgent:
      'ai_graphics_external_agent_cpu_static_service_role_queue_write_smoke',
  })
  const queueResult = queue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
  }
  const jobIds = queueResult.jobIds ?? []
  if (jobIds.length !== 5 || queueResult.insertedJobCount !== 5) {
    await cleanupSmokeRows(admin, {
      jobBatchId: queueResult.jobBatchId,
      jobIds,
      idempotencyPrefix,
    })
    throw new Error(
      `CPU/static queue-write smoke expected five inserted rows, received ${jobIds.length}.`,
    )
  }

  const persistedAfterCleanup = await cleanupSmokeRows(admin, {
    jobBatchId: queueResult.jobBatchId,
    jobIds,
    idempotencyPrefix,
  })
  if (persistedAfterCleanup !== 0) {
    throw new Error(
      `CPU/static queue-write smoke cleanup must leave zero persisted job rows, found ${persistedAfterCleanup}.`,
    )
  }

  return {
    ok: true,
    decision:
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_passed_with_cleanup',
    status:
      'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution',
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    toolsSubmitted: 5,
    toolsSubmittedIds: [...proofTools],
    queueRowsWritten: jobIds.length as 5,
    queueRowsCleanedUp: jobIds.length as 5,
    queueRowsPersistedAfterCleanup: 0,
    workerClaimsCreated: 0,
    workerDispatchesPerformed: 0,
    workerExecutionsPerformed: 0,
    toolExecutionsPerformed: 0,
    serviceRoleBoundaryRef,
    privateEvidenceRef,
    telemetryRef,
    cleanupProofRef,
    rollbackRef,
    sourcePreflightDecision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
    sourcePreflightAccepted: true,
    liveServiceRoleQueueWriteSmokeExecutedNow: true,
    liveSupabaseQueueWritesNow: jobIds.length as 5,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    gpuRuntimeShouldStartNow: false,
    externalAgentExecutableNowTools: 0,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
}

async function main(): Promise<void> {
  if (hasFlag(operatorPreflightFlag)) {
    console.log(JSON.stringify(buildOperatorPreflightReport(), null, 2))
    return
  }
  if (!hasFlag(executeFlag)) {
    console.log(JSON.stringify(preparedContract(), null, 2))
    return
  }
  const result = await executeSmoke()
  const outputPath = valueAfterFlag('--output-result')
  if (outputPath) {
    fs.mkdirSync(outputPath.split('/').slice(0, -1).join('/') || '.', { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  }
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
