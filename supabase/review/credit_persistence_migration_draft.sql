-- REVIEW DRAFT ONLY
-- NOT APPLIED
-- DO NOT RUN IN PRODUCTION
-- Generated for RP-SUPABASE-MIGRATION-01 planning review

-- Purpose:
-- Draft missing credit persistence tables and approved ALTER gaps only.
-- Existing credit_wallets, credit_grants, credit_ledger_entries, credit_estimates,
-- credit_estimate_line_items, credit_approvals, credit_reservations,
-- credit_reservation_line_items, credit_refunds, api_idempotency_keys,
-- generation_request_costs, tool_cost_events, and tool_cost_wallet_settlements
-- are reused and must not be duplicated.

-- Existing table gap notes:
-- alter table public.credit_estimates ... only if external-beta fields cannot stay in estimate_payload.
-- alter table public.credit_reservation_line_items ... only if revised_credit_additional_hold requires a first-class role column.
-- alter table public.tool_cost_events ... only after text-to-uuid FK backfill is reviewed.
-- Constraint notes required for later active migration review:
-- non-negative credits and non-negative cents across all billing fields.
-- released_credits <= reserved_credits and spent_credits <= reserved_credits.
-- no negative wallet cached balances.
-- unique idempotency constraints per operation/scope.
-- unique Stripe webhook event ID per Stripe mode.
-- unique Stripe checkout session ID per Stripe mode.

create table if not exists public.credit_settlements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete restrict,
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete restrict,
  credit_reservation_id uuid not null references public.credit_reservations(id) on delete restrict,
  idempotency_key text not null,
  status text not null,
  mode text not null,
  actual_tool_cost_credits integer not null default 0,
  actual_tool_cost_cents integer not null default 0,
  reeditpro_service_fee_credits integer not null default 0,
  final_charge_credits integer not null default 0,
  absorbed_overage_credits integer not null default 0,
  released_credits integer not null default 0,
  outstanding_credits integer not null default 0,
  settlement_payload jsonb not null default '{}'::jsonb,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_settlements_tool_credits_nonnegative check (actual_tool_cost_credits >= 0),
  constraint credit_settlements_tool_cents_nonnegative check (actual_tool_cost_cents >= 0),
  constraint credit_settlements_fee_nonnegative check (reeditpro_service_fee_credits >= 0),
  constraint credit_settlements_final_nonnegative check (final_charge_credits >= 0),
  constraint credit_settlements_absorbed_nonnegative check (absorbed_overage_credits >= 0),
  constraint credit_settlements_released_nonnegative check (released_credits >= 0),
  constraint credit_settlements_outstanding_nonnegative check (outstanding_credits >= 0),
  constraint credit_settlements_normal_charge_consistency check (
    status = 'settled_with_absorbed_overage'
    or final_charge_credits = actual_tool_cost_credits + reeditpro_service_fee_credits
  ),
  constraint credit_settlements_absorbed_charge_consistency check (
    status <> 'settled_with_absorbed_overage'
    or final_charge_credits + absorbed_overage_credits = actual_tool_cost_credits + reeditpro_service_fee_credits
  )
);

create table if not exists public.credit_revision_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  credit_wallet_id uuid references public.credit_wallets(id) on delete restrict,
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete restrict,
  credit_reservation_id uuid not null references public.credit_reservations(id) on delete restrict,
  idempotency_key text not null,
  resolution_idempotency_key text,
  status text not null,
  pause_reason text not null,
  approved_maximum_credits integer not null default 0,
  used_or_committed_credits integer not null default 0,
  additional_low_credits integer not null default 0,
  additional_expected_credits integer not null default 0,
  additional_high_credits integer not null default 0,
  new_maximum_estimated_credits integer not null default 0,
  selected_option_id text,
  resolved_by_user_id uuid references public.user_profiles(id) on delete set null,
  resolved_at timestamptz,
  action_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_revision_action_approved_max_nonnegative check (approved_maximum_credits >= 0),
  constraint credit_revision_action_used_nonnegative check (used_or_committed_credits >= 0),
  constraint credit_revision_action_low_nonnegative check (additional_low_credits >= 0),
  constraint credit_revision_action_expected_nonnegative check (additional_expected_credits >= 0),
  constraint credit_revision_action_high_nonnegative check (additional_high_credits >= 0),
  constraint credit_revision_action_new_max_nonnegative check (new_maximum_estimated_credits >= 0)
);

create table if not exists public.credit_export_locks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  credit_settlement_id uuid not null references public.credit_settlements(id) on delete cascade,
  credit_reservation_id uuid not null references public.credit_reservations(id) on delete restrict,
  idempotency_key text not null,
  lock_status text not null,
  lock_reason text not null,
  outstanding_credits integer not null default 0,
  export_gate_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_export_locks_outstanding_nonnegative check (outstanding_credits >= 0)
);

