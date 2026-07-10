-- ReEditPro wallet settlement state updates.
-- Replaces settle_tool_cost_event with reservation and wallet cached-balance movement.
-- Source migration only until staging/production deployment, RLS readback, billing QA,
-- and final owner review pass. This does not call Stripe, process media, run tools,
-- dispatch workers, or approve paid production by itself.

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
  reservation public.credit_reservations%rowtype;
  wallet public.credit_wallets%rowtype;
  reservation_id uuid;
  ledger_id uuid;
  settlement public.tool_cost_wallet_settlements%rowtype;
  should_bill boolean;
  amount integer := 0;
  delta integer := 0;
  remaining_reserved integer := 0;
  new_spent integer := 0;
  new_released integer := 0;
  new_refunded integer := 0;
  new_status public.credit_reservation_status;
  balance_after integer;
  ledger_entry_type public.credit_ledger_entry_type;
  event_estimate_uuid uuid;
  event_edit_plan_uuid uuid;
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
    if existing_settlement.tool_cost_event_id <> p_tool_cost_event_id
      or existing_settlement.settlement_type <> p_settlement_type then
      raise exception 'idempotency key replay mismatch for tool cost wallet settlement';
    end if;

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

  amount := greatest(0, tool_event.tool_cost_credits);
  should_bill := tool_event.billable_to_user
    and amount > 0
    and tool_event.failure_category in ('none', 'user_requested_retry', 'user_requested_revision');

  if should_bill then
    if tool_event.credit_reservation_id is null
      or tool_event.credit_reservation_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'billable tool cost event requires uuid credit_reservation_id';
    end if;

    reservation_id := tool_event.credit_reservation_id::uuid;

    select *
      into reservation
      from public.credit_reservations
      where id = reservation_id
        and workspace_id = tool_event.workspace_id
        and project_id = tool_event.project_id
      for update;

    if not found then
      raise exception 'credit reservation not found or scope mismatch for tool cost event %', tool_event.id;
    end if;

    if reservation.status not in ('reserved', 'partially_spent') then
      raise exception 'credit reservation % is not active for wallet settlement', reservation.id;
    end if;

    select *
      into wallet
      from public.credit_wallets
      where id = reservation.credit_wallet_id
        and workspace_id = tool_event.workspace_id
      for update;

    if not found then
      raise exception 'credit wallet not found or workspace mismatch for reservation %', reservation.id;
    end if;

    remaining_reserved := reservation.reserved_credits
      - reservation.spent_credits
      - reservation.released_credits
      - reservation.refunded_credits;

    if remaining_reserved < amount then
      raise exception 'insufficient remaining reserved credits for tool cost settlement';
    end if;

    if p_settlement_type = 'spend' then
      new_spent := reservation.spent_credits + amount;
      new_released := reservation.released_credits;
      new_refunded := reservation.refunded_credits;
      delta := -amount;
      ledger_entry_type := 'spend';

      update public.credit_wallets
        set cached_reserved_credits = cached_reserved_credits - amount,
            cached_spent_credits = cached_spent_credits + amount,
            last_calculated_at = now(),
            updated_at = now()
        where id = reservation.credit_wallet_id
        returning cached_available_credits into balance_after;
    elsif p_settlement_type = 'release' then
      new_spent := reservation.spent_credits;
      new_released := reservation.released_credits + amount;
      new_refunded := reservation.refunded_credits;
      delta := amount;
      ledger_entry_type := 'reservation_release';

      update public.credit_wallets
        set cached_available_credits = cached_available_credits + amount,
            cached_reserved_credits = cached_reserved_credits - amount,
            last_calculated_at = now(),
            updated_at = now()
        where id = reservation.credit_wallet_id
        returning cached_available_credits into balance_after;
    else
      new_spent := reservation.spent_credits;
      new_released := reservation.released_credits;
      new_refunded := reservation.refunded_credits + amount;
      delta := amount;
      ledger_entry_type := 'refund';

      update public.credit_wallets
        set cached_available_credits = cached_available_credits + amount,
            cached_reserved_credits = cached_reserved_credits - amount,
            cached_refunded_credits = cached_refunded_credits + amount,
            last_calculated_at = now(),
            updated_at = now()
        where id = reservation.credit_wallet_id
        returning cached_available_credits into balance_after;
    end if;

    if new_spent + new_released + new_refunded < reservation.reserved_credits then
      new_status := 'partially_spent';
    elsif new_spent > 0 and new_released = 0 and new_refunded = 0 then
      new_status := 'spent';
    elsif new_spent = 0 and new_released > 0 and new_refunded = 0 then
      new_status := 'released';
    elsif new_spent = 0 and new_released = 0 and new_refunded > 0 then
      new_status := 'refunded';
    else
      new_status := 'partially_spent';
    end if;

    update public.credit_reservations
      set spent_credits = new_spent,
          released_credits = new_released,
          refunded_credits = new_refunded,
          status = new_status,
          spent_at = case
            when p_settlement_type = 'spend' and spent_at is null then now()
            else spent_at
          end,
          released_at = case
            when p_settlement_type in ('release', 'refund') and released_at is null then now()
            else released_at
          end,
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'last_tool_cost_wallet_settlement_rpc', true,
            'last_tool_cost_event_id', tool_event.id,
            'last_tool_cost_settlement_type', p_settlement_type,
            'stripe_call_attempted', false,
            'service_fee_included', false
          ),
          updated_at = now()
      where id = reservation.id;

    if tool_event.credit_estimate_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      event_estimate_uuid := tool_event.credit_estimate_id::uuid;
    end if;

    if tool_event.edit_plan_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      event_edit_plan_uuid := tool_event.edit_plan_id::uuid;
    end if;

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
      reservation.credit_wallet_id,
      tool_event.workspace_id,
      ledger_entry_type,
      delta,
      balance_after,
      tool_event.project_id,
      event_edit_plan_uuid,
      reservation_id,
      event_estimate_uuid,
      p_idempotency_key || ':tool-cost-' || p_settlement_type || '-ledger',
      'Tool cost event wallet settlement',
      jsonb_build_object(
        'tool_cost_wallet_settlement_rpc', true,
        'tool_cost_event_id', tool_event.id,
        'tool_id', tool_event.tool_id,
        'rate_card_version', tool_event.rate_card_version,
        'settlement_type', p_settlement_type,
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
      'wallet_state_updated', should_bill,
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
      if existing_settlement.tool_cost_event_id <> p_tool_cost_event_id
        or existing_settlement.settlement_type <> p_settlement_type then
        raise exception 'idempotency key replay mismatch for tool cost wallet settlement';
      end if;

      return existing_settlement;
    end if;

    raise;
end;
$$;

comment on function public.settle_tool_cost_event(text, text, text) is
'Idempotently settles a tool_cost_events row into wallet/reservation state, tool_cost_wallet_settlements, and credit_ledger_entries. Requires service-role/backend use and does not call Stripe or include ReEditPro service/edit fees.';

revoke all on function public.settle_tool_cost_event(text, text, text) from public;
revoke all on function public.settle_tool_cost_event(text, text, text) from anon;
revoke all on function public.settle_tool_cost_event(text, text, text) from authenticated;
grant execute on function public.settle_tool_cost_event(text, text, text) to service_role;
