import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const databaseName = `reeditpro_tool_cost_wallet_sql_smoke_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 8)}`

let databaseCreated = false

try {
  runCommand('createdb', [databaseName])
  databaseCreated = true

  runSql(databaseName, buildPrerequisiteSql())
  const migrationSql = readFileSync('supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql', 'utf8')
  assert.ok(
    migrationSql.includes('create or replace function public.settle_tool_cost_event'),
    'wallet settlement migration must define the RPC before SQL smoke can run',
  )
  runSql(databaseName, migrationSql)
  runSql(databaseName, buildFixtureSql())

  const billableFirst = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-billable', 'sql-smoke-event-billable', 'spend');
  `)[0]

  const billableReplay = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-billable', 'sql-smoke-event-billable', 'spend');
  `)[0]

  const nonBillable = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-provider-failure', 'sql-smoke-event-provider-failure', 'spend');
  `)[0]

  assert.equal(billableFirst.status, 'settled', 'billable tool event should settle')
  assert.equal(billableFirst.credits_delta, '-7', 'spend settlement should debit exactly seven credits')
  assert.equal(billableFirst.billable_to_user, 't', 'billable settlement should remain billable')
  assert.equal(billableFirst.has_ledger, 't', 'billable settlement should create one ledger row')
  assert.equal(billableReplay.id, billableFirst.id, 'duplicate idempotency key should replay the original settlement')
  assert.equal(nonBillable.status, 'not_billable', 'provider failure should settle as non-billable')
  assert.equal(nonBillable.credits_delta, '0', 'non-billable settlement should have no credit delta')
  assert.equal(nonBillable.has_ledger, 'f', 'non-billable settlement should not create a ledger row')

  const ledgerRows = queryRows(databaseName, `
    select entry_type, credits_delta, metadata_json->>'service_fee_included' as service_fee_included,
      metadata_json->>'stripe_call_attempted' as stripe_call_attempted
    from public.credit_ledger_entries
    where metadata_json->>'tool_cost_event_id' = 'sql-smoke-event-billable';
  `)

  assert.equal(ledgerRows.length, 1, 'idempotent replay must not duplicate credit ledger rows')
  assert.equal(ledgerRows[0]?.entry_type, 'tool_cost_spend', 'ledger entry should be a tool cost spend')
  assert.equal(ledgerRows[0]?.credits_delta, '-7', 'ledger delta should match settlement delta')
  assert.equal(ledgerRows[0]?.service_fee_included, 'false', 'tool ledger entry must exclude service fees')
  assert.equal(ledgerRows[0]?.stripe_call_attempted, 'false', 'tool ledger entry must not call Stripe')

  const rlsRows = queryRows(databaseName, `
    select c.relrowsecurity::text as relrowsecurity, count(p.policyname)::text as policy_count
    from pg_class c
    left join pg_policies p
      on p.schemaname = 'public'
     and p.tablename = c.relname
     and p.policyname = 'tool_cost_wallet_settlements_select_workspace_member'
    where c.oid = 'public.tool_cost_wallet_settlements'::regclass
    group by c.relrowsecurity;
  `)

  assert.equal(rlsRows[0]?.relrowsecurity, 'true', 'wallet settlement table should have RLS enabled')
  assert.equal(rlsRows[0]?.policy_count, '1', 'wallet settlement table should expose only the member read policy')

  console.log(JSON.stringify({
    ok: true,
    databaseName,
    billableSettlementId: billableFirst.id,
    billableCreditsDelta: Number(billableFirst.credits_delta),
    nonBillableStatus: nonBillable.status,
    ledgerRows: ledgerRows.length,
    rlsEnabled: rlsRows[0]?.relrowsecurity === 'true',
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
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated;
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

    create table public.tool_cost_events (
      id text primary key,
      idempotency_key text not null unique,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade,
      job_id text not null,
      tool_id text not null,
      rate_card_version text not null,
      tool_cost_credits integer not null,
      credit_reservation_id text,
      billable_to_user boolean not null default false,
      failure_category text not null default 'none',
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create or replace function public.is_workspace_member(workspace_id uuid)
    returns boolean
    language sql
    stable
    as $$ select workspace_id is not null $$;

    create or replace function public.is_project_member(project_id uuid)
    returns boolean
    language sql
    stable
    as $$ select project_id is not null $$;
  `
}

function buildFixtureSql(): string {
  return `
    insert into auth.users (id)
    values ('00000000-0000-4000-8000-000000000010');

    insert into public.workspaces (id)
    values ('00000000-0000-4000-8000-000000000001');

    insert into public.projects (id, workspace_id)
    values ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001');

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
      job_id,
      tool_id,
      rate_card_version,
      tool_cost_credits,
      credit_reservation_id,
      billable_to_user,
      failure_category,
      metadata
    )
    values
      (
        'sql-smoke-event-billable',
        'sql-smoke-event-billable-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        'sql-smoke-job-billable',
        'ffmpeg',
        'tool-metering-v1-2026-06-26',
        7,
        '00000000-0000-4000-8000-000000000003',
        true,
        'none',
        '{"sqlSmoke":true,"stripeCallAttempted":false,"serviceFeeIncluded":false}'::jsonb
      ),
      (
        'sql-smoke-event-provider-failure',
        'sql-smoke-event-provider-failure-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        'sql-smoke-job-provider-failure',
        'ffmpeg',
        'tool-metering-v1-2026-06-26',
        5,
        '00000000-0000-4000-8000-000000000003',
        true,
        'provider_error',
        '{"sqlSmoke":true,"stripeCallAttempted":false,"serviceFeeIncluded":false}'::jsonb
      );
  `
}

function runSql(database: string, sql: string): void {
  runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], { input: sql })
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
  ]).trim()

  if (!output) return []
  const lines = output.split('\n')
  return lines.map((line) => {
    const columns = parseCsvLine(line)
    return Object.fromEntries(columns.map((value, index) => [queryColumns(sql)[index] ?? `column_${index}`, value]))
  })
}

function queryColumns(sql: string): string[] {
  if (sql.includes('credit_ledger_entries')) {
    return ['entry_type', 'credits_delta', 'service_fee_included', 'stripe_call_attempted']
  }

  if (sql.includes('pg_class')) {
    return ['relrowsecurity', 'policy_count']
  }

  return ['id', 'status', 'credits_delta', 'billable_to_user', 'has_ledger']
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

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === ',' && !quoted) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values
}
