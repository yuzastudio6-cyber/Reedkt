import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const databaseName = `reeditpro_beta_platform_rls_sql_smoke_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 8)}`

const memberUserId = '00000000-0000-4000-8000-000000000010'
const nonMemberUserId = '00000000-0000-4000-8000-000000000011'

let databaseCreated = false

try {
  runCommand('createdb', [databaseName])
  databaseCreated = true

  runSql(databaseName, buildPrerequisiteSql())
  applyMigration(databaseName, 'supabase/migrations/202606270001_tool_cost_metering_events.sql')
  applyMigration(databaseName, 'supabase/migrations/202606270002_beta_readiness_evidence_packets.sql')
  applyMigration(databaseName, 'supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql')
  runSql(databaseName, buildFixtureSql())

  queryScalar(databaseName, `
    select status
    from public.settle_tool_cost_event('rls-smoke-settle-member', 'rls-smoke-event-member', 'spend');
  `)

  const memberToolCostRows = Number(queryAsAuthenticated(databaseName, memberUserId, 'select count(*) from public.tool_cost_events;'))
  const memberSettlementRows = Number(queryAsAuthenticated(databaseName, memberUserId, 'select count(*) from public.tool_cost_wallet_settlements;'))
  const memberEvidenceRows = Number(queryAsAuthenticated(databaseName, memberUserId, 'select count(*) from public.beta_readiness_evidence_packets;'))

  const nonMemberToolCostRows = Number(queryAsAuthenticated(databaseName, nonMemberUserId, 'select count(*) from public.tool_cost_events;'))
  const nonMemberSettlementRows = Number(queryAsAuthenticated(databaseName, nonMemberUserId, 'select count(*) from public.tool_cost_wallet_settlements;'))
  const nonMemberEvidenceRows = Number(queryAsAuthenticated(databaseName, nonMemberUserId, 'select count(*) from public.beta_readiness_evidence_packets;'))

  assert.equal(memberToolCostRows, 1, 'workspace member should read only the scoped tool cost event')
  assert.equal(memberSettlementRows, 1, 'workspace member should read only the scoped wallet settlement')
  assert.equal(memberEvidenceRows, 0, 'beta readiness evidence packets should remain backend-only with no authenticated read policy')
  assert.equal(nonMemberToolCostRows, 0, 'non-member should not read tool cost events')
  assert.equal(nonMemberSettlementRows, 0, 'non-member should not read wallet settlements')
  assert.equal(nonMemberEvidenceRows, 0, 'non-member should not read backend-only beta evidence packets')

  assertAuthenticatedInsertDenied(
    databaseName,
    memberUserId,
    `
      insert into public.tool_cost_events (
        id,
        idempotency_key,
        workspace_id,
        project_id,
        tool_id,
        tool_name,
        usage_category,
        provider_type,
        quality_level,
        started_at,
        completed_at,
        wall_clock_ms,
        billable_ms,
        rate_card_version
      )
      values (
        'rls-smoke-authenticated-insert-denied',
        'rls-smoke-authenticated-insert-denied-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        'ffmpeg',
        'FFmpeg',
        'rendering',
        'deterministic_renderer',
        'preview',
        now(),
        now(),
        1,
        1,
        'tool-metering-v1-2026-06-26'
      );
    `,
  )

  const policyRows = queryScalar(databaseName, `
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('tool_cost_events', 'tool_cost_wallet_settlements')
      and policyname in (
        'tool_cost_events_select_workspace_member',
        'tool_cost_wallet_settlements_select_workspace_member'
      );
  `)

  assert.equal(policyRows, '2', 'tool cost event and wallet settlement select policies should exist')

  console.log(JSON.stringify({
    ok: true,
    databaseName,
    memberToolCostRows,
    memberSettlementRows,
    memberEvidenceRows,
    nonMemberToolCostRows,
    nonMemberSettlementRows,
    nonMemberEvidenceRows,
    authenticatedInsertDenied: true,
    remoteSupabaseTouched: false,
  }, null, 2))
} finally {
  if (databaseCreated) {
    runCommand('dropdb', ['--if-exists', databaseName], { allowFailure: true })
  }
}

function applyMigration(database: string, path: string): void {
  const sql = readFileSync(path, 'utf8')
  runSql(database, sql)
}

function buildPrerequisiteSql(): string {
  return `
    create extension if not exists pgcrypto;
    create schema if not exists auth;

    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated;
      end if;
    end
    $$;

    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;

    create table public.workspaces (
      id uuid primary key,
      owner_id uuid not null
    );

    create table public.workspace_members (
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      user_id uuid not null,
      role text not null,
      primary key (workspace_id, user_id)
    );

    create table public.projects (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade
    );

    create table public.credit_reservations (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade,
      status text not null
    );

    create table public.credit_ledger_entries (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid references public.projects(id) on delete cascade,
      credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
      entry_type text not null,
      credits_delta numeric not null,
      reason text not null,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create or replace function public.is_workspace_member(workspace_uuid uuid)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $$
      select exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = workspace_uuid
          and wm.user_id = auth.uid()
      );
    $$;

    create or replace function public.is_project_member(project_uuid uuid)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $$
      select exists (
        select 1
        from public.projects p
        where p.id = project_uuid
          and public.is_workspace_member(p.workspace_id)
      );
    $$;
  `
}

