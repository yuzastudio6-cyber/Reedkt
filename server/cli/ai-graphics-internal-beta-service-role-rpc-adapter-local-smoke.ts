import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'
import { buildAiGraphicsServiceRoleRpcSmokeJobs } from '../tool-registry/ai-graphics-internal-beta-service-role-rpc-smoke-readiness'

const RUN_DECISION =
  'ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup'

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

function isLocalRpcSmokeProofPacket(packet: unknown): boolean {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false
  const record = packet as Record<string, unknown>
  const counts = record.counts
  const booleans = record.booleans
  return (
    record.decision === 'ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures' &&
    record.status === 'local_rpc_smoke_passed_with_rollback_fixtures_no_tool_execution' &&
    Boolean(
      counts &&
      typeof counts === 'object' &&
      !Array.isArray(counts) &&
      (counts as Record<string, unknown>).totalAiGraphicsTools === 21 &&
      (counts as Record<string, unknown>).persistentSmokeFixtureRowsAfterRollback === 0,
    ) &&
    Boolean(
      booleans &&
      typeof booleans === 'object' &&
      !Array.isArray(booleans) &&
      (booleans as Record<string, unknown>).internalBetaServiceRoleRpcLocalSmokeProofCompleted === true &&
      (booleans as Record<string, unknown>).localSmokeFixtureRowsRolledBack === true &&
      (booleans as Record<string, unknown>).agentCanExecuteToolsNow === false,
    )
  )
}

function readSourceLocalRpcSmokeProofPacket(): {
  sourceLocalRpcSmokeProofPacketRead: boolean
  sourceEvidenceMode:
    | 'constructed_from_committed_local_smoke_proof'
    | 'internal_beta_service_role_rpc_local_smoke_proof_packet'
} {
  const filePath = valueAfterFlag('--internal-beta-service-role-rpc-local-smoke-proof-packet')
  if (!filePath) {
    return {
      sourceLocalRpcSmokeProofPacketRead: false,
      sourceEvidenceMode: 'constructed_from_committed_local_smoke_proof',
    }
  }

  const packet = readJsonObjectFile(filePath)
  if (!isLocalRpcSmokeProofPacket(packet)) {
    throw new Error(
      'Service-role RPC local smoke proof packet must report local_rpc_smoke_passed_with_rollback_fixtures_no_tool_execution with all 21 tools represented and rollback cleanup complete.',
    )
  }

  return {
    sourceLocalRpcSmokeProofPacketRead: true,
    sourceEvidenceMode: 'internal_beta_service_role_rpc_local_smoke_proof_packet',
  }
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
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
  if (process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE !== 'true') {
    throw new Error('Set REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE=true to run the local adapter RPC smoke.')
  }

  const smokeEnv = process.env.REEDITPRO_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE_ENV ?? 'local'
  if (smokeEnv !== 'local') {
    throw new Error('AI graphics RPC adapter local smoke requires REEDITPRO_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE_ENV=local.')
  }

  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('AI graphics RPC adapter local smoke is blocked in production.')
  }

  return smokeEnv
}

