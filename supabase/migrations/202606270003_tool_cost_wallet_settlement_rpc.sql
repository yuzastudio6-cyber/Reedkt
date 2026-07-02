-- ReEditPro tool cost wallet settlement RPC.
-- Source migration only until local/staging deployment, RLS, and billing-owner review pass.
-- This does not call Stripe, process media, run providers, or approve production billing by itself.

create table if not exists public.tool_cost_wallet_settlements (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  tool_cost_event_id text not null references public.tool_cost_events(id) on delete cascade,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  credit_ledger_entry_id uuid references public.credit_ledger_entries(id) on delete set null,
  settlement_type text not null,
  status text not null,
  credits_delta numeric not null default 0,
  billable_to_user boolean not null default false,
  failure_category text not null default 'none',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tool_cost_wallet_settlements_idempotency_key_nonempty check (length(trim(idempotency_key)) > 0),
  constraint tool_cost_wallet_settlements_event_id_nonempty check (length(trim(tool_cost_event_id)) > 0),
  constraint tool_cost_wallet_settlements_type check (settlement_type in ('spend', 'release', 'refund')),
  constraint tool_cost_wallet_settlements_status check (status in ('settled', 'not_billable'))
);

comment on table public.tool_cost_wallet_settlements is
'Idempotent settlement records for tool cost events. Rows are written only by backend/service-role settlement code after billing owner approval.';
comment on column public.tool_cost_wallet_settlements.metadata_json is
'Sanitized settlement metadata. Must never contain secrets, raw prompts, service-role keys, API keys, signed URLs, or Stripe payload secrets.';

create index if not exists idx_tool_cost_wallet_settlements_workspace_project_created
  on public.tool_cost_wallet_settlements(workspace_id, project_id, created_at);

create index if not exists idx_tool_cost_wallet_settlements_tool_cost_event
  on public.tool_cost_wallet_settlements(tool_cost_event_id);

alter table public.tool_cost_wallet_settlements enable row level security;

drop policy if exists "tool_cost_wallet_settlements_select_workspace_member" on public.tool_cost_wallet_settlements;
create policy "tool_cost_wallet_settlements_select_workspace_member" on public.tool_cost_wallet_settlements
for select to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

-- Inserts are intentionally backend/service-role only. No authenticated insert/update/delete policy is created.

create or replace function public.settle_tool_cost_event(
  p_idempotency_key text,
  p_tool_cost_event_id text,
  p_settlement_type text default 'spend'
)
returns public.tool_cost_wallet_settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_settlement public.tool_cost_wallet_settlements%rowtype;
  tool_event public.tool_cost_events%rowtype;
  reservation_id uuid;
  ledger_id uuid;
  settlement public.tool_cost_wallet_settlements%rowtype;
  should_bill boolean;
  delta numeric := 0;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  if p_tool_cost_event_id is null or length(trim(p_tool_cost_event_id)) = 0 then
    raise exception 'tool cost event id is required';
  end if;

  if p_settlement_type not in ('spend', 'release', 'refund') then
    raise exception 'unsupported tool cost settlement type: %', p_settlement_type;
  end if;

  select *
    into existing_settlement
    from public.tool_cost_wallet_settlements
    where idempotency_key = p_idempotency_key;

  if found then
    return existing_settlement;
  end if;

  select *
    into tool_event
    from public.tool_cost_events
    where id = p_tool_cost_event_id
    for update;

  if not found then
    raise exception 'tool cost event not found: %', p_tool_cost_event_id;
  end if;

  should_bill := tool_event.billable_to_user
    and tool_event.tool_cost_credits > 0
    and tool_event.failure_category in ('none', 'user_requested_retry', 'user_requested_revision');

  if should_bill then
    if tool_event.credit_reservation_id is null
      or tool_event.credit_reservation_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'billable tool cost event requires uuid credit_reservation_id';
    end if;

    reservation_id := tool_event.credit_reservation_id::uuid;

    perform 1
      from public.credit_reservations cr
      where cr.id = reservation_id
        and cr.workspace_id = tool_event.workspace_id
        and cr.project_id = tool_event.project_id
        and cr.status in ('planned', 'reserved', 'active');

    if not found then
      raise exception 'active credit reservation not found or scope mismatch for tool cost event %', tool_event.id;
    end if;

    if p_settlement_type = 'spend' then
      delta := -tool_event.tool_cost_credits;
    else
      delta := tool_event.tool_cost_credits;
    end if;

    insert into public.credit_ledger_entries (
      workspace_id,
      project_id,
      credit_reservation_id,
      entry_type,
      credits_delta,
      reason,
      metadata_json
    )
    values (
      tool_event.workspace_id,
      tool_event.project_id,
      reservation_id,
      'tool_cost_' || p_settlement_type,
      delta,
      'Tool cost event wallet settlement',
      jsonb_build_object(
        'tool_cost_event_id', tool_event.id,
        'tool_id', tool_event.tool_id,
        'rate_card_version', tool_event.rate_card_version,
        'service_fee_included', false,
        'stripe_call_attempted', false
      )
    )
    returning id into ledger_id;
  end if;

  insert into public.tool_cost_wallet_settlements (
    idempotency_key,
    workspace_id,
    project_id,
    tool_cost_event_id,
    credit_reservation_id,
    credit_ledger_entry_id,
    settlement_type,
    status,
    credits_delta,
    billable_to_user,
    failure_category,
    metadata_json
  )
  values (
    p_idempotency_key,
    tool_event.workspace_id,
    tool_event.project_id,
    tool_event.id,
    reservation_id,
    ledger_id,
    p_settlement_type,
    case when should_bill then 'settled' else 'not_billable' end,
    delta,
    should_bill,
    tool_event.failure_category,
    jsonb_build_object(
      'tool_cost_wallet_settlement_rpc', true,
      'tool_cost_event_id', tool_event.id,
      'stripe_call_attempted', false,
      'service_fee_included', false
    )
  )
  returning * into settlement;

  return settlement;
exception
  when unique_violation then
    select *
      into existing_settlement
      from public.tool_cost_wallet_settlements
      where idempotency_key = p_idempotency_key;

    if found then
      return existing_settlement;
    end if;

    raise;
end;
$$;

comment on function public.settle_tool_cost_event(text, text, text) is
'Idempotently settles a billable tool_cost_events row into credit_ledger_entries. Requires service-role/backend use and does not call Stripe or include ReEditPro service/edit fees.';