function buildFixtureSql(): string {
  return `
    insert into public.workspaces (id, owner_id)
    values
      ('00000000-0000-4000-8000-000000000001', '${memberUserId}'),
      ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000012');

    insert into public.workspace_members (workspace_id, user_id, role)
    values
      ('00000000-0000-4000-8000-000000000001', '${memberUserId}', 'owner'),
      ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000012', 'owner');

    insert into public.projects (id, workspace_id)
    values
      ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
      ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000101');

    insert into public.credit_reservations (id, workspace_id, project_id, status)
    values (
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'reserved'
    );

    insert into public.tool_cost_events (
      id,
      idempotency_key,
      workspace_id,
      project_id,
      edit_plan_id,
      job_id,
      credit_estimate_id,
      credit_reservation_id,
      tool_id,
      tool_name,
      usage_category,
      provider_type,
      quality_level,
      started_at,
      completed_at,
      wall_clock_ms,
      billable_ms,
      rate_card_version,
      actual_internal_cost_cents,
      actual_internal_cost_micros,
      tool_cost_credits,
      failure_category,
      billable_to_user,
      metadata
    )
    values
      (
        'rls-smoke-event-member',
        'rls-smoke-event-member-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        'rls-smoke-edit-plan',
        'rls-smoke-job-member',
        'rls-smoke-estimate',
        '00000000-0000-4000-8000-000000000003',
        'ffmpeg',
        'FFmpeg',
        'rendering',
        'deterministic_renderer',
        'preview',
        '2026-06-27T00:00:00Z',
        '2026-06-27T00:00:01Z',
        1000,
        1000,
        'tool-metering-v1-2026-06-26',
        11,
        110000,
        7,
        'none',
        true,
        '{"rlsSmoke":true,"workspace":"member"}'::jsonb
      ),
      (
        'rls-smoke-event-other-workspace',
        'rls-smoke-event-other-workspace-key',
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000102',
        'rls-smoke-edit-plan-other',
        'rls-smoke-job-other',
        'rls-smoke-estimate-other',
        null,
        'ffmpeg',
        'FFmpeg',
        'rendering',
        'deterministic_renderer',
        'preview',
        '2026-06-27T00:00:00Z',
        '2026-06-27T00:00:01Z',
        1000,
        1000,
        'tool-metering-v1-2026-06-26',
        9,
        90000,
        4,
        'none',
        true,
        '{"rlsSmoke":true,"workspace":"other"}'::jsonb
      );

    insert into public.beta_readiness_evidence_packets (
      id,
      workspace_id,
      project_id,
      idempotency_key,
      created_by_user_id,
      evidence
    )
    values (
      'rls-smoke-evidence-member',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'rls-smoke-evidence-member-key',
      '${memberUserId}',
      '{"rlsSmoke":true}'::jsonb
    );

    grant usage on schema public to authenticated;
    grant select on public.tool_cost_events to authenticated;
    grant select on public.tool_cost_wallet_settlements to authenticated;
    grant select on public.beta_readiness_evidence_packets to authenticated;
  `
}

function queryAsAuthenticated(database: string, userId: string, sql: string): string {
  const output = runCommand('psql', [
    '-v',
    'ON_ERROR_STOP=1',
    '--tuples-only',
    '--no-align',
    database,
    '-c',
    `
    set role authenticated;
    set request.jwt.claim.sub = '${userId}';
    ${sql}
    reset role;
    reset request.jwt.claim.sub;
    `,
  ])

  return output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^-?\d+$/.test(line)) ?? ''
}

function assertAuthenticatedInsertDenied(database: string, userId: string, sql: string): void {
  const result = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], {
    input: `
      set role authenticated;
      set request.jwt.claim.sub = '${userId}';
      ${sql}
    `,
    encoding: 'utf8',
    env: process.env,
  })

  assert.notEqual(result.status, 0, 'authenticated tool_cost_events insert should fail')
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /permission denied|violates row-level security policy/i,
    'authenticated insert failure should be permission/RLS related',
  )
}

function runSql(database: string, sql: string): void {
  runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], { input: sql })
}

function queryScalar(database: string, sql: string): string {
  return runCommand('psql', [
    '-v',
    'ON_ERROR_STOP=1',
    '--tuples-only',
    '--no-align',
    database,
    '-c',
    sql,
  ]).trim().split('\n').at(-1)?.trim() ?? ''
}

function runCommand(
  command: string,
  args: string[],
  options: { input?: string; allowFailure?: boolean } = {},
): string {
  const result = spawnSync(command, args, {
    input: options.input,
    encoding: 'utf8',
    env: process.env,
  })

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error([
      `${command} ${args.join(' ')} failed with exit ${result.status}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ].filter(Boolean).join('\n'))
  }

  return result.stdout
}
