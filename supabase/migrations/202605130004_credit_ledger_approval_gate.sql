create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.credit_wallet_type as enum (
    'personal',
    'workspace',
    'business',
    'enterprise'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.credit_source_type as enum (
    'weekly_bonus',
    'purchased',
    'promotional',
    'admin',
    'refund'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.credit_grant_status as enum (
    'active',
    'partially_used',
    'used',
    'expired',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

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
end $$;

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
end $$;

do $$
begin
  create type public.credit_estimate_status as enum (
    'draft',
    'ready',
    'shown_to_user',
    'approved',
    'revised',
    'expired',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.credit_estimate_line_item_type as enum (
    'planning',
    'transcript',
    'basic_edit_cleanup',
    'captions',
    'audio_cleanup',
    'transition',
    'music',
    'sfx',
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'soundsync',
    'render_preview',
    'final_export',
    'revision',
    'premium_generation',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.credit_approval_status as enum (
    'pending',
    'approved',
    'rejected',
    'revised',
    'cancelled',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.credit_refund_status as enum (
    'pending',
    'approved',
    'completed',
    'rejected',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.credit_usage_category as enum (
    'basic_edit',
    'pro_edit',
    'signature_edit',
    'premium_signature_edit',
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'soundsync',
    'rendering',
    'revision',
    'admin',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

create table public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  wallet_type public.credit_wallet_type not null default 'workspace',
  name text not null default 'Reedit Credits',
  currency_code text not null default 'CREDITS',
  cached_available_credits integer not null default 0,
  cached_reserved_credits integer not null default 0,
  cached_spent_credits integer not null default 0,
  cached_refunded_credits integer not null default 0,
  last_calculated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_wallets_currency_code_nonempty check (length(trim(currency_code)) > 0),
  constraint credit_wallets_cached_available_nonnegative check (cached_available_credits >= 0),
  constraint credit_wallets_cached_reserved_nonnegative check (cached_reserved_credits >= 0),
  constraint credit_wallets_cached_spent_nonnegative check (cached_spent_credits >= 0),
  constraint credit_wallets_cached_refunded_nonnegative check (cached_refunded_credits >= 0)
);

comment on table public.credit_wallets is
'Credit wallet container for Reedit Credits. Cached balances are convenience fields; grants and ledger entries are the source of truth.';
comment on column public.credit_wallets.cached_available_credits is
'Cached available Reedit Credits for fast UI reads. Backend reconciliation should derive source-of-truth balances from grants, reservations, and ledger entries.';
comment on column public.credit_wallets.cached_reserved_credits is
'Cached credits currently reserved after user approval and before later generation/render spend.';
comment on column public.credit_wallets.cached_spent_credits is
'Cached credits converted from reserved to spent after successful generation, rendering, editing, or export work.';
comment on column public.credit_wallets.cached_refunded_credits is
'Cached credits returned to the wallet after approved refund events, including ReeditPro-caused generation failures.';

create table public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  source_type public.credit_source_type not null,
  status public.credit_grant_status not null default 'active',
  original_amount integer not null,
  remaining_amount integer not null,
  retail_value_cents integer,
  purchase_amount_cents integer,
  billing_provider text,
  billing_payment_id text,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  grant_reason text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_grants_original_amount_positive check (original_amount > 0),
  constraint credit_grants_remaining_amount_nonnegative check (remaining_amount >= 0),
  constraint credit_grants_remaining_amount_lte_original check (remaining_amount <= original_amount),
  constraint credit_grants_retail_value_nonnegative check (retail_value_cents is null or retail_value_cents >= 0),
  constraint credit_grants_purchase_amount_nonnegative check (purchase_amount_cents is null or purchase_amount_cents >= 0)
);

comment on table public.credit_grants is
'Separate Reedit Credit buckets for weekly bonus, purchased, promotional, admin, and refund credits.';
comment on column public.credit_grants.source_type is
'Credit source bucket. Weekly bonus, purchased, promotional, admin, and refund credits stay separate for policy, reporting, and future reconciliation.';
comment on column public.credit_grants.remaining_amount is
'Remaining credits in this grant bucket. Purchased credits and weekly bonus credits should be consumed and expired according to future policy.';

create table public.credit_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
  credit_grant_id uuid references public.credit_grants(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  entry_type public.credit_ledger_entry_type not null,
  amount integer not null,
  balance_after integer,
  related_project_id uuid references public.projects(id) on delete set null,
  related_edit_plan_id uuid references public.edit_plans(id) on delete set null,
  related_reservation_id uuid,
  related_estimate_id uuid,
  related_chat_message_id uuid references public.chat_messages(id) on delete set null,
  related_chat_action_id uuid references public.chat_actions(id) on delete set null,
  idempotency_key text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_ledger_entries_amount_nonzero check (amount <> 0)
);

comment on table public.credit_ledger_entries is
'Append-style ledger of all Reedit Credit movements. Credits should be reserved after user approval and spent only after successful generation/rendering.';
comment on column public.credit_ledger_entries.entry_type is
'The immutable ledger movement type, such as weekly bonus grant, purchase, reservation, spend, release, refund, or failed generation refund.';
comment on column public.credit_ledger_entries.amount is
'Signed credit movement amount. Future backend services should append corrections or refunds rather than editing old ledger entries.';
comment on column public.credit_ledger_entries.balance_after is
'Optional cached balance after this movement for audit/debugging. The ledger entry itself remains the durable movement record.';

create table public.credit_estimates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  inline_chat_card_id uuid references public.inline_chat_cards(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  status public.credit_estimate_status not null default 'draft',
  total_estimated_credits integer not null default 0,
  minimum_estimated_credits integer,
  maximum_estimated_credits integer,
  available_credits_snapshot integer,
  reserved_credits_snapshot integer,
  purchased_credits_snapshot integer,
  weekly_bonus_credits_snapshot integer,
  estimate_reason text,
  estimate_payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  shown_to_user_at timestamptz,
  approved_at timestamptz,
  created_by_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_estimates_total_nonnegative check (total_estimated_credits >= 0),
  constraint credit_estimates_minimum_nonnegative check (minimum_estimated_credits is null or minimum_estimated_credits >= 0),
  constraint credit_estimates_maximum_nonnegative check (maximum_estimated_credits is null or maximum_estimated_credits >= 0),
  constraint credit_estimates_maximum_gte_minimum check (
    maximum_estimated_credits is null
    or minimum_estimated_credits is null
    or maximum_estimated_credits >= minimum_estimated_credits
  )
);

comment on table public.credit_estimates is
'Credit estimate shown to the user before expensive ReeditPro generation, rendering, or editing can begin.';
comment on column public.credit_estimates.status is
'Estimate lifecycle. A generation path must not proceed until the estimate is shown, approved, and backed by a credit approval/reservation.';
comment on column public.credit_estimates.estimate_payload is
'Structured estimate metadata for future backend services. Detailed user-visible cost lines are stored in credit_estimate_line_items.';

create table public.credit_estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  line_item_type public.credit_estimate_line_item_type not null,
  usage_category public.credit_usage_category not null default 'other',
  label text not null,
  description text,
  estimated_credits integer not null default 0,
  is_optional boolean not null default false,
  is_premium boolean not null default false,
  requires_user_approval boolean not null default false,
  provider_hint text,
  model_hint text,
  line_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_estimate_line_items_estimated_nonnegative check (estimated_credits >= 0)
);

comment on table public.credit_estimate_line_items is
'Itemized credit estimate lines for captions, cleanup, Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, rendering, revisions, and other usage.';
comment on column public.credit_estimate_line_items.requires_user_approval is
'Marks line items, especially premium or optional generation like Real Motion, that need explicit user approval before reservation/generation.';

create table public.credit_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  chat_action_id uuid references public.chat_actions(id) on delete set null,
  inline_chat_card_id uuid references public.inline_chat_cards(id) on delete set null,
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  status public.credit_approval_status not null default 'pending',
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz,
  approval_note text,
  approval_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.credit_approvals is
'User approval or rejection of a credit estimate inside the chat-native editor before credit reservation and later generation.';
comment on column public.credit_approvals.status is
'Approval state for the estimate. Credits should only be reserved from approved credit approvals.';

create table public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete cascade,
  credit_approval_id uuid references public.credit_approvals(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
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
  updated_at timestamptz not null default now(),
  constraint credit_reservations_reserved_nonnegative check (reserved_credits >= 0),
  constraint credit_reservations_spent_nonnegative check (spent_credits >= 0),
  constraint credit_reservations_released_nonnegative check (released_credits >= 0),
  constraint credit_reservations_refunded_nonnegative check (refunded_credits >= 0),
  constraint credit_reservations_usage_lte_reserved check (
    spent_credits + released_credits + refunded_credits <= reserved_credits
  )
);

comment on table public.credit_reservations is
'Credits reserved after the user approves the edit plan and credit estimate. Later generation should only start after an active reservation exists.';
comment on column public.credit_reservations.status is
'Reservation lifecycle from draft to reserved, spent, released, refunded, cancelled, expired, or failed.';
comment on column public.credit_reservations.credit_approval_id is
'Approval record that authorized this reservation. Future backend services should require approval before moving to reserved.';

create table public.credit_reservation_line_items (
  id uuid primary key default gen_random_uuid(),
  credit_reservation_id uuid not null references public.credit_reservations(id) on delete cascade,
  credit_estimate_line_item_id uuid references public.credit_estimate_line_items(id) on delete set null,
  credit_grant_id uuid references public.credit_grants(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  usage_category public.credit_usage_category not null default 'other',
  reserved_credits integer not null default 0,
  spent_credits integer not null default 0,
  released_credits integer not null default 0,
  refunded_credits integer not null default 0,
  line_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_reservation_line_items_reserved_nonnegative check (reserved_credits >= 0),
  constraint credit_reservation_line_items_spent_nonnegative check (spent_credits >= 0),
  constraint credit_reservation_line_items_released_nonnegative check (released_credits >= 0),
  constraint credit_reservation_line_items_refunded_nonnegative check (refunded_credits >= 0),
  constraint credit_reservation_line_items_usage_lte_reserved check (
    spent_credits + released_credits + refunded_credits <= reserved_credits
  )
);

comment on table public.credit_reservation_line_items is
'Line-level mapping from approved estimate items to reserved grant buckets, allowing weekly bonus and purchased credits to be consumed separately.';

create table public.credit_refunds (
  id uuid primary key default gen_random_uuid(),
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  status public.credit_refund_status not null default 'pending',
  refund_amount integer not null,
  refund_reason text not null,
  failure_caused_by_reeditpro boolean not null default false,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  completed_at timestamptz,
  ledger_entry_id uuid references public.credit_ledger_entries(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_refunds_refund_amount_positive check (refund_amount > 0)
);

comment on table public.credit_refunds is
'Refund records for returning reserved or spent credits, including ReeditPro-caused generation failures.';
comment on column public.credit_refunds.failure_caused_by_reeditpro is
'True when the refund is caused by a ReeditPro system failure rather than a normal user-requested paid revision.';
comment on column public.credit_refunds.ledger_entry_id is
'Ledger entry that completes the credit refund movement when the refund is approved and applied.';

alter table public.edit_plans
add column if not exists credit_estimate_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'edit_plans_credit_estimate_id_fkey'
      and conrelid = 'public.edit_plans'::regclass
  ) then
    alter table public.edit_plans
    add constraint edit_plans_credit_estimate_id_fkey
    foreign key (credit_estimate_id) references public.credit_estimates(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'credit_ledger_entries_related_reservation_id_fkey'
      and conrelid = 'public.credit_ledger_entries'::regclass
  ) then
    alter table public.credit_ledger_entries
    add constraint credit_ledger_entries_related_reservation_id_fkey
    foreign key (related_reservation_id) references public.credit_reservations(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'credit_ledger_entries_related_estimate_id_fkey'
      and conrelid = 'public.credit_ledger_entries'::regclass
  ) then
    alter table public.credit_ledger_entries
    add constraint credit_ledger_entries_related_estimate_id_fkey
    foreign key (related_estimate_id) references public.credit_estimates(id) on delete set null;
  end if;
end $$;

create index credit_wallets_workspace_id_idx on public.credit_wallets (workspace_id);
create index credit_wallets_user_id_idx on public.credit_wallets (user_id);
create index credit_wallets_wallet_type_idx on public.credit_wallets (wallet_type);
create unique index credit_wallets_default_workspace_wallet_uidx
on public.credit_wallets (workspace_id)
where user_id is null;
create unique index credit_wallets_user_workspace_uidx
on public.credit_wallets (workspace_id, user_id)
where user_id is not null;

create index credit_grants_wallet_id_idx on public.credit_grants (credit_wallet_id);
create index credit_grants_workspace_id_idx on public.credit_grants (workspace_id);
create index credit_grants_user_id_idx on public.credit_grants (user_id);
create index credit_grants_source_type_idx on public.credit_grants (source_type);
create index credit_grants_status_idx on public.credit_grants (status);
create index credit_grants_expires_at_idx on public.credit_grants (expires_at);
create index credit_grants_subscription_id_idx on public.credit_grants (subscription_id);
create index credit_grants_billing_payment_id_idx on public.credit_grants (billing_payment_id);

create index credit_ledger_entries_wallet_id_idx on public.credit_ledger_entries (credit_wallet_id);
create index credit_ledger_entries_grant_id_idx on public.credit_ledger_entries (credit_grant_id);
create index credit_ledger_entries_workspace_id_idx on public.credit_ledger_entries (workspace_id);
create index credit_ledger_entries_user_id_idx on public.credit_ledger_entries (user_id);
create index credit_ledger_entries_entry_type_idx on public.credit_ledger_entries (entry_type);
create index credit_ledger_entries_related_project_id_idx on public.credit_ledger_entries (related_project_id);
create index credit_ledger_entries_related_edit_plan_id_idx on public.credit_ledger_entries (related_edit_plan_id);
create index credit_ledger_entries_related_reservation_id_idx on public.credit_ledger_entries (related_reservation_id);
create index credit_ledger_entries_related_estimate_id_idx on public.credit_ledger_entries (related_estimate_id);
create index credit_ledger_entries_created_at_idx on public.credit_ledger_entries (created_at);
create unique index credit_ledger_entries_idempotency_key_uidx
on public.credit_ledger_entries (idempotency_key)
where idempotency_key is not null;

create index credit_estimates_workspace_id_idx on public.credit_estimates (workspace_id);
create index credit_estimates_project_id_idx on public.credit_estimates (project_id);
create index credit_estimates_chat_session_id_idx on public.credit_estimates (chat_session_id);
create index credit_estimates_edit_plan_id_idx on public.credit_estimates (edit_plan_id);
create index credit_estimates_status_idx on public.credit_estimates (status);
create index credit_estimates_expires_at_idx on public.credit_estimates (expires_at);
create index credit_estimates_shown_to_user_at_idx on public.credit_estimates (shown_to_user_at);
create index credit_estimates_approved_at_idx on public.credit_estimates (approved_at);

create index credit_estimate_line_items_estimate_id_idx on public.credit_estimate_line_items (credit_estimate_id);
create index credit_estimate_line_items_workspace_id_idx on public.credit_estimate_line_items (workspace_id);
create index credit_estimate_line_items_project_id_idx on public.credit_estimate_line_items (project_id);
create index credit_estimate_line_items_edit_plan_id_idx on public.credit_estimate_line_items (edit_plan_id);
create index credit_estimate_line_items_segment_id_idx on public.credit_estimate_line_items (edit_plan_segment_id);
create index credit_estimate_line_items_signature_route_id_idx on public.credit_estimate_line_items (signature_route_id);
create index credit_estimate_line_items_line_item_type_idx on public.credit_estimate_line_items (line_item_type);
create index credit_estimate_line_items_usage_category_idx on public.credit_estimate_line_items (usage_category);
create index credit_estimate_line_items_is_optional_idx on public.credit_estimate_line_items (is_optional);
create index credit_estimate_line_items_is_premium_idx on public.credit_estimate_line_items (is_premium);
create index credit_estimate_line_items_requires_user_approval_idx on public.credit_estimate_line_items (requires_user_approval);

create index credit_approvals_workspace_id_idx on public.credit_approvals (workspace_id);
create index credit_approvals_project_id_idx on public.credit_approvals (project_id);
create index credit_approvals_chat_session_id_idx on public.credit_approvals (chat_session_id);
create index credit_approvals_estimate_id_idx on public.credit_approvals (credit_estimate_id);
create index credit_approvals_edit_plan_id_idx on public.credit_approvals (edit_plan_id);
create index credit_approvals_status_idx on public.credit_approvals (status);
create index credit_approvals_approved_by_idx on public.credit_approvals (approved_by);
create index credit_approvals_approved_at_idx on public.credit_approvals (approved_at);

create index credit_reservations_wallet_id_idx on public.credit_reservations (credit_wallet_id);
create index credit_reservations_workspace_id_idx on public.credit_reservations (workspace_id);
create index credit_reservations_project_id_idx on public.credit_reservations (project_id);
create index credit_reservations_estimate_id_idx on public.credit_reservations (credit_estimate_id);
create index credit_reservations_approval_id_idx on public.credit_reservations (credit_approval_id);
create index credit_reservations_edit_plan_id_idx on public.credit_reservations (edit_plan_id);
create index credit_reservations_status_idx on public.credit_reservations (status);
create index credit_reservations_reserved_at_idx on public.credit_reservations (reserved_at);
create index credit_reservations_expires_at_idx on public.credit_reservations (expires_at);
create unique index credit_reservations_idempotency_key_uidx
on public.credit_reservations (idempotency_key)
where idempotency_key is not null;

create index credit_reservation_line_items_reservation_id_idx on public.credit_reservation_line_items (credit_reservation_id);
create index credit_reservation_line_items_estimate_line_item_id_idx on public.credit_reservation_line_items (credit_estimate_line_item_id);
create index credit_reservation_line_items_credit_grant_id_idx on public.credit_reservation_line_items (credit_grant_id);
create index credit_reservation_line_items_workspace_id_idx on public.credit_reservation_line_items (workspace_id);
create index credit_reservation_line_items_project_id_idx on public.credit_reservation_line_items (project_id);
create index credit_reservation_line_items_usage_category_idx on public.credit_reservation_line_items (usage_category);

create index credit_refunds_wallet_id_idx on public.credit_refunds (credit_wallet_id);
create index credit_refunds_workspace_id_idx on public.credit_refunds (workspace_id);
create index credit_refunds_project_id_idx on public.credit_refunds (project_id);
create index credit_refunds_reservation_id_idx on public.credit_refunds (credit_reservation_id);
create index credit_refunds_estimate_id_idx on public.credit_refunds (credit_estimate_id);
create index credit_refunds_edit_plan_id_idx on public.credit_refunds (edit_plan_id);
create index credit_refunds_status_idx on public.credit_refunds (status);
create index credit_refunds_failure_caused_by_reeditpro_idx on public.credit_refunds (failure_caused_by_reeditpro);
create index credit_refunds_completed_at_idx on public.credit_refunds (completed_at);

create trigger credit_wallets_set_updated_at
before update on public.credit_wallets
for each row execute function public.set_updated_at();

create trigger credit_grants_set_updated_at
before update on public.credit_grants
for each row execute function public.set_updated_at();

create trigger credit_estimates_set_updated_at
before update on public.credit_estimates
for each row execute function public.set_updated_at();

create trigger credit_approvals_set_updated_at
before update on public.credit_approvals
for each row execute function public.set_updated_at();

create trigger credit_reservations_set_updated_at
before update on public.credit_reservations
for each row execute function public.set_updated_at();

create trigger credit_reservation_line_items_set_updated_at
before update on public.credit_reservation_line_items
for each row execute function public.set_updated_at();

create trigger credit_refunds_set_updated_at
before update on public.credit_refunds
for each row execute function public.set_updated_at();

create or replace view public.credit_wallet_balance_view
with (security_invoker = true)
as
select
  cw.id as credit_wallet_id,
  cw.workspace_id,
  cw.user_id,
  cw.wallet_type,
  cw.cached_available_credits,
  cw.cached_reserved_credits,
  cw.cached_spent_credits,
  cw.cached_refunded_credits,
  cw.last_calculated_at
from public.credit_wallets cw;

comment on view public.credit_wallet_balance_view is
'Simple wallet balance view over cached balance fields. Backend services should reconcile these cached fields from grants, reservations, and ledger entries later.';

create or replace function public.can_start_generation(target_edit_plan_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.edit_plans ep
    join public.credit_estimates ce
      on ce.id = ep.credit_estimate_id
      and ce.status = 'approved'
    join public.credit_approvals ca
      on ca.credit_estimate_id = ce.id
      and ca.status = 'approved'
    join public.credit_reservations cr
      on cr.credit_estimate_id = ce.id
      and cr.status = 'reserved'
      and (cr.expires_at is null or cr.expires_at > now())
    where ep.id = target_edit_plan_id
      and ep.status = 'approved'
      and (ca.edit_plan_id is null or ca.edit_plan_id = ep.id)
      and (cr.edit_plan_id is null or cr.edit_plan_id = ep.id)
  );
$$;

comment on function public.can_start_generation(uuid) is
'Read-only helper for future workers: generation may start only when an edit plan is approved, the credit estimate is approved, credit approval exists, and credits are reserved.';

alter table public.credit_wallets enable row level security;
alter table public.credit_grants enable row level security;
alter table public.credit_ledger_entries enable row level security;
alter table public.credit_estimates enable row level security;
alter table public.credit_estimate_line_items enable row level security;
alter table public.credit_approvals enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.credit_reservation_line_items enable row level security;
alter table public.credit_refunds enable row level security;

create policy credit_wallets_select_member
on public.credit_wallets for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_wallets_insert_owner_admin
on public.credit_wallets for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_wallets_update_owner_admin
on public.credit_wallets for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_grants_select_member
on public.credit_grants for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_grants_insert_owner_admin
on public.credit_grants for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_grants_update_owner_admin
on public.credit_grants for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_ledger_entries_select_member
on public.credit_ledger_entries for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_ledger_entries_insert_owner_admin
on public.credit_ledger_entries for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_estimates_select_member
on public.credit_estimates for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_estimates_insert_editor
on public.credit_estimates for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy credit_estimates_update_editor
on public.credit_estimates for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy credit_estimate_line_items_select_member
on public.credit_estimate_line_items for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_estimate_line_items_insert_editor
on public.credit_estimate_line_items for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy credit_estimate_line_items_update_editor
on public.credit_estimate_line_items for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy credit_approvals_select_member
on public.credit_approvals for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_approvals_insert_editor
on public.credit_approvals for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy credit_approvals_update_editor
on public.credit_approvals for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy credit_reservations_select_member
on public.credit_reservations for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_reservations_insert_owner_admin
on public.credit_reservations for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_reservations_update_owner_admin
on public.credit_reservations for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_reservation_line_items_select_member
on public.credit_reservation_line_items for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_reservation_line_items_insert_owner_admin
on public.credit_reservation_line_items for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_reservation_line_items_update_owner_admin
on public.credit_reservation_line_items for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_refunds_select_member
on public.credit_refunds for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy credit_refunds_insert_owner_admin
on public.credit_refunds for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy credit_refunds_update_owner_admin
on public.credit_refunds for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

grant usage on type public.credit_wallet_type to authenticated, service_role;
grant usage on type public.credit_source_type to authenticated, service_role;
grant usage on type public.credit_grant_status to authenticated, service_role;
grant usage on type public.credit_ledger_entry_type to authenticated, service_role;
grant usage on type public.credit_reservation_status to authenticated, service_role;
grant usage on type public.credit_estimate_status to authenticated, service_role;
grant usage on type public.credit_estimate_line_item_type to authenticated, service_role;
grant usage on type public.credit_approval_status to authenticated, service_role;
grant usage on type public.credit_refund_status to authenticated, service_role;
grant usage on type public.credit_usage_category to authenticated, service_role;

revoke all on table public.credit_wallets from anon;
revoke all on table public.credit_grants from anon;
revoke all on table public.credit_ledger_entries from anon;
revoke all on table public.credit_estimates from anon;
revoke all on table public.credit_estimate_line_items from anon;
revoke all on table public.credit_approvals from anon;
revoke all on table public.credit_reservations from anon;
revoke all on table public.credit_reservation_line_items from anon;
revoke all on table public.credit_refunds from anon;
revoke all on table public.credit_wallet_balance_view from anon;

grant select on table public.credit_wallets to authenticated;
grant select on table public.credit_grants to authenticated;
grant select, insert on table public.credit_ledger_entries to authenticated;
grant select, insert, update on table public.credit_estimates to authenticated;
grant select, insert, update on table public.credit_estimate_line_items to authenticated;
grant select, insert, update on table public.credit_approvals to authenticated;
grant select on table public.credit_reservations to authenticated;
grant select on table public.credit_reservation_line_items to authenticated;
grant select on table public.credit_refunds to authenticated;
grant insert, update on table public.credit_wallets to authenticated;
grant insert, update on table public.credit_grants to authenticated;
grant insert, update on table public.credit_reservations to authenticated;
grant insert, update on table public.credit_reservation_line_items to authenticated;
grant insert, update on table public.credit_refunds to authenticated;
grant select on table public.credit_wallet_balance_view to authenticated;

grant select, insert, update, delete on table public.credit_wallets to service_role;
grant select, insert, update, delete on table public.credit_grants to service_role;
grant select, insert, update, delete on table public.credit_ledger_entries to service_role;
grant select, insert, update, delete on table public.credit_estimates to service_role;
grant select, insert, update, delete on table public.credit_estimate_line_items to service_role;
grant select, insert, update, delete on table public.credit_approvals to service_role;
grant select, insert, update, delete on table public.credit_reservations to service_role;
grant select, insert, update, delete on table public.credit_reservation_line_items to service_role;
grant select, insert, update, delete on table public.credit_refunds to service_role;
grant select on table public.credit_wallet_balance_view to service_role;

revoke execute on function public.can_start_generation(uuid) from anon;
grant execute on function public.can_start_generation(uuid) to authenticated, service_role;
