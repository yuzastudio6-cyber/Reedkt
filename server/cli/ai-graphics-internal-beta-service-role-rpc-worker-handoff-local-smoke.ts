import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { buildAiGraphicsServiceRoleRpcSmokeJobs } from '../tool-registry/ai-graphics-internal-beta-service-role-rpc-smoke-readiness'
import type { ProductionToolId } from '../tool-registry/production-tool-types'
import type { ServiceContext } from '../types'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import { createProductionWorkerRuntimeState } from '../workers/production/production-worker-lease-manager'
import type {
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'

const RUN_DECISION =
  'ai_graphics_internal_beta_service_role_rpc_worker_handoff_local_smoke_passed_with_cleanup'

const validWorkerTypes = new Set<ProductionWorkerRuntimeType>([
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
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

function isAdapterLocalSmokeProofPacket(packet: unknown): boolean {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false
  const record = packet as Record<string, unknown>
  const counts = record.counts
  const booleans = record.booleans
  return (
    record.decision === 'ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup' &&
    record.status === 'adapter_local_smoke_passed_with_cleanup_no_tool_execution' &&
    Boolean(
      counts &&
      typeof counts === 'object' &&
      !Array.isArray(counts) &&
      (counts as Record<string, unknown>).totalAiGraphicsTools === 21 &&
      (counts as Record<string, unknown>).adapterInsertedJobCount === 21 &&
      (counts as Record<string, unknown>).fixtureRowsPersistedAfterCleanup === 0,
    ) &&
    Boolean(
      booleans &&
      typeof booleans === 'object' &&
      !Array.isArray(booleans) &&
      (booleans as Record<string, unknown>).internalBetaServiceRoleRpcAdapterLocalSmokeProofCompleted === true &&
      (booleans as Record<string, unknown>).localAdapterCleanupPassed === true &&
      (booleans as Record<string, unknown>).agentCanExecuteToolsNow === false &&
      (booleans as Record<string, unknown>).toolExecutionPerformed === false,
    )
  )
}

function readSourceAdapterLocalSmokeProofPacket(): {
  sourceAdapterLocalSmokeProofPacketRead: boolean
  sourceEvidenceMode:
    | 'constructed_from_committed_adapter_local_smoke_proof'
    | 'internal_beta_service_role_rpc_adapter_local_smoke_proof_packet'
} {
  const filePath = valueAfterFlag('--internal-beta-service-role-rpc-adapter-local-smoke-proof-packet')
  if (!filePath) {
    return {
      sourceAdapterLocalSmokeProofPacketRead: false,
      sourceEvidenceMode: 'constructed_from_committed_adapter_local_smoke_proof',
    }
  }

  const packet = readJsonObjectFile(filePath)
  if (!isAdapterLocalSmokeProofPacket(packet)) {
    throw new Error(
      'Service-role RPC adapter local smoke proof packet must report adapter_local_smoke_passed_with_cleanup_no_tool_execution with all 21 tools represented and cleanup complete.',
    )
  }

  return {
    sourceAdapterLocalSmokeProofPacketRead: true,
    sourceEvidenceMode: 'internal_beta_service_role_rpc_adapter_local_smoke_proof_packet',
  }
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function sqlUuidArray(values: string[]): string {
  if (values.length === 0) return 'array[]::uuid[]'
  return `array[${values.map(sqlLiteral).join(', ')}]::uuid[]`
}

function psql(sql: string, args: string[] = []): string {
  return execFileSync('psql', [
    '-h',
    process.env.PGHOST ?? '127.0.0.1',
    '-p',
    process.env.PGPORT ?? '54322',
    '-U',
    process.env.PGUSER ?? 'postgres',
    '-d',
    process.env.PGDATABASE ?? 'postgres',
    '-v',
    'ON_ERROR_STOP=1',
    ...args,
  ], {
    encoding: 'utf8',
    input: sql,
    env: {
      ...process.env,
      PGPASSWORD: process.env.PGPASSWORD ?? 'postgres',
    },
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

function psqlJson<T>(sql: string): T {
  return JSON.parse(psql(sql, ['-At'])) as T
}

function assertAllowed(): string {
  if (process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE !== 'true') {
    throw new Error(
      'Set REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE=true to run the local worker-handoff smoke.',
    )
  }

  const smokeEnv = process.env.REEDITPRO_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE_ENV ?? 'local'
  if (smokeEnv !== 'local') {
    throw new Error(
      'AI graphics RPC worker-handoff local smoke requires REEDITPRO_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE_ENV=local.',
    )
  }

  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('AI graphics RPC worker-handoff local smoke is blocked in production.')
  }

  return smokeEnv
}

function buildPreparedContract() {
  const source = readSourceAdapterLocalSmokeProofPacket()
  return {
    ok: true,
    decision: RUN_DECISION,
    status: 'worker_handoff_local_smoke_prepared_not_executed',
    ...source,
    preparedScript: 'ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke',
    executeFlagRequired: '--execute-local-worker-handoff-smoke',
    confirmationEnvRequired: 'REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE=true',
    allowedEnvironments: ['local'],
    requiredSupabaseEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    toolsCoveredByWorkerHandoff: 21,
    workerBoundaryDispatcherMode: 'mock_safe_in_memory_only',
    localFixtureRowsPersistedAfterCleanup: 0,
    liveProductionWorkerDispatchPerformed: false,
    toolExecutionPerformed: false,
    runtimeReadyNow: false,
    productionReadyNow: false,
  }
}

interface FixtureIds {
  workspaceId: string
  projectId: string
  walletId: string
  creditEstimateId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
}

interface LocalJobRow {
  id: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  inputPayload: Record<string, unknown>
  metadata: Record<string, unknown>
  idempotencyKey: string
  maxAttempts: number
  status: string
}

function createFixtures(prefix: string): FixtureIds {
  return psqlJson<FixtureIds>(`
with root as (
  select w.id as workspace_id, p.id as project_id
  from public.workspaces w
  join public.projects p on p.workspace_id = w.id
  order by w.created_at, p.created_at
  limit 1
),
wallet as (
  insert into public.credit_wallets (workspace_id, name, cached_available_credits, metadata)
  select
    root.workspace_id,
    'AI graphics worker handoff local RPC smoke wallet',
    1000,
    jsonb_build_object('source', ${sqlLiteral(prefix)})
  from root
  returning id, workspace_id
),
estimate as (
  insert into public.credit_estimates (
    workspace_id,
    project_id,
    status,
    total_estimated_credits,
    minimum_estimated_credits,
    maximum_estimated_credits,
    estimate_reason,
    estimate_payload,
    approved_at,
    created_by_agent
  )
  select
    root.workspace_id,
    root.project_id,
    'approved'::public.credit_estimate_status,
    21,
    21,
    21,
    'AI graphics worker handoff local RPC smoke estimate',
    jsonb_build_object('source', ${sqlLiteral(prefix)}),
    now(),
    ${sqlLiteral(prefix)}
  from root
  returning id, workspace_id, project_id
),
snapshot as (
  insert into public.approved_plan_snapshots (
    workspace_id,
    project_id,
    credit_estimate_id,
    snapshot_version,
    snapshot_json,
    immutable,
    status,
    snapshot_status,
    plan_hash,
    credit_hash,
    source_sequence_hash,
    timing_hash
  )
  select
    root.workspace_id,
    root.project_id,
    estimate.id,
    1,
    jsonb_build_object('source', ${sqlLiteral(prefix)}, 'approved', true),
    true,
    'approved',
    'approved',
    ${sqlLiteral(`${prefix}:plan`)},
    ${sqlLiteral(`${prefix}:credit`)},
    ${sqlLiteral(`${prefix}:source`)},
    ${sqlLiteral(`${prefix}:timing`)}
  from root, estimate
  returning id, workspace_id, project_id
),
reservation as (
  insert into public.credit_reservations (
    credit_wallet_id,
    workspace_id,
    project_id,
    credit_estimate_id,
    approved_plan_snapshot_id,
    status,
    reserved_credits,
    reservation_reason,
    idempotency_key,
    reserved_at,
    expires_at,
    metadata
  )
  select
    wallet.id,
    root.workspace_id,
    root.project_id,
    estimate.id,
    snapshot.id,
    'reserved'::public.credit_reservation_status,
    21,
    'AI graphics worker handoff local RPC smoke reservation',
    ${sqlLiteral(`${prefix}:reservation`)},
    now(),
    now() + interval '1 hour',
    jsonb_build_object('source', ${sqlLiteral(prefix)})
  from root, wallet, estimate, snapshot
  returning id, workspace_id, project_id
)
select json_build_object(
  'workspaceId', root.workspace_id,
  'projectId', root.project_id,
  'walletId', wallet.id,
  'creditEstimateId', estimate.id,
  'approvedPlanSnapshotId', snapshot.id,
  'creditReservationId', reservation.id
)::text
from root, wallet, estimate, snapshot, reservation;
`)
}

function cleanupFixtures(prefix: string, jobIds: string[] = []): void {
  const jobIdArray = sqlUuidArray(jobIds)
  psql(`
begin;
set local session_replication_role = replica;
delete from public.audit_events ae
where ae.event_json->>'source' = ${sqlLiteral(prefix)}
   or (
    ae.event_type = 'ai_graphics_tool_runtime_jobs_enqueued'
    and exists (
      select 1 from unnest(${jobIdArray}) as smoke_job_id(id)
      where ae.event_json::text like '%' || smoke_job_id.id::text || '%'
    )
  );
delete from public.job_events where job_id in (
  select id from public.jobs where idempotency_key like ${sqlLiteral(`${prefix}%`)}
);
delete from public.worker_job_claims where idempotency_key like ${sqlLiteral(`${prefix}%`)};
delete from public.job_batches where idempotency_key = ${sqlLiteral(`${prefix}:batch`)};
delete from public.jobs where idempotency_key like ${sqlLiteral(`${prefix}%`)};
delete from public.credit_reservations where idempotency_key = ${sqlLiteral(`${prefix}:reservation`)};
delete from public.approved_plan_snapshots where plan_hash = ${sqlLiteral(`${prefix}:plan`)};
delete from public.credit_estimates where created_by_agent = ${sqlLiteral(prefix)};
delete from public.credit_wallets where metadata->>'source' = ${sqlLiteral(prefix)};
commit;
`)
}

function persistedFixtureRows(prefix: string, jobIds: string[] = []): number {
  const jobIdArray = sqlUuidArray(jobIds)
  return psqlJson<number>(`
select coalesce(sum(row_count), 0)::integer::text
from (
  select count(*) as row_count from public.audit_events ae
  where ae.event_json->>'source' = ${sqlLiteral(prefix)}
     or (
      ae.event_type = 'ai_graphics_tool_runtime_jobs_enqueued'
      and exists (
        select 1 from unnest(${jobIdArray}) as smoke_job_id(id)
        where ae.event_json::text like '%' || smoke_job_id.id::text || '%'
      )
    )
  union all
  select count(*) from public.job_events where job_id in (
    select id from public.jobs where idempotency_key like ${sqlLiteral(`${prefix}%`)}
  )
  union all
  select count(*) from public.jobs where idempotency_key like ${sqlLiteral(`${prefix}%`)}
  union all
  select count(*) from public.job_batches where idempotency_key = ${sqlLiteral(`${prefix}:batch`)}
  union all
  select count(*) from public.worker_job_claims where idempotency_key like ${sqlLiteral(`${prefix}%`)}
  union all
  select count(*) from public.credit_reservations where idempotency_key = ${sqlLiteral(`${prefix}:reservation`)}
  union all
  select count(*) from public.approved_plan_snapshots where plan_hash = ${sqlLiteral(`${prefix}:plan`)}
  union all
  select count(*) from public.credit_estimates where created_by_agent = ${sqlLiteral(prefix)}
  union all
  select count(*) from public.credit_wallets where metadata->>'source' = ${sqlLiteral(prefix)}
) rows;
`)
}

function preflightSchema() {
  psql("notify pgrst, 'reload schema';")
  return psqlJson<{
    rpcCount: number
    jobTypePresent: boolean
    approvedSnapshotColumns: number
    fixtureRootCount: number
  }>(`
select json_build_object(
  'rpcCount', (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'enqueue_ai_graphics_tool_runtime_jobs',
        'claim_ai_graphics_tool_runtime_job',
        'record_ai_graphics_worker_event',
        'record_ai_graphics_audit_event'
      )
  ),
  'jobTypePresent', exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typnamespace = 'public'::regnamespace
      and t.typname = 'job_type'
      and e.enumlabel = 'ai_graphics_tool_runtime'
  ),
  'approvedSnapshotColumns', (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('jobs', 'job_batches')
      and column_name = 'approved_plan_snapshot_id'
  ),
  'fixtureRootCount', (
    select count(*)
    from public.workspaces w
    join public.projects p on p.workspace_id = w.id
  )
)::text;
`)
}

function readJobRow(jobId: string): LocalJobRow {
  return psqlJson<LocalJobRow>(`
select json_build_object(
  'id', id,
  'workspaceId', workspace_id,
  'projectId', project_id,
  'approvedPlanSnapshotId', approved_plan_snapshot_id,
  'creditReservationId', credit_reservation_id,
  'inputPayload', input_payload,
  'metadata', metadata,
  'idempotencyKey', idempotency_key,
  'maxAttempts', max_attempts,
  'status', status
)::text
from public.jobs
where id = ${sqlLiteral(jobId)};
`)
}

function asWorkerType(value: string): ProductionWorkerRuntimeType {
  if (!validWorkerTypes.has(value as ProductionWorkerRuntimeType)) {
    throw new Error(`Unsupported worker type for local handoff smoke: ${value}`)
  }
  return value as ProductionWorkerRuntimeType
}

function buildProductionWorkerPayload(input: {
  prefix: string
  row: LocalJobRow
  job: ReturnType<typeof buildAiGraphicsServiceRoleRpcSmokeJobs>[number]
}): ProductionWorkerJobPayload {
  const toolId = input.job.toolId
  const payload: ProductionWorkerJobPayload = {
    jobId: input.row.id,
    workspaceId: input.row.workspaceId,
    projectId: input.row.projectId,
    approvedSnapshotId: input.row.approvedPlanSnapshotId,
    toolExecutionPlanId: `ai_graphics_rpc_worker_handoff_${toolId}`,
    workerType: asWorkerType(input.job.workerType),
    executionMode: 'mock_safe',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: input.row.maxAttempts ?? input.job.maxAttempts ?? 1,
    requestedToolIds: [input.job.productionToolId as ProductionToolId],
    requestedRecipeIds: [`ai_graphics_${toolId}_worker_boundary_probe`],
    storageReferenceIds: [input.job.privateArtifactManifestRef],
    creditReservationId: input.row.creditReservationId,
    createdAt: new Date().toISOString(),
    metadata: {
      source: input.prefix,
      aiGraphicsCanonicalToolId: toolId,
      runtimeTarget: input.job.runtimeTarget,
      localRpcClaimedJobStatus: input.row.status,
      privateArtifactManifestRef: input.job.privateArtifactManifestRef,
      mockSafeWorkerBoundaryProbeOnly: true,
      liveProductionWorkerDispatchPerformed: false,
      toolExecutionPerformed: false,
    },
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}

async function runWorkerHandoffSmoke() {
  const smokeEnv = assertAllowed()
  const schema = preflightSchema()
  if (schema.rpcCount !== 4) throw new Error(`Expected 4 AI graphics RPCs, found ${schema.rpcCount}`)
  if (schema.jobTypePresent !== true) throw new Error('Missing ai_graphics_tool_runtime job_type enum value.')
  if (schema.approvedSnapshotColumns !== 2) throw new Error('Missing approved_plan_snapshot_id columns on jobs/job_batches.')
  if (schema.fixtureRootCount < 1) throw new Error('Missing workspace/project fixture root.')

  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: process.env.NODE_ENV === 'production' ? 'test' : process.env.NODE_ENV,
    E2E_RUNTIME_MODE: process.env.E2E_RUNTIME_MODE ?? 'local',
    WORKER_RUNTIME_MODE: process.env.WORKER_RUNTIME_MODE ?? 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'false',
  })
  const admin = createSupabaseAdminClient(env)
  if (!admin || env.mockOnly) {
    throw new Error(
      'Supabase admin client is unavailable; worker-handoff local smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  const prefix = `ai-graphics-rpc-worker-handoff-local-smoke:${Date.now()}`
  const jobIds: string[] = []
  try {
    const fixtures = createFixtures(prefix)
    const service = createAiGraphicsToolRuntimeQueueService({
      env,
      clients: { admin, public: null },
      requestId: 'ai-graphics-rpc-worker-handoff-local-smoke',
      auth: { userId: 'ai-graphics-rpc-worker-handoff-local-smoke', isMockUser: true },
    } satisfies ServiceContext)
    const jobs = buildAiGraphicsServiceRoleRpcSmokeJobs().map((job) => ({
      ...job,
      idempotencyKey: `${prefix}:job:${job.toolId}`,
      inputPayload: {
        ...job.inputPayload,
        source: prefix,
        mockSafeWorkerBoundaryProbeOnly: true,
      },
    }))

    const enqueue = await service.enqueueToolRuntimeJobs({
      workspaceId: fixtures.workspaceId,
      projectId: fixtures.projectId,
      approvedPlanSnapshotId: fixtures.approvedPlanSnapshotId,
      creditReservationId: fixtures.creditReservationId,
      jobs,
      idempotencyKey: `${prefix}:batch`,
      batchName: 'AI graphics RPC worker handoff local smoke',
      createdByAgent: prefix,
    })
    const queueResult = enqueue.queueResult as {
      jobBatchId?: string
      jobIds?: unknown[]
      insertedJobCount?: number
      liveToolExecutionPerformed?: boolean
    }
    if (!Array.isArray(queueResult.jobIds) || queueResult.jobIds.length !== 21) {
      throw new Error(`Expected 21 job IDs from adapter enqueue, got ${queueResult.jobIds?.length ?? 0}`)
    }
    jobIds.push(...queueResult.jobIds.map((jobId) => String(jobId)))
    if (queueResult.insertedJobCount !== 21) {
      throw new Error(`Expected 21 adapter-enqueued jobs, got ${queueResult.insertedJobCount}`)
    }
    if (queueResult.liveToolExecutionPerformed !== false) {
      throw new Error('Adapter enqueue unexpectedly changed tool execution state.')
    }

    const state = createProductionWorkerRuntimeState()
    let workerEventsReturned = 0
    const handoffResults = []

    for (let index = 0; index < jobs.length; index += 1) {
      const job = jobs[index]
      const jobId = jobIds[index]
      const claim = await service.claimToolRuntimeJob({
        jobId,
        workerType: job.workerType,
        workerInstanceId: `${prefix}:worker:${job.toolId}`,
        idempotencyKey: `${prefix}:claim:${job.toolId}`,
        leaseSeconds: 60,
      })
      const row = readJobRow(jobId)
      if (row.status !== 'running') {
        throw new Error(`Expected claimed local RPC job ${jobId} to be running, got ${row.status}`)
      }
      if (row.approvedPlanSnapshotId !== fixtures.approvedPlanSnapshotId) {
        throw new Error(`Claimed local RPC job ${jobId} lost its approved snapshot boundary.`)
      }
      if (row.creditReservationId !== fixtures.creditReservationId) {
        throw new Error(`Claimed local RPC job ${jobId} lost its credit reservation boundary.`)
      }

      const payload = buildProductionWorkerPayload({ prefix, row, job })
      const dispatch = await dispatchProductionWorkerJob({
        payload,
        state,
        workerInstanceId: `${prefix}:dispatcher:${job.toolId}`,
      })
      const hardGateBlockCount = dispatch.gateChecks.filter((gate) => gate.hardBlock).length
      const mockOnlyRoute = dispatch.output?.mockOnly === true
      if (
        dispatch.status !== 'completed' ||
        hardGateBlockCount !== 0 ||
        !mockOnlyRoute ||
        dispatch.toolRunResults.length !== 0 ||
        dispatch.artifactRecords.length !== 0 ||
        dispatch.qualityGateResults.length !== 0
      ) {
        throw new Error(`Worker-boundary probe failed for ${job.toolId}.`)
      }

      const event = await service.recordWorkerEvent({
        jobId,
        eventType: 'progress',
        message: 'AI graphics local RPC worker-boundary probe completed without tool execution.',
        payload: {
          source: prefix,
          toolId: job.toolId,
          workerType: job.workerType,
          futureHandler: dispatch.output?.futureHandler ?? 'missing_future_handler',
          mockOnlyRoute,
          liveProductionWorkerDispatchPerformed: false,
          toolExecutionPerformed: false,
        },
        progressPercent: 15,
      })
      if (Boolean((event.eventResult as { jobEventId?: string }).jobEventId)) workerEventsReturned += 1

      handoffResults.push({
        toolId: job.toolId,
        workerType: job.workerType,
        runtimeTarget: job.runtimeTarget,
        jobId,
        workerClaimReturned: Boolean((claim.claimResult as { workerClaimId?: string }).workerClaimId),
        dispatcherStatus: dispatch.status,
        dispatcherFutureHandler: dispatch.output?.futureHandler ?? 'missing_future_handler',
        dispatcherMockOnlyRoute: mockOnlyRoute,
        dispatcherHardGateBlockCount: hardGateBlockCount,
        dispatcherToolRunResults: dispatch.toolRunResults.length,
        dispatcherArtifactRecords: dispatch.artifactRecords.length,
        dispatcherQualityGateResults: dispatch.qualityGateResults.length,
      })
    }

    const audit = await service.recordAuditEvent({
      workspaceId: fixtures.workspaceId,
      projectId: fixtures.projectId,
      eventType: 'ai_graphics_rpc_worker_handoff_local_smoke_audit',
      eventJson: {
        source: prefix,
        claimedJobCount: jobIds.length,
        dispatcherProbeJobsCompleted: handoffResults.length,
        mockSafeWorkerBoundaryProbeOnly: true,
        liveProductionWorkerDispatchPerformed: false,
        toolExecutionPerformed: false,
      },
    })

    const gpuHandoffTools = handoffResults.filter((result) => result.workerType === 'gpu_ai_worker').length
    const renderHandoffTools = handoffResults.filter((result) => result.workerType === 'render_worker').length
    const cpuHandoffTools = handoffResults.filter((result) => result.workerType === 'cpu_analysis_worker').length

    return {
      prefix,
      smokeEnv,
      schema,
      jobsSubmittedToAdapter: jobs.length,
      jobIdsReturned: jobIds.length,
      insertedJobCount: queueResult.insertedJobCount ?? null,
      rpcWorkerClaimsReturned: handoffResults.filter((result) => result.workerClaimReturned).length,
      workerBoundaryHandoffProbesCompleted: handoffResults.length,
      workerEventsReturned,
      auditEventReturned: Boolean((audit.auditResult as { auditEventId?: string }).auditEventId),
      inMemoryDispatcherLeaseRecordsCreated: state.leases.length,
      inMemoryDispatcherLeaseRecordsReleased:
        state.leases.filter((lease) => lease.leaseStatus === 'released').length,
      inMemoryDispatcherEventsRecorded: state.events.length,
      gpuHandoffTools,
      renderHandoffTools,
      cpuHandoffTools,
      handoffResults,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      liveProductionWorkerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    }
  } finally {
    cleanupFixtures(prefix, jobIds)
    const remainingRows = persistedFixtureRows(prefix, jobIds)
    if (remainingRows !== 0) {
      throw new Error(`Worker-handoff local smoke cleanup left ${remainingRows} fixture rows behind.`)
    }
  }
}

async function main() {
  if (!hasFlag('--execute-local-worker-handoff-smoke')) {
    console.log(JSON.stringify({
      ...buildPreparedContract(),
      workerHandoffLocalSmokeExecutedNow: false,
    }, null, 2))
    return
  }

  const smoke = await runWorkerHandoffSmoke()
  console.log(JSON.stringify({
    ...buildPreparedContract(),
    status: 'worker_handoff_local_smoke_passed_with_cleanup',
    smokeEnvironment: smoke.smokeEnv,
    workerHandoffLocalSmokeExecutedNow: true,
    localRpcFunctionsPresent: smoke.schema.rpcCount,
    localApprovedSnapshotColumnsPresent: smoke.schema.approvedSnapshotColumns,
    localFixtureRootCount: smoke.schema.fixtureRootCount,
    jobsSubmittedToAdapter: smoke.jobsSubmittedToAdapter,
    insertedJobCount: smoke.insertedJobCount,
    jobIdsReturned: smoke.jobIdsReturned,
    rpcWorkerClaimsReturned: smoke.rpcWorkerClaimsReturned,
    workerBoundaryHandoffProbesCompleted: smoke.workerBoundaryHandoffProbesCompleted,
    workerEventsReturned: smoke.workerEventsReturned,
    auditEventReturned: smoke.auditEventReturned,
    inMemoryDispatcherLeaseRecordsCreated: smoke.inMemoryDispatcherLeaseRecordsCreated,
    inMemoryDispatcherLeaseRecordsReleased: smoke.inMemoryDispatcherLeaseRecordsReleased,
    inMemoryDispatcherEventsRecorded: smoke.inMemoryDispatcherEventsRecorded,
    gpuHandoffTools: smoke.gpuHandoffTools,
    renderHandoffTools: smoke.renderHandoffTools,
    cpuHandoffTools: smoke.cpuHandoffTools,
    fixtureRowsPersistedAfterCleanup: 0,
    liveProductionWorkerDispatchPerformed: false,
    toolExecutionPerformed: false,
    runtimeReadyNow: false,
    productionReadyNow: false,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
