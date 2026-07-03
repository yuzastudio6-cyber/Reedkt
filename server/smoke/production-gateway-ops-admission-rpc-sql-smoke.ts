import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const databaseName = `reeditpro_production_ops_admission_sql_smoke_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 8)}`

let databaseCreated = false

try {
  runCommand('createdb', [databaseName])
  databaseCreated = true

  runSql(databaseName, buildPrerequisiteSql())
  const migrationSql = readFileSync('supabase/migrations/20260703215843_production_gateway_ops_admission_rpc.sql', 'utf8')
  assert.ok(
    migrationSql.includes('create or replace function public.claim_production_gateway_worker_lease'),
    'production ops admission migration must define the RPC before SQL smoke can run',
  )
  runSql(databaseName, migrationSql)
  runSql(databaseName, buildFixtureSql())

  const firstClaim = queryJson(databaseName, `
    select public.claim_production_gateway_worker_lease(
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000011',
      'production-gateway:sql-smoke',
      'cpu_analysis_worker',
      'lease-token-sql-smoke-1',
      '2026-07-03T00:05:00.000Z',
      5,
      2,
      2,
      '%/v1/tool-executions/dispatch%',
      '2026-07-03T00:00:00.000Z',
      'qa_probe'
    ) as result;
  `)

  assert.ok(firstClaim.leaseId, 'successful admission should return a lease id')
  assert.equal(firstClaim.workspaceJobCreationCountLastHour, 2, 'workspace rate counter should be returned')
  assert.equal(firstClaim.projectActiveJobCount, 0, 'project active count should be measured before claim')
  assert.equal(firstClaim.workerActiveJobCount, 0, 'worker active count should be measured before claim')

  assertSqlFails(databaseName, `
    select public.claim_production_gateway_worker_lease(
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000011',
      'production-gateway:sql-smoke',
      'cpu_analysis_worker',
      'lease-token-sql-smoke-duplicate',
      '2026-07-03T00:05:00.000Z',
      5,
      2,
      2,
      '%/v1/tool-executions/dispatch%',
      '2026-07-03T00:00:00.000Z',
      'qa_probe'
    );
  `, /lease claim conflict/i)

  assertSqlFails(databaseName, `
    select public.claim_production_gateway_worker_lease(
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000012',
      'production-gateway:sql-smoke',
      'cpu_analysis_worker',
      'lease-token-sql-smoke-project-limit',
      '2026-07-03T00:05:00.000Z',
      5,
      1,
      2,
      '%/v1/tool-executions/dispatch%',
      '2026-07-03T00:00:00.000Z',
      'qa_probe'
    );
  `, /project concurrency limit exceeded/i)

  assertSqlFails(databaseName, `
    select public.claim_production_gateway_worker_lease(
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000013',
      'production-gateway:sql-smoke',
      'cpu_analysis_worker',
      'lease-token-sql-smoke-worker-limit',
      '2026-07-03T00:05:00.000Z',
      5,
      2,
      1,
      '%/v1/tool-executions/dispatch%',
      '2026-07-03T00:00:00.000Z',
      'qa_probe'
    );
  `, /worker concurrency limit exceeded/i)

  assertSqlFails(databaseName, `
    select public.claim_production_gateway_worker_lease(
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000014',
      'production-gateway:sql-smoke',
      'qa_worker',
      'lease-token-sql-smoke-rate-limit',
      '2026-07-03T00:05:00.000Z',
      2,
      2,
      2,
      '%/v1/tool-executions/dispatch%',
      '2026-07-03T00:00:00.000Z',
      'qa_probe'
    );
  `, /workspace rate limit exceeded/i)

  const leaseRows = queryRows(databaseName, `
    select worker_kind, status, metadata->>'production_gateway_ops_admission' as ops_admission,
      metadata->>'stripe_call_attempted' as stripe_call_attempted,
      metadata->>'service_fee_included' as service_fee_included
    from public.worker_leases
    where id = '${String(firstClaim.leaseId)}';
  `)
  assert.equal(leaseRows.length, 1, 'successful admission should create exactly one worker lease')
  assert.equal(leaseRows[0]?.worker_kind, 'cpu_analysis_worker', 'worker kind should be recorded on the lease')
  assert.equal(leaseRows[0]?.status, 'claimed', 'new admission lease should be claimed')
  assert.equal(leaseRows[0]?.ops_admission, 'true', 'lease metadata should mark production gateway admission')
  assert.equal(leaseRows[0]?.stripe_call_attempted, 'false', 'ops admission must not call Stripe')
  assert.equal(leaseRows[0]?.service_fee_included, 'false', 'ops admission must exclude service fees')

  assertFunctionPrivilege(
    'anon',
    'public.claim_production_gateway_worker_lease(uuid,uuid,uuid,text,text,text,timestamp with time zone,integer,integer,integer,text,timestamp with time zone,text)',
    'execute',
    false,
  )
  assertFunctionPrivilege(
    'authenticated',
    'public.claim_production_gateway_worker_lease(uuid,uuid,uuid,text,text,text,timestamp with time zone,integer,integer,integer,text,timestamp with time zone,text)',
    'execute',
    false,
  )
  assertFunctionPrivilege(
    'service_role',
    'public.claim_production_gateway_worker_lease(uuid,uuid,uuid,text,text,text,timestamp with time zone,integer,integer,integer,text,timestamp with time zone,text)',
    'execute',
    true,
  )

  console.log(JSON.stringify({
    ok: true,
    databaseName,
    leaseId: firstClaim.leaseId,
    workspaceJobCreationCountLastHour: firstClaim.workspaceJobCreationCountLastHour,
    projectActiveJobCount: firstClaim.projectActiveJobCount,
    workerActiveJobCount: firstClaim.workerActiveJobCount,
    duplicateJobConflictVerified: true,
    projectConcurrencyBlockVerified: true,
    workerConcurrencyBlockVerified: true,
    workspaceRateLimitBlockVerified: true,
    serviceRoleOnly: true,
    stripeCallAttempted: false,
    serviceFeeIncluded: false,
    remoteSupabaseTouched: false,
  }, null, 2))
} finally {
  if (databaseCreated) {
    runCommand('dropdb', ['--if-exists', databaseName], { allowFailure: true })
  }
}