function buildPreparedContract() {
  const source = readSourceLocalRpcSmokeProofPacket()
  return {
    ok: true,
    decision: RUN_DECISION,
    status: 'adapter_local_smoke_prepared_not_executed',
    ...source,
    preparedScript: 'ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke',
    executeFlagRequired: '--execute-local-adapter-smoke',
    confirmationEnvRequired: 'REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE=true',
    allowedEnvironments: ['local'],
    requiredSupabaseEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    requiredPgEnvDefaults: {
      PGHOST: '127.0.0.1',
      PGPORT: '54322',
      PGDATABASE: 'postgres',
      PGUSER: 'postgres',
    },
    serviceRoleRpcsExercised: [
      'enqueue_ai_graphics_tool_runtime_jobs',
      'claim_ai_graphics_tool_runtime_job',
      'record_ai_graphics_worker_event',
      'record_ai_graphics_audit_event',
    ],
    toolsCoveredByAdapterEnqueue: 21,
    localFixtureRowsPersistedAfterCleanup: 0,
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
    'AI graphics adapter local RPC smoke wallet',
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
    'AI graphics adapter local RPC smoke estimate',
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
    'AI graphics adapter local RPC smoke reservation',
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

function cleanupFixtures(prefix: string): void {
  psql(`
begin;
set local session_replication_role = replica;
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

function persistedFixtureRows(prefix: string): number {
  return psqlJson<number>(`
select coalesce(sum(row_count), 0)::integer::text
from (
  select count(*) as row_count from public.jobs where idempotency_key like ${sqlLiteral(`${prefix}%`)}
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

async function runAdapterSmoke() {
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
    throw new Error('Supabase admin client is unavailable; adapter local smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  const prefix = `ai-graphics-adapter-local-rpc-smoke:${Date.now()}`
  let fixtures: FixtureIds | null = null
  try {
    fixtures = createFixtures(prefix)
    const service = createAiGraphicsToolRuntimeQueueService({
      env,
      clients: { admin, public: null },
      requestId: 'ai-graphics-adapter-local-rpc-smoke',
      auth: { userId: 'ai-graphics-adapter-local-rpc-smoke', isMockUser: true },
    } satisfies ServiceContext)
    const jobs = buildAiGraphicsServiceRoleRpcSmokeJobs().map((job) => ({
      ...job,
      idempotencyKey: `${prefix}:job:${job.toolId}`,
    }))

    const enqueue = await service.enqueueToolRuntimeJobs({
      workspaceId: fixtures.workspaceId,
      projectId: fixtures.projectId,
      approvedPlanSnapshotId: fixtures.approvedPlanSnapshotId,
      creditReservationId: fixtures.creditReservationId,
      jobs,
      idempotencyKey: `${prefix}:batch`,
      batchName: 'AI graphics adapter local RPC smoke',
      createdByAgent: prefix,
    })
    const queueResult = enqueue.queueResult as {
      jobBatchId?: string
      jobIds?: unknown[]
      insertedJobCount?: number
      liveToolExecutionPerformed?: boolean
    }
    const firstJobId = Array.isArray(queueResult.jobIds) ? String(queueResult.jobIds[0] ?? '') : ''
    if (!firstJobId) throw new Error('Adapter local smoke enqueue did not return a claimable job ID.')

    const claim = await service.claimToolRuntimeJob({
      jobId: firstJobId,
      workerType: jobs[0].workerType,
      workerInstanceId: `${prefix}:worker`,
      idempotencyKey: `${prefix}:claim:first`,
      leaseSeconds: 60,
    })
    const event = await service.recordWorkerEvent({
      jobId: firstJobId,
      eventType: 'progress',
      message: 'AI graphics adapter local RPC smoke progress event.',
      payload: { smokeOnly: true, toolExecutionPerformed: false },
      progressPercent: 10,
    })
    const audit = await service.recordAuditEvent({
      workspaceId: fixtures.workspaceId,
      projectId: fixtures.projectId,
      eventType: 'ai_graphics_adapter_local_rpc_smoke_audit',
      eventJson: { smokeOnly: true, toolExecutionPerformed: false },
    })

    if (queueResult.insertedJobCount !== 21) {
      throw new Error(`Expected 21 adapter-enqueued jobs, got ${queueResult.insertedJobCount}`)
    }
    if (queueResult.liveToolExecutionPerformed !== false) {
      throw new Error('Adapter enqueue unexpectedly changed tool execution state.')
    }

    return {
      prefix,
      smokeEnv,
      schema,
      fixturesCreated: Boolean(fixtures),
      jobsSubmittedToAdapter: jobs.length,
      jobBatchIdReturned: Boolean(queueResult.jobBatchId),
      jobIdsReturned: Array.isArray(queueResult.jobIds) ? queueResult.jobIds.length : 0,
      insertedJobCount: queueResult.insertedJobCount ?? null,
      workerClaimReturned: Boolean((claim.claimResult as { workerClaimId?: string }).workerClaimId),
      workerEventReturned: Boolean((event.eventResult as { jobEventId?: string }).jobEventId),
      auditEventReturned: Boolean((audit.auditResult as { auditEventId?: string }).auditEventId),
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    }
  } finally {
    cleanupFixtures(prefix)
    const remainingRows = persistedFixtureRows(prefix)
    if (remainingRows !== 0) {
      throw new Error(`Adapter local smoke cleanup left ${remainingRows} fixture rows behind.`)
    }
  }
}

async function main() {
  if (!hasFlag('--execute-local-adapter-smoke')) {
    console.log(JSON.stringify({
      ...buildPreparedContract(),
      adapterLocalSmokeExecutedNow: false,
    }, null, 2))
    return
  }

  const smoke = await runAdapterSmoke()
  console.log(JSON.stringify({
    ...buildPreparedContract(),
    status: 'adapter_local_smoke_passed_with_cleanup',
    smokeEnvironment: smoke.smokeEnv,
    adapterLocalSmokeExecutedNow: true,
    localRpcFunctionsPresent: smoke.schema.rpcCount,
    localApprovedSnapshotColumnsPresent: smoke.schema.approvedSnapshotColumns,
    localFixtureRootCount: smoke.schema.fixtureRootCount,
    fixturesCreated: smoke.fixturesCreated,
    jobsSubmittedToAdapter: smoke.jobsSubmittedToAdapter,
    insertedJobCount: smoke.insertedJobCount,
    jobIdsReturned: smoke.jobIdsReturned,
    workerClaimReturned: smoke.workerClaimReturned,
    workerEventReturned: smoke.workerEventReturned,
    auditEventReturned: smoke.auditEventReturned,
    fixtureRowsPersistedAfterCleanup: 0,
    toolExecutionPerformed: false,
    runtimeReadyNow: false,
    productionReadyNow: false,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
