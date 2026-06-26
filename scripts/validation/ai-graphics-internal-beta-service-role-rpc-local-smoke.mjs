import { execFileSync } from 'node:child_process'

const execute = process.argv.includes('--execute-local-smoke')
const confirmed = process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_LOCAL_RPC_SMOKE === 'true'
const smokeEnv = process.env.REEDITPRO_AI_GRAPHICS_LOCAL_RPC_SMOKE_ENV ?? 'local'

const connection = {
  host: process.env.PGHOST ?? '127.0.0.1',
  port: process.env.PGPORT ?? '54322',
  database: process.env.PGDATABASE ?? 'postgres',
  user: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
}

const contract = {
  ok: true,
  decision: 'ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures',
  preparedScript: 'ai-graphics:internal-beta-service-role-rpc-local-smoke',
  executeFlagRequired: '--execute-local-smoke',
  confirmationEnvRequired: 'REEDITPRO_CONFIRM_AI_GRAPHICS_LOCAL_RPC_SMOKE=true',
  allowedEnvironments: ['local', 'staging'],
  defaultEnvironment: smokeEnv,
  requiresMigrationAlreadyApplied: true,
  requiredMigrationFile: 'supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql',
  serviceRoleRpcsExercised: [
    'enqueue_ai_graphics_tool_runtime_jobs',
    'claim_ai_graphics_tool_runtime_job',
    'record_ai_graphics_worker_event',
    'record_ai_graphics_audit_event',
  ],
  localFixtureRowsPersistedAfterRollback: 0,
  toolExecutionPerformed: false,
  runtimeReadyNow: false,
  productionReadyNow: false,
}

if (!execute || !confirmed) {
  console.log(JSON.stringify({
    ...contract,
    status: 'local_rpc_smoke_prepared_not_executed',
    localRpcSmokeExecutedNow: false,
  }, null, 2))
  process.exit(0)
}

if (smokeEnv === 'production') {
  throw new Error('AI graphics local service-role RPC smoke is blocked in production.')
}

if (!['local', 'staging'].includes(smokeEnv)) {
  throw new Error(`Unsupported AI graphics local service-role RPC smoke environment: ${smokeEnv}`)
}

