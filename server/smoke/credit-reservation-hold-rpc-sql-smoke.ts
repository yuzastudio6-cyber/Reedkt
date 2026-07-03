import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const databaseName = `reeditpro_credit_reservation_rpc_sql_smoke_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 8)}`

const workspaceId = '00000000-0000-4000-8000-000000000001'
const projectId = '00000000-0000-4000-8000-000000000002'
const walletId = '00000000-0000-4000-8000-000000000003'
const approvalId = '00000000-0000-4000-8000-000000000004'
const estimateId = '00000000-0000-4000-8000-000000000005'
const editPlanId = '00000000-0000-4000-8000-000000000006'

let databaseCreated = false

try {
  runCommand('createdb', [databaseName])
  databaseCreated = true

  runSql(databaseName, buildPrerequisiteSql())
  const migrationSql = readFileSync('supabase/migrations/20260703232842_credit_reservation_hold_rpc.sql', 'utf8')
  assert.ok(
    migrationSql.includes('create or replace function public.reserve_credit_hold'),
    'credit reservation hold migration must define the RPC before SQL smoke can run',
  )
  assert.ok(
    migrationSql.includes('grant execute on function public.reserve_credit_hold'),
    'credit reservation hold migration must grant execute explicitly',
  )
  runSql(databaseName, migrationSql)
  runSql(databaseName, buildFixtureSql())

  const first = queryRows(databaseName, `
    select id, status, reserved_credits, credit_wallet_id, credit_approval_id,
      idempotency_key, metadata->>'stripe_call_attempted' as stripe_call_attempted,
      metadata->>'service_fee_included' as service_fee_included
    from public.reserve_credit_hold(
      'sql-smoke-credit-reservation-hold',
      '${workspaceId}',
      '${projectId}',
      '${walletId}',
      '${approvalId}',
      '${estimateId}',
      '${editPlanId}',
      14,
      null,
      '{"sqlSmoke":true}'::jsonb
    );
  `, ['id', 'status', 'reserved_credits', 'credit_wallet_id', 'credit_approval_id', 'idempotency_key', 'stripe_call_attempted', 'service_fee_included'])[0]

  const replay = queryRows(databaseName, `
    select id, status, reserved_credits, credit_wallet_id, credit_approval_id,
      idempotency_key, metadata->>'stripe_call_attempted' as stripe_call_attempted,
      metadata->>'service_fee_included' as service_fee_included
    from public.reserve_credit_hold(
      'sql-smoke-credit-reservation-hold',
      '${workspaceId}',
      '${projectId}',
      '${walletId}',
      '${approvalId}',
      '${estimateId}',
      '${editPlanId}',
      14,
      null,
      '{"sqlSmoke":true}'::jsonb
    );
  `, ['id', 'status', 'reserved_credits', 'credit_wallet_id', 'credit_approval_id', 'idempotency_key', 'stripe_call_attempted', 'service_fee_included'])[0]

  assert.equal(first.status, 'reserved', 'reservation RPC should create a reserved hold')
  assert.equal(first.reserved_credits, '14', 'reservation RPC should reserve the exact requested credits')
  assert.equal(first.credit_wallet_id, walletId, 'reservation RPC should preserve wallet id')
  assert.equal(first.credit_approval_id, approvalId, 'reservation RPC should preserve approval id')
  assert.equal(first.idempotency_key, 'sql-smoke-credit-reservation-hold', 'reservation RPC should persist idempotency key')
  assert.equal(first.stripe_call_attempted, 'false', 'reservation RPC must preserve Stripe isolation')
  assert.equal(first.service_fee_included, 'false', 'reservation RPC must exclude service fees')
  assert.equal(replay.id, first.id, 'duplicate idempotency key should replay the original reservation')

  const wallet = queryRows(databaseName, `
    select cached_available_credits, cached_reserved_credits
    from public.credit_wallets
    where id = '${walletId}';
  `, ['cached_available_credits', 'cached_reserved_credits'])[0]

  assert.equal(wallet.cached_available_credits, '86', 'reservation RPC should reduce available wallet credits')
  assert.equal(wallet.cached_reserved_credits, '14', 'reservation RPC should increase reserved wallet credits')

  const ledgerRows = queryRows(databaseName, `
    select entry_type, amount, balance_after, related_reservation_id, metadata->>'stripe_call_attempted' as stripe_call_attempted,
      metadata->>'service_fee_included' as service_fee_included
    from public.credit_ledger_entries
    where idempotency_key = 'sql-smoke-credit-reservation-hold:reservation-ledger';
  `, ['entry_type', 'amount', 'balance_after', 'related_reservation_id', 'stripe_call_attempted', 'service_fee_included'])

  assert.equal(ledgerRows.length, 1, 'reservation replay must not duplicate reservation ledger rows')
  assert.equal(ledgerRows[0]?.entry_type, 'reservation', 'reservation ledger entry should use reservation type')
  assert.equal(ledgerRows[0]?.amount, '-14', 'reservation ledger should debit available credits')
  assert.equal(ledgerRows[0]?.balance_after, '86', 'reservation ledger should record available balance after hold')
  assert.equal(ledgerRows[0]?.related_reservation_id, first.id, 'reservation ledger should reference the reservation')
  assert.equal(ledgerRows[0]?.stripe_call_attempted, 'false', 'reservation ledger must preserve Stripe isolation')
  assert.equal(ledgerRows[0]?.service_fee_included, 'false', 'reservation ledger must exclude service fees')

  const insufficient = runCommand('psql', [
    '-v',
    'ON_ERROR_STOP=1',
    '--quiet',
    databaseName,
    '-c',
    `
      select public.reserve_credit_hold(
        'sql-smoke-credit-reservation-insufficient',
        '${workspaceId}',
        '${projectId}',
        '${walletId}',
        '${approvalId}',
        '${estimateId}',
        '${editPlanId}',
        1000,
        null,
        '{}'::jsonb
      );
    `,
  ], { allowFailure: true })

  assert.match(insufficient.stderr, /insufficient available credits/i, 'reservation RPC should fail closed when wallet funds are insufficient')
  assertFunctionPrivilege('anon', 'public.reserve_credit_hold(text,uuid,uuid,uuid,uuid,uuid,uuid,integer,timestamp with time zone,jsonb)', 'execute', false)
  assertFunctionPrivilege('authenticated', 'public.reserve_credit_hold(text,uuid,uuid,uuid,uuid,uuid,uuid,integer,timestamp with time zone,jsonb)', 'execute', false)
  assertFunctionPrivilege('service_role', 'public.reserve_credit_hold(text,uuid,uuid,uuid,uuid,uuid,uuid,integer,timestamp with time zone,jsonb)', 'execute', true)

  console.log(JSON.stringify({
    ok: true,
    databaseName,
    reservationId: first.id,
    reservedCredits: Number(first.reserved_credits),
    walletAvailableCredits: Number(wallet.cached_available_credits),
    walletReservedCredits: Number(wallet.cached_reserved_credits),
    ledgerRows: ledgerRows.length,
    replayedReservationId: replay.id,
    reservationRpcServiceRoleOnly: true,
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

    do $$
    begin
      create type public.credit_wallet_type as enum ('personal', 'workspace', 'business', 'enterprise');
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      create type public.credit_approval_status as enum ('pending', 'approved', 'rejected', 'revised', 'cancelled', 'expired');
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      create type public.credit_reservation_status as enum ('draft', 'reserved', 'partially_spent', 'spent', 'released', 'refunded', 'cancelled', 'expired', 'failed');
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      create type public.credit_ledger_entry_type as enum ('weekly_bonus_grant', 'purchase', 'promotional_grant', 'admin_grant', 'reservation', 'reservation_release', 'spend', 'refund', 'expired_bonus', 'admin_adjustment', 'failed_generation_refund');
    exception
      when duplicate_object then null;
    end $$;

    create table public.workspaces (
      id uuid primary key
    );

    create table public.projects (
      id uuid primary key,
      workspace_id uuid not null references public.workspaces(id) on delete cascade
    );

    create table public.credit_wallets (
      id uuid primary key default gen_random_uuid(),
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

    create table public.credit_approvals (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade,
      credit_estimate_id uuid not null,
      edit_plan_id uuid,
      status public.credit_approval_status not null default 'pending',
      approved_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table public.credit_reservations (
      id uuid primary key default gen_random_uuid(),
      credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      project_id uuid not null references public.projects(id) on delete cascade,
      credit_estimate_id uuid not null,
      credit_approval_id uuid references public.credit_approvals(id) on delete set null,
      edit_plan_id uuid,
      status public.credit_reservation_status not null default 'draft',
      reserved_credits integer not null default 0,
      spent_credits integer not null default 0,
      released_credits integer not null default 0,
      refunded_credits integer not null default 0,
      reservation_reason text,
      idempotency_key text,
      reserved_at timestamptz,
      spent_at timestamptz,
      released_at timestamptz,
      expires_at timestamptz,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create unique index credit_reservations_idempotency_key_uidx
    on public.credit_reservations (idempotency_key)
    where idempotency_key is not null;

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

    create unique index credit_ledger_entries_idempotency_key_uidx
    on public.credit_ledger_entries (idempotency_key)
    where idempotency_key is not null;
  `
}

function buildFixtureSql(): string {
  return `
    insert into public.workspaces (id)
    values ('${workspaceId}');

    insert into public.projects (id, workspace_id)
    values ('${projectId}', '${workspaceId}');

    insert into public.credit_wallets (id, workspace_id, cached_available_credits, cached_reserved_credits)
    values ('${walletId}', '${workspaceId}', 100, 0);

    insert into public.credit_approvals (
      id,
      workspace_id,
      project_id,
      credit_estimate_id,
      edit_plan_id,
      status,
      approved_at
    )
    values (
      '${approvalId}',
      '${workspaceId}',
      '${projectId}',
      '${estimateId}',
      '${editPlanId}',
      'approved',
      now()
    );
  `
}

function runSql(database: string, sql: string): void {
  runCommand('psql', ['-v', 'ON_ERROR_STOP=1', '--quiet', database], { input: sql })
}

function queryRows(database: string, sql: string, columns: string[]): Record<string, string>[] {
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
  ]).stdout.trim().split('\n').at(-1)?.trim() ?? ''
}

function assertFunctionPrivilege(role: string, functionName: string, privilege: string, expected: boolean): void {
  assert.equal(
    queryScalar(databaseName, `select has_function_privilege('${role}', '${functionName}', '${privilege}')::text;`),
    String(expected),
    `${role} ${privilege} privilege on ${functionName} should be ${expected}`,
  )
}

function runCommand(
  command: string,
  args: string[],
  options: { input?: string; allowFailure?: boolean } = {},
): { stdout: string; stderr: string } {
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

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  }
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
