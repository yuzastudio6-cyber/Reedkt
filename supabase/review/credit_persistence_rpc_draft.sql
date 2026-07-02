-- REVIEW DRAFT ONLY
-- NOT APPLIED
-- DO NOT RUN IN PRODUCTION
-- Generated for RP-SUPABASE-MIGRATION-01 planning review

-- Purpose:
-- Draft transactional RPC/function skeletons. These are deliberately incomplete
-- review artifacts. Do not expose direct client execution without a later security
-- review and approved service-role execution boundary.

create or replace function public.reserve_max_estimate_credits(
  target_workspace_id uuid,
  target_user_id uuid,
  target_credit_estimate_id uuid,
  target_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- REVIEW DRAFT ONLY:
  -- 1. Lock api_idempotency_keys by workspace/user/key and replay on same request hash.
  -- 2. Lock credit_estimates and require approved status, non-expired estimate, and maximum_estimated_credits.
  -- 3. Lock credit_approvals and require approved evidence.
  -- 4. Lock credit_wallets and eligible credit_grants in deterministic grant allocation order.
  -- 5. Validate available credits cover maximum_estimated_credits / requiredHoldCredits.
  -- 6. Insert credit_reservations with status reserved and one active reservation per estimate.
  -- 7. Insert credit_reservation_line_items by grant/estimate line.
  -- 8. Update wallet cached_available_credits and cached_reserved_credits without negative balances.
  -- 9. Append credit_ledger_entries for hold movement.
  -- 10. Store idempotency replay response.
  return jsonb_build_object('status', 'review_draft_only', 'function', 'reserve_max_estimate_credits');
end;
$$;

create or replace function public.reserve_additional_revised_credits(
  target_workspace_id uuid,
  target_user_id uuid,
  target_credit_revision_action_id uuid,
  target_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- REVIEW DRAFT ONLY:
  -- 1. Lock idempotency, credit_revision_actions, credit_reservations, wallet, and grants.
  -- 2. Require action status action_required and selected approve-and-continue resolution.
  -- 3. Require active reserved reservation matching workspace/project/estimate.
  -- 4. Calculate additionalHoldCredits as max(0, new max estimate - reserved credits).
  -- 5. Reject insufficient credits without mutating wallet, reservation, or action.
  -- 6. Increase existing reservation reserved_credits only by the additional hold.
  -- 7. Append one reservation line with revised_credit_additional_hold role in line_payload.
  -- 8. Append ledger hold entries and store idempotency replay response.
  return jsonb_build_object('status', 'review_draft_only', 'function', 'reserve_additional_revised_credits');
end;
$$;

create or replace function public.settle_credit_reservation(
  target_workspace_id uuid,
  target_user_id uuid,
  target_credit_reservation_id uuid,
  target_idempotency_key text,
  settlement_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- REVIEW DRAFT ONLY:
  -- 1. Lock idempotency, credit_reservations, credit_wallets, reservation lines, and selected tool_cost_events.
  -- 2. Require active reserved reservation except idempotent already-settled replay.
  -- 3. Include billable_to_user tool_cost_events only and reject any serviceFeeIncluded=true payload.
  -- 4. Aggregate cents first, convert to credits, then add ReEditPro service/edit fee separately.
  -- 5. If final charge fits hold, spend final charge and release unused reserved credits.
  -- 6. If unapproved overage exceeds hold, cap user spend at reserved credits and record absorbed overage.
  -- 7. If approved but unfunded, record outstanding credits without wallet/reservation mutation.
  -- 8. Insert credit_settlements, update reservation terminal status, update wallet cached balances, append ledger entries.
  -- 9. Allocate reservation line spent/released totals so line sums reconcile to reservation totals.
  -- 10. Store idempotency replay response.
  return jsonb_build_object('status', 'review_draft_only', 'function', 'settle_credit_reservation');
end;
$$;

create or replace function public.complete_stripe_credit_grant_from_webhook(
  target_workspace_id uuid,
  target_user_id uuid,
  target_stripe_webhook_event_id uuid,
  target_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- REVIEW DRAFT ONLY:
  -- 1. Require a previously signature-verified stripe_webhook_events row.
  -- 2. Lock idempotency, webhook event, checkout session, top-up intent, wallet, and grant rows.
  -- 3. Enforce Stripe mode separation, pack ID, amount, currency, wallet, and user/workspace metadata.
  -- 4. Reject duplicate event/key replays that do not match the original request hash.
  -- 5. Mark credit_top_up_intents completed.
  -- 6. Insert purchased credit_grants with safe Stripe provenance only.
  -- 7. Increase wallet cached_available_credits; do not touch reserved/spent/refunded balances.
  -- 8. Append purchased grant ledger entry and store idempotency replay response.
  return jsonb_build_object('status', 'review_draft_only', 'function', 'complete_stripe_credit_grant_from_webhook');
end;
$$;

create or replace function public.expire_bonus_credits(
  target_workspace_id uuid,
  target_idempotency_key text,
  expires_before timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- REVIEW DRAFT ONLY:
  -- 1. Lock idempotency and eligible active bonus/promo grants expiring before the cutoff.
  -- 2. Skip purchased grants unless a future policy explicitly allows expiration.
  -- 3. Reduce grant remaining_amount to zero for expired bonus credits.
  -- 4. Decrease wallet cached_available_credits without negative balances.
  -- 5. Append expiration credit_ledger_entries.
  -- 6. Store idempotency replay response.
  return jsonb_build_object('status', 'review_draft_only', 'function', 'expire_bonus_credits');
end;
$$;

-- Security notes:
-- These drafts use security definer only as a placeholder for owner review.
-- A later migration must move privileged functions to an approved private schema
-- or revoke public execution and grant execute only to service_role.
revoke all on function public.reserve_max_estimate_credits(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reserve_additional_revised_credits(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.settle_credit_reservation(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.complete_stripe_credit_grant_from_webhook(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.expire_bonus_credits(uuid, text, timestamptz) from public, anon, authenticated;

grant execute on function public.reserve_max_estimate_credits(uuid, uuid, uuid, text) to service_role;
grant execute on function public.reserve_additional_revised_credits(uuid, uuid, uuid, text) to service_role;
grant execute on function public.settle_credit_reservation(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.complete_stripe_credit_grant_from_webhook(uuid, uuid, uuid, text) to service_role;
grant execute on function public.expire_bonus_credits(uuid, text, timestamptz) to service_role;