function psql(sql, args = []) {
  return execFileSync('psql', [
    '-h',
    connection.host,
    '-p',
    connection.port,
    '-U',
    connection.user,
    '-d',
    connection.database,
    '-v',
    'ON_ERROR_STOP=1',
    ...args,
  ], {
    encoding: 'utf8',
    input: sql,
    env: {
      ...process.env,
      PGPASSWORD: connection.password,
    },
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

const preflight = JSON.parse(psql(`
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
`, ['-At']))

if (preflight.rpcCount !== 4) throw new Error(`Expected 4 AI graphics RPCs, found ${preflight.rpcCount}`)
if (preflight.jobTypePresent !== true) throw new Error('Missing ai_graphics_tool_runtime job_type enum value.')
if (preflight.approvedSnapshotColumns !== 2) {
  throw new Error(`Expected approved_plan_snapshot_id on jobs and job_batches, found ${preflight.approvedSnapshotColumns}`)
}
if (preflight.fixtureRootCount < 1) throw new Error('Missing local workspace/project fixture root.')

psql(`
begin;
DO $$
declare
  v_workspace_id uuid;
  v_project_id uuid;
  v_wallet_id uuid;
  v_estimate_id uuid;
  v_snapshot_id uuid;
  v_reservation_id uuid;
  v_enqueue jsonb;
  v_job_id uuid;
  v_claim jsonb;
  v_event jsonb;
  v_audit jsonb;
  v_assertion_count integer;
begin
  select w.id, p.id into v_workspace_id, v_project_id
  from public.workspaces w
  join public.projects p on p.workspace_id = w.id
  order by w.created_at, p.created_at
  limit 1;

  insert into public.credit_wallets (workspace_id, name, cached_available_credits, metadata)
  values (
    v_workspace_id,
    'AI graphics local RPC smoke wallet',
    1000,
    '{"source":"ai_graphics_local_rpc_smoke"}'::jsonb
  )
  returning id into v_wallet_id;

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
  ) values (
    v_workspace_id,
    v_project_id,
    'approved'::public.credit_estimate_status,
    21,
    21,
    21,
    'AI graphics local RPC smoke estimate',
    '{"source":"ai_graphics_local_rpc_smoke"}'::jsonb,
    now(),
    'ai_graphics_local_rpc_smoke'
  )
  returning id into v_estimate_id;

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
  ) values (
    v_workspace_id,
    v_project_id,
    v_estimate_id,
    1,
    '{"source":"ai_graphics_local_rpc_smoke","approved":true}'::jsonb,
    true,
    'approved',
    'approved',
    'ai-graphics-local-rpc-smoke-plan',
    'ai-graphics-local-rpc-smoke-credit',
    'ai-graphics-local-rpc-smoke-source',
    'ai-graphics-local-rpc-smoke-timing'
  )
  returning id into v_snapshot_id;

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
  ) values (
    v_wallet_id,
    v_workspace_id,
    v_project_id,
    v_estimate_id,
    v_snapshot_id,
    'reserved'::public.credit_reservation_status,
    21,
    'AI graphics local RPC smoke reservation',
    'ai-graphics-local-rpc-smoke-reservation',
    now(),
    now() + interval '1 hour',
    '{"source":"ai_graphics_local_rpc_smoke"}'::jsonb
  )
  returning id into v_reservation_id;

  v_enqueue := public.enqueue_ai_graphics_tool_runtime_jobs(
    v_workspace_id,
    v_project_id,
    v_snapshot_id,
    v_reservation_id,
    jsonb_build_array(jsonb_build_object(
      'toolId', 'd3',
      'productionToolId', 'ai_graphics.d3',
      'workerType', 'cpu_static_worker',
      'runtimeTarget', 'node_cpu',
      'privateArtifactManifestRef', 'private://ai-graphics/local-rpc-smoke/d3/manifest.json',
      'idempotencyKey', 'ai-graphics-local-rpc-smoke-job-d3'
    )),
    'ai-graphics-local-rpc-smoke-batch'
  );

  v_job_id := (v_enqueue->'jobIds'->>0)::uuid;
  if v_job_id is null or (v_enqueue->>'liveToolExecutionPerformed')::boolean is not false then
    raise exception 'enqueue smoke failed: %', v_enqueue;
  end if;

  v_claim := public.claim_ai_graphics_tool_runtime_job(
    v_job_id,
    'cpu_static_worker',
    'ai-graphics-local-rpc-smoke-worker',
    'ai-graphics-local-rpc-smoke-claim',
    120
  );

  if (v_claim->>'toolExecutionPerformed')::boolean is not false then
    raise exception 'claim smoke changed execution state: %', v_claim;
  end if;

  v_event := public.record_ai_graphics_worker_event(
    v_job_id,
    'progress'::public.job_event_type,
    'AI graphics local RPC smoke progress event.',
    '{"source":"ai_graphics_local_rpc_smoke"}'::jsonb,
    10
  );

  v_audit := public.record_ai_graphics_audit_event(
    v_workspace_id,
    v_project_id,
    'ai_graphics_local_rpc_smoke_audit',
    '{"source":"ai_graphics_local_rpc_smoke"}'::jsonb
  );

  select count(*) into v_assertion_count
  from public.jobs
  where id = v_job_id
    and status = 'running'::public.job_status
    and job_type = 'ai_graphics_tool_runtime'::public.job_type
    and approved_plan_snapshot_id = v_snapshot_id
    and credit_reservation_id = v_reservation_id;

  if v_assertion_count <> 1 then
    raise exception 'job assertion failed for %', v_job_id;
  end if;

  if (v_event->>'toolExecutionPerformed')::boolean is not false then
    raise exception 'worker event smoke changed execution state: %', v_event;
  end if;

  if (v_audit->>'toolExecutionPerformed')::boolean is not false then
    raise exception 'audit smoke changed execution state: %', v_audit;
  end if;
end $$;
rollback;
`)

const postflight = JSON.parse(psql(`
select json_build_object(
  'persistedSmokeRows', (
    select sum(row_count)::integer
    from (
      select count(*) as row_count from public.jobs where idempotency_key like 'ai-graphics-local-rpc-smoke%'
      union all
      select count(*) from public.job_batches where idempotency_key like 'ai-graphics-local-rpc-smoke%'
      union all
      select count(*) from public.worker_job_claims where idempotency_key like 'ai-graphics-local-rpc-smoke%'
      union all
      select count(*) from public.credit_reservations where idempotency_key like 'ai-graphics-local-rpc-smoke%'
      union all
      select count(*) from public.credit_estimates where created_by_agent = 'ai_graphics_local_rpc_smoke'
      union all
      select count(*) from public.credit_wallets where name = 'AI graphics local RPC smoke wallet'
    ) rows
  )
)::text;
`, ['-At']))

if (postflight.persistedSmokeRows !== 0) {
  throw new Error(`Local smoke left ${postflight.persistedSmokeRows} fixture rows behind.`)
}

console.log(JSON.stringify({
  ...contract,
  status: 'local_rpc_smoke_passed_with_rollback_fixtures',
  smokeEnvironment: smokeEnv,
  localRpcSmokeExecutedNow: true,
  localRpcFunctionsPresent: preflight.rpcCount,
  localApprovedSnapshotColumnsPresent: preflight.approvedSnapshotColumns,
  localFixtureRootCount: preflight.fixtureRootCount,
  localRollbackFixtureTransactionsNow: 1,
  localJobRowsInsertedThenRolledBack: 1,
  localWorkerClaimRowsInsertedThenRolledBack: 1,
  localFixtureRowsPersistedAfterRollback: postflight.persistedSmokeRows,
}, null, 2))