function buildPrerequisiteSql(): string {
  return `
    create extension if not exists pgcrypto;
    create schema if not exists auth;
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon;
      end if;

      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated;
      end if;

      if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role;
      end if;
    end
    $$;

    create table auth.users (
      id uuid primary key
    );

    create table public.workspaces (
      id uuid primary key
    );

    create table public.projects (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade
    );

    create table public.edit_plans (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade
    );

    create table public.job_batches (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade
    );

    create table public.jobs (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade
    );

    create table public.api_idempotency_keys (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      user_id uuid not null references auth.users(id) on delete cascade,
      idempotency_key text not null,
      request_method text not null,
      request_path text not null,
      request_hash text not null,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create table public.worker_leases (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid references public.workspaces(id) on delete cascade,
      project_id uuid references public.projects(id) on delete cascade,
      edit_plan_id uuid references public.edit_plans(id) on delete set null,
      job_batch_id uuid references public.job_batches(id) on delete cascade,
      job_id uuid references public.jobs(id) on delete cascade,
      worker_id text not null,
      worker_kind text not null,
      status text not null default 'claimed'
        check (status in ('available', 'claimed', 'active', 'renewed', 'released', 'completed', 'failed', 'expired', 'stale', 'cancelled')),
      lease_token text not null,
      claimed_at timestamptz not null default now(),
      heartbeat_at timestamptz,
      expires_at timestamptz not null,
      released_at timestamptz,
      completed_at timestamptz,
      failed_at timestamptz,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create unique index worker_leases_active_job_uidx
    on public.worker_leases(job_id)
    where status in ('claimed', 'active', 'renewed');
  `
}

function buildFixtureSql(): string {
  return `
    insert into auth.users (id)
    values ('00000000-0000-4000-8000-000000000010');

    insert into public.workspaces (id)
    values ('00000000-0000-4000-8000-000000000001');

    insert into public.projects (id, workspace_id)
    values
      ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
      ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001');

    insert into public.jobs (id, workspace_id, project_id)
    values
      ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'),
      ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'),
      ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003'),
      ('00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003');

    insert into public.api_idempotency_keys (
      workspace_id,
      user_id,
      idempotency_key,
      request_method,
      request_path,
      request_hash,
      expires_at,
      created_at
    )
    values
      (
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000010',
        'ops-admission-sql-smoke-1',
        'POST',
        '/v1/tool-executions/dispatch',
        'hash-1',
        '2026-07-03T01:00:00.000Z',
        '2026-07-03T00:00:00.000Z'
      ),
      (
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000010',
        'ops-admission-sql-smoke-2',
        'POST',
        '/v1/tool-executions/dispatch',
        'hash-2',
        '2026-07-03T01:00:00.000Z',
        '2026-07-03T00:00:00.000Z'
      );
  `
}

function runSql(database: string, sql: string): void {
  runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], { input: sql })
}

function assertSqlFails(database: string, sql: string, pattern: RegExp): void {
  const result = runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], {
    input: sql,
    allowFailure: true,
  })
  assert.notEqual(result.status, 0, 'SQL command should fail')
  assert.match(`${result.stdout}\n${result.stderr}`, pattern)
}

function queryRows(database: string, sql: string): Record<string, string>[] {
  const output = runCommand('psql', [
    '-v',
    'ON_ERROR_STOP=1',
    '--csv',
    '--tuples-only',
    database,
    '-c',
    sql,
  ]).stdout.trim()
  if (!output) return []

  return output.split('\n').map((line) => {
    const values = parseCsvLine(line)
    const columns = queryColumnNames(sql)
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']))
  })
}

function queryJson(database: string, sql: string): Record<string, unknown> {
  const row = queryRows(database, sql)[0]
  assert.ok(row?.result, 'query should return a JSON result field')
  return JSON.parse(row.result) as Record<string, unknown>
}

function assertFunctionPrivilege(role: string, signature: string, privilege: string, expected: boolean): void {
  const rows = queryRows(databaseName, `
    select has_function_privilege('${role}', '${signature}', '${privilege}')::text as allowed;
  `)
  assert.equal(rows[0]?.allowed, expected ? 'true' : 'false', `${role} ${privilege} privilege on ${signature}`)
}

function queryColumnNames(sql: string): string[] {
  if (sql.includes(' as result')) return ['result']
  if (sql.includes('has_function_privilege')) return ['allowed']
  if (sql.includes('from public.worker_leases')) {
    return ['worker_kind', 'status', 'ops_admission', 'stripe_call_attempted', 'service_fee_included']
  }
  return []
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

function runCommand(
  command: string,
  args: string[],
  options: { input?: string; allowFailure?: boolean } = {},
): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(command, args, {
    input: options.input,
    encoding: 'utf8',
  })
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  }
}
