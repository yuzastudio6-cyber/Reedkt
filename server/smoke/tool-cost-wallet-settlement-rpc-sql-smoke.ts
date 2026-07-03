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
  const stateMigrationSql = readFileSync('supabase/migrations/20260703234354_wallet_settlement_state_updates.sql', 'utf8')
  assert.ok(
    migrationSql.includes('create or replace function public.settle_tool_cost_event'),
    'wallet settlement migration must define the RPC before SQL smoke can run',
  )
  assert.ok(
    stateMigrationSql.includes('cached_reserved_credits') &&
      stateMigrationSql.includes('spent_credits') &&
      stateMigrationSql.includes('wallet_state_updated'),
    'wallet settlement state migration must update wallet and reservation state',
  )
  runSql(databaseName, migrationSql)
  runSql(databaseName, stateMigrationSql)
  runSql(databaseName, buildFixtureSql())

  const billableFirst = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-billable-spend', 'sql-smoke-event-billable-spend', 'spend');
  `)[0]

  const billableReplay = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-billable-spend', 'sql-smoke-event-billable-spend', 'spend');
  `)[0]

  const release = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-billable-release', 'sql-smoke-event-billable-release', 'release');
  `)[0]

  const refund = queryRows(databaseName, `
    select id, status, credits_delta, billable_to_user, credit_ledger_entry_id is not null as has_ledger
    from public.settle_tool_cost_event('sql-smoke-settle-billable-refund', 'sql-smoke-event-billable-refund', 'refund');
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
  assert.equal(release.status, 'settled', 'release settlement should settle')
  assert.equal(release.credits_delta, '7', 'release settlement should return exactly seven credits')
  assert.equal(release.has_ledger, 't', 'release settlement should create one ledger row')
  assert.equal(refund.status, 'settled', 'refund settlement should settle')
  assert.equal(refund.credits_delta, '7', 'refund settlement should return exactly seven credits')
  assert.equal(refund.has_ledger, 't', 'refund settlement should create one ledger row')
  assert.equal(nonBillable.status, 'not_billable', 'provider failure should settle as non-billable')
  assert.equal(nonBillable.credits_delta, '0', 'non-billable settlement should have no credit delta')
  assert.equal(nonBillable.has_ledger, 'f', 'non-billable settlement should not create a ledger row')

  const ledgerRows = queryRows(databaseName, `
    select entry_type, amount, metadata->>'service_fee_included' as service_fee_included,
      metadata->>'stripe_call_attempted' as stripe_call_attempted
    from public.credit_ledger_entries
    where metadata->>'tool_cost_wallet_settlement_rpc' = 'true'
    order by created_at, entry_type;
  `)

  assert.equal(ledgerRows.length, 3, 'spend/release/refund should create exactly three settlement ledger rows without replay duplicates')
  assert.deepEqual(
    ledgerRows.map((row) => `${row.entry_type}:${row.amount}`).sort(),
    ['refund:7', 'reservation_release:7', 'spend:-7'],
    'ledger entries should record exact spend, release, and refund amounts',
  )
  assert.ok(ledgerRows.every((row) => row.service_fee_included === 'false'), 'tool ledger entries must exclude service fees')
  assert.ok(ledgerRows.every((row) => row.stripe_call_attempted === 'false'), 'tool ledger entries must not call Stripe')

  const walletRows = queryRows(databaseName, `
    select cached_available_credits, cached_reserved_credits, cached_spent_credits, cached_refunded_credits
    from public.credit_wallets
    where id = '00000000-0000-4000-8000-000000000004';
  `, ['cached_available_credits', 'cached_reserved_credits', 'cached_spent_credits', 'cached_refunded_credits'])
  assert.equal(walletRows[0]?.cached_available_credits, '93', 'release/refund should return credits to cached available balance')
  assert.equal(walletRows[0]?.cached_reserved_credits, '0', 'all three settlements should consume the reserved hold balance')
  assert.equal(walletRows[0]?.cached_spent_credits, '7', 'spend settlement should increase cached spent credits')
  assert.equal(walletRows[0]?.cached_refunded_credits, '7', 'refund settlement should increase cached refunded credits')

  const reservationRows = queryRows(databaseName, `
    select status, reserved_credits, spent_credits, released_credits, refunded_credits,
      metadata->>'last_tool_cost_wallet_settlement_rpc' as state_updated
    from public.credit_reservations
    where id = '00000000-0000-4000-8000-000000000003';
  `, ['status', 'reserved_credits', 'spent_credits', 'released_credits', 'refunded_credits', 'state_updated'])
  assert.equal(reservationRows[0]?.reserved_credits, '21', 'reservation should keep original reserved credits')
  assert.equal(reservationRows[0]?.spent_credits, '7', 'spend settlement should update reservation spent credits')
  assert.equal(reservationRows[0]?.released_credits, '7', 'release settlement should update reservation released credits')
  assert.equal(reservationRows[0]?.refunded_credits, '7', 'refund settlement should update reservation refunded credits')
  assert.equal(reservationRows[0]?.state_updated, 'true', 'reservation metadata should record settlement state updates')

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
  assertTablePrivilege('anon', 'public.tool_cost_wallet_settlements', 'select', false)
  assertTablePrivilege('authenticated', 'public.tool_cost_wallet_settlements', 'select', true)
  assertTablePrivilege('authenticated', 'public.tool_cost_wallet_settlements', 'insert', false)
  assertTablePrivilege('service_role', 'public.tool_cost_wallet_settlements', 'select', true)
  assertTablePrivilege('service_role', 'public.tool_cost_wallet_settlements', 'insert', true)
  assertFunctionPrivilege('anon', 'public.settle_tool_cost_event(text,text,text)', 'execute', false)
  assertFunctionPrivilege('authenticated', 'public.settle_tool_cost_event(text,text,text)', 'execute', false)
  assertFunctionPrivilege('service_role', 'public.settle_tool_cost_event(text,text,text)', 'execute', true)

  console.log(JSON.stringify({
    ok: true,
    databaseName,
    billableSettlementId: billableFirst.id,
    billableCreditsDelta: Number(billableFirst.credits_delta),
    releaseCreditsDelta: Number(release.credits_delta),
    refundCreditsDelta: Number(refund.credits_delta),
    nonBillableStatus: nonBillable.status,
    ledgerRows: ledgerRows.length,
    walletAvailableCredits: Number(walletRows[0]?.cached_available_credits),
    walletReservedCredits: Number(walletRows[0]?.cached_reserved_credits),
    reservationSpentCredits: Number(reservationRows[0]?.spent_credits),
    reservationReleasedCredits: Number(reservationRows[0]?.released_credits),
    reservationRefundedCredits: Number(reservationRows[0]?.refunded_credits),
    rlsEnabled: rlsRows[0]?.relrowsecurity === 'true',
    explicitDataApiGrantsVerified: true,
    settlementRpcServiceRoleOnly: true,
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

    do $$
    begin
      create type public.credit_wallet_type as enum ('workspace', 'user');
    exception
      when duplicate_object then null;
    end
    $$;

    do $$
    begin
      create type public.credit_ledger_entry_type as enum (
        'weekly_bonus_grant',
        'purchase',
        'promotional_grant',
        'admin_grant',
        'reservation',
        'reservation_release',
        'spend',
        'refund',
        'expired_bonus',
        'admin_adjustment',
        'failed_generation_refund'
      );
    exception
      when duplicate_object then null;
    end
    $$;

    do $$
    begin
      create type public.credit_reservation_status as enum (
        'draft',
        'reserved',
        'partially_spent',
        'spent',
        'released',
        'refunded',
        'cancelled',
        'expired',
        'failed'
      );
    exception
      when duplicate_object then null;
    end
    $$;

    create table public.credit_wallets (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      wallet_type public.credit_wallet_type not null default 'workspace',
      cached_available_credits integer not null default 0,
      cached_reserved_credits integer not null default 0,
      cached_spent_credits integer not null default 0,
      cached_refunded_credits integer not null default 0,
      last_calculated_at timestamptz,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table public.credit_reservations (
      id uuid primary key,
      credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade,
      credit_estimate_id uuid,
      edit_plan_id uuid,
      status public.credit_reservation_status not null,
      reserved_credits integer not null default 0,
      spent_credits integer not null default 0,
      released_credits integer not null default 0,
      refunded_credits integer not null default 0,
      spent_at timestamptz,
      released_at timestamptz,
      metadata jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now(),
      constraint credit_reservations_usage_lte_reserved check (
        spent_credits + released_credits + refunded_credits <= reserved_credits
      )
    );

    create table public.credit_ledger_entries (
      id uuid primary key default gen_random_uuid(),
      credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      entry_type public.credit_ledger_entry_type not null,
      amount integer not null,
      balance_after integer,
      related_project_id uuid references public.projects(id) on delete set null,
      related_edit_plan_id uuid,
      related_reservation_id uuid references public.credit_reservations(id) on delete set null,
      related_estimate_id uuid,
      idempotency_key text,
      description text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table public.tool_cost_events (
      id text primary key,
      idempotency_key text not null unique,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade,
      edit_plan_id text,
      job_id text not null,
      tool_id text not null,
      tool_name text not null default 'SQL smoke tool',
      usage_category text not null default 'rendering',
      provider_type text not null default 'deterministic_renderer',
      quality_level text not null default 'preview',
      started_at timestamptz not null default now(),
      completed_at timestamptz not null default now(),
      wall_clock_ms integer not null default 1000,
      billable_ms integer not null default 1000,
      rate_card_version text not null,
      tool_cost_credits integer not null,
      credit_estimate_id text,
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

    insert into public.credit_wallets (
      id,
      workspace_id,
      cached_available_credits,
      cached_reserved_credits,
      cached_spent_credits,
      cached_refunded_credits
    )
    values (
      '00000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000001',
      79,
      21,
      0,
      0
    );

    insert into public.credit_reservations (
      id,
      credit_wallet_id,
      workspace_id,
      project_id,
      credit_estimate_id,
      status,
      reserved_credits
    )
    values (
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000005',
      'reserved',
      21
    );

    insert into public.tool_cost_events (
      id,
      idempotency_key,
      workspace_id,
      project_id,
      edit_plan_id,
      job_id,
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
      tool_cost_credits,
      credit_estimate_id,
      credit_reservation_id,
      billable_to_user,
      failure_category,
      metadata
    )
    values
      (
        'sql-smoke-event-billable-spend',
        'sql-smoke-event-billable-spend-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000006',
        'sql-smoke-job-billable-spend',
        'ffmpeg',
        'FFmpeg SQL smoke spend',
        'rendering',
        'deterministic_renderer',
        'preview',
        now(),
        now(),
        1000,
        1000,
        'tool-metering-v1-2026-06-26',
        7,
        '00000000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000003',
        true,
        'none',
        '{"sqlSmoke":true,"stripeCallAttempted":false,"serviceFeeIncluded":false}'::jsonb
      ),
      (
        'sql-smoke-event-billable-release',
        'sql-smoke-event-billable-release-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000006',
        'sql-smoke-job-billable-release',
        'ffmpeg',
        'FFmpeg SQL smoke release',
        'rendering',
        'deterministic_renderer',
        'preview',
        now(),
        now(),
        1000,
        1000,
        'tool-metering-v1-2026-06-26',
        7,
        '00000000-0000-4000-8000-000000000005',
        '00000000-0000-4000-8000-000000000003',
        true,
        'none',
        '{"sqlSmoke":true,"stripeCallAttempted":false,"serviceFeeIncluded":false}'::jsonb
      ),
      (
        'sql-smoke-event-billable-refund',
        'sql-smoke-event-billable-refund-key',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000006',
        'sql-smoke-job-billable-refund',
        'ffmpeg',
        'FFmpeg SQL smoke refund',
        'rendering',
        'deterministic_renderer',
        'preview',
        now(),
        now(),
        1000,
        1000,
        'tool-metering-v1-2026-06-26',
        7,
        '00000000-0000-4000-8000-000000000005',
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
        '00000000-0000-4000-8000-000000000006',
        'sql-smoke-job-provider-failure',
        'ffmpeg',
        'FFmpeg provider failure SQL smoke',
        'rendering',
        'deterministic_renderer',
        'preview',
        now(),
        now(),
        1000,
        1000,
        'tool-metering-v1-2026-06-26',
        5,
        '00000000-0000-4000-8000-000000000005',
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

function queryRows(database: string, sql: string, columns: string[] = queryColumns(sql)): Record<string, string>[] {
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
    const values = parseCsvLine(line)
    return Object.fromEntries(values.map((value, index) => [columns[index] ?? `column_${index}`, value]))
  })
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

function assertTablePrivilege(role: string, relation: string, privilege: string, expected: boolean): void {
  assert.equal(
    queryScalar(databaseName, `select has_table_privilege('${role}', '${relation}', '${privilege}')::text;`),
    String(expected),
    `${role} ${privilege} privilege on ${relation} should be ${expected}`,
  )
}

function assertFunctionPrivilege(role: string, functionName: string, privilege: string, expected: boolean): void {
  assert.equal(
    queryScalar(databaseName, `select has_function_privilege('${role}', '${functionName}', '${privilege}')::text;`),
    String(expected),
    `${role} ${privilege} privilege on ${functionName} should be ${expected}`,
  )
}

function queryColumns(sql: string): string[] {
  if (sql.includes('credit_ledger_entries')) {
    return ['entry_type', 'amount', 'service_fee_included', 'stripe_call_attempted']
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