create table if not exists public.credit_top_up_intents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete restrict,
  idempotency_key text not null,
  pack_id text not null,
  credits integer not null,
  price_cents integer not null,
  currency text not null default 'USD',
  status text not null,
  stripe_mode text,
  checkout_provider text not null,
  top_up_reason text not null,
  completed_credit_grant_id uuid references public.credit_grants(id) on delete set null,
  intent_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint credit_top_up_intents_credits_positive check (credits > 0),
  constraint credit_top_up_intents_price_nonnegative check (price_cents >= 0),
  constraint credit_top_up_intents_currency_usd check (currency = 'USD'),
  constraint credit_top_up_intents_stripe_mode check (stripe_mode is null or stripe_mode in ('test', 'live'))
);

create table if not exists public.stripe_customer_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  credit_wallet_id uuid references public.credit_wallets(id) on delete set null,
  stripe_mode text not null check (stripe_mode in ('test', 'live')),
  stripe_customer_id text not null,
  status text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_payment_method_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  stripe_customer_link_id uuid not null references public.stripe_customer_links(id) on delete cascade,
  stripe_mode text not null check (stripe_mode in ('test', 'live')),
  stripe_customer_id text not null,
  stripe_payment_method_id text not null,
  payment_method_type text not null,
  status text not null,
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stripe_payment_method_links_last4_shape check (last4 is null or last4 ~ '^[0-9]{4}$')
);

create table if not exists public.stripe_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete restrict,
  credit_top_up_intent_id uuid not null references public.credit_top_up_intents(id) on delete restrict,
  stripe_customer_link_id uuid references public.stripe_customer_links(id) on delete set null,
  stripe_mode text not null check (stripe_mode in ('test', 'live')),
  checkout_session_id text not null,
  payment_intent_id text,
  pack_id text not null,
  credits integer not null,
  amount_total_cents integer not null,
  currency text not null default 'USD',
  status text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint stripe_checkout_sessions_credits_positive check (credits > 0),
  constraint stripe_checkout_sessions_amount_nonnegative check (amount_total_cents >= 0),
  constraint stripe_checkout_sessions_currency_usd check (currency = 'USD')
);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  stripe_mode text not null check (stripe_mode in ('test', 'live')),
  stripe_event_id text not null,
  event_type text not null,
  processing_status text not null,
  related_checkout_session_id text,
  related_payment_intent_id text,
  related_setup_intent_id text,
  related_customer_id text,
  related_credit_wallet_id uuid references public.credit_wallets(id) on delete set null,
  related_credit_top_up_intent_id uuid references public.credit_top_up_intents(id) on delete set null,
  safe_event_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists credit_reservations_active_estimate_uidx
  on public.credit_reservations(credit_estimate_id)
  where status = 'reserved';

create unique index if not exists credit_settlements_idempotency_uidx
  on public.credit_settlements(workspace_id, idempotency_key);
create index if not exists credit_settlements_reservation_status_idx
  on public.credit_settlements(credit_reservation_id, status);
create index if not exists credit_settlements_project_created_idx
  on public.credit_settlements(project_id, created_at);

create unique index if not exists credit_revision_actions_idempotency_uidx
  on public.credit_revision_actions(workspace_id, idempotency_key);
create index if not exists credit_revision_actions_reservation_status_idx
  on public.credit_revision_actions(credit_reservation_id, status);

create unique index if not exists credit_export_locks_idempotency_uidx
  on public.credit_export_locks(workspace_id, idempotency_key);
create index if not exists credit_export_locks_settlement_status_idx
  on public.credit_export_locks(credit_settlement_id, lock_status);

create unique index if not exists credit_top_up_intents_idempotency_uidx
  on public.credit_top_up_intents(workspace_id, user_id, idempotency_key);
create index if not exists credit_top_up_intents_wallet_status_idx
  on public.credit_top_up_intents(credit_wallet_id, status);

create unique index if not exists stripe_customer_links_mode_customer_uidx
  on public.stripe_customer_links(stripe_mode, stripe_customer_id);
create index if not exists stripe_customer_links_workspace_user_mode_idx
  on public.stripe_customer_links(workspace_id, user_id, stripe_mode);

create unique index if not exists stripe_payment_method_links_mode_method_uidx
  on public.stripe_payment_method_links(stripe_mode, stripe_payment_method_id);
create index if not exists stripe_payment_method_links_customer_mode_idx
  on public.stripe_payment_method_links(stripe_customer_link_id, stripe_mode);

create unique index if not exists stripe_checkout_sessions_mode_session_uidx
  on public.stripe_checkout_sessions(stripe_mode, checkout_session_id);
create index if not exists stripe_checkout_sessions_wallet_status_idx
  on public.stripe_checkout_sessions(credit_wallet_id, status);

create unique index if not exists stripe_webhook_events_mode_event_uidx
  on public.stripe_webhook_events(stripe_mode, stripe_event_id);
create index if not exists stripe_webhook_events_wallet_created_idx
  on public.stripe_webhook_events(related_credit_wallet_id, created_at);

create index if not exists tool_cost_events_reservation_project_job_billable_idx
  on public.tool_cost_events(credit_reservation_id, project_id, job_id, billable_to_user);
