create or replace function public.reserve_credit_hold(
  p_idempotency_key text,
  p_workspace_id uuid,
  p_project_id uuid,
  p_credit_wallet_id uuid,
  p_credit_approval_id uuid,
  p_credit_estimate_id uuid,
  p_edit_plan_id uuid default null,
  p_reserved_credits integer default 0,
  p_expires_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.credit_reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_reservation public.credit_reservations%rowtype;
  wallet public.credit_wallets%rowtype;
  approval public.credit_approvals%rowtype;
  reservation public.credit_reservations%rowtype;
  available_after integer;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  if p_workspace_id is null then
    raise exception 'workspace id is required';
  end if;

  if p_project_id is null then
    raise exception 'project id is required';
  end if;

  if p_credit_wallet_id is null then
    raise exception 'credit wallet id is required';
  end if;

  if p_credit_approval_id is null then
    raise exception 'credit approval id is required';
  end if;

  if p_credit_estimate_id is null then
    raise exception 'credit estimate id is required';
  end if;

  if p_reserved_credits is null or p_reserved_credits <= 0 then
    raise exception 'reserved credits must be positive';
  end if;

  select *
    into existing_reservation
    from public.credit_reservations
    where idempotency_key = p_idempotency_key;

  if found then
    return existing_reservation;
  end if;

  select *
    into wallet
    from public.credit_wallets
    where id = p_credit_wallet_id
      and workspace_id = p_workspace_id
    for update;

  if not found then
    raise exception 'credit wallet not found or workspace mismatch';
  end if;

  if wallet.cached_available_credits < p_reserved_credits then
    raise exception 'insufficient available credits for reservation';
  end if;

  select *
    into approval
    from public.credit_approvals
    where id = p_credit_approval_id
      and workspace_id = p_workspace_id
      and project_id = p_project_id
      and credit_estimate_id = p_credit_estimate_id
    for update;

  if not found then
    raise exception 'approved credit estimate record not found or scope mismatch';
  end if;

  if approval.status <> 'approved'::public.credit_approval_status then
    raise exception 'credit approval status must be approved before reservation';
  end if;

  if p_edit_plan_id is not null
    and approval.edit_plan_id is not null
    and approval.edit_plan_id <> p_edit_plan_id then
    raise exception 'credit approval edit plan mismatch';
  end if;

  insert into public.credit_reservations (
    credit_wallet_id,
    workspace_id,
    project_id,
    credit_estimate_id,
    credit_approval_id,
    edit_plan_id,
    status,
    reserved_credits,
    reservation_reason,
    idempotency_key,
    reserved_at,
    expires_at,
    metadata
  )
  values (
    p_credit_wallet_id,
    p_workspace_id,
    p_project_id,
    p_credit_estimate_id,
    p_credit_approval_id,
    coalesce(p_edit_plan_id, approval.edit_plan_id),
    'reserved',
    p_reserved_credits,
    'Approved credit estimate reservation hold',
    p_idempotency_key,
    now(),
    p_expires_at,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'credit_reservation_hold_rpc', true,
      'stripe_call_attempted', false,
      'service_fee_included', false
    )
  )
  returning * into reservation;

  update public.credit_wallets
    set cached_available_credits = cached_available_credits - p_reserved_credits,
        cached_reserved_credits = cached_reserved_credits + p_reserved_credits,
        last_calculated_at = now(),
        updated_at = now()
    where id = p_credit_wallet_id
    returning cached_available_credits into available_after;

  insert into public.credit_ledger_entries (
    credit_wallet_id,
    workspace_id,
    entry_type,
    amount,
    balance_after,
    related_project_id,
    related_edit_plan_id,
    related_reservation_id,
    related_estimate_id,
    idempotency_key,
    description,
    metadata
  )
  values (
    p_credit_wallet_id,
    p_workspace_id,
    'reservation',
    -p_reserved_credits,
    available_after,
    p_project_id,
    reservation.edit_plan_id,
    reservation.id,
    p_credit_estimate_id,
    p_idempotency_key || ':reservation-ledger',
    'Credit reservation hold after approved estimate',
    jsonb_build_object(
      'credit_reservation_hold_rpc', true,
      'credit_reservation_id', reservation.id,
      'credit_approval_id', p_credit_approval_id,
      'stripe_call_attempted', false,
      'service_fee_included', false
    )
  );

  return reservation;
exception
  when unique_violation then
    select *
      into existing_reservation
      from public.credit_reservations
      where idempotency_key = p_idempotency_key;

    if found then
      return existing_reservation;
    end if;

    raise;
end;
$$;

comment on function public.reserve_credit_hold(text, uuid, uuid, uuid, uuid, uuid, uuid, integer, timestamptz, jsonb) is
'Idempotently creates a credit reservation hold after an approved credit estimate, updates wallet cached hold balances, and records a reservation ledger entry. Requires service-role/backend use and does not call Stripe or include ReEditPro service/edit fees.';

revoke all on function public.reserve_credit_hold(text, uuid, uuid, uuid, uuid, uuid, uuid, integer, timestamptz, jsonb) from public;
revoke all on function public.reserve_credit_hold(text, uuid, uuid, uuid, uuid, uuid, uuid, integer, timestamptz, jsonb) from anon;
revoke all on function public.reserve_credit_hold(text, uuid, uuid, uuid, uuid, uuid, uuid, integer, timestamptz, jsonb) from authenticated;
grant execute on function public.reserve_credit_hold(text, uuid, uuid, uuid, uuid, uuid, uuid, integer, timestamptz, jsonb) to service_role;
