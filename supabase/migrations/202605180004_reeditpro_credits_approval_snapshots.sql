-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create table if not exists public.credit_estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete cascade,
  estimate_version integer not null default 1,
  edit_level text,
  editing_category text,
  total_credits numeric not null default 0,
  fallback_allowance_credits numeric not null default 0,
  risk_level text,
  estimate_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.credit_estimate_items (
  id uuid primary key default gen_random_uuid(),
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete cascade,
  label text not null,
  credits numeric not null default 0,
  reason text,
  category text,
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  approved_plan_snapshot_id uuid,
  reserved_credits numeric not null default 0,
  status text not null default 'planned',
  expires_at timestamptz,
  released_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  approved_plan_snapshot_id uuid,
  entry_type text not null,
  credits_delta numeric not null,
  reason text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.refund_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  credit_ledger_entry_id uuid references public.credit_ledger_entries(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  refund_credits numeric not null default 0,
  reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  edit_plan_version_id uuid not null references public.edit_plan_versions(id) on delete restrict,
  credit_estimate_id uuid references public.credit_estimates(id) on delete restrict,
  approval_type text not null,
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  approved_snapshot_id uuid,
  approved_snapshot_summary_json jsonb not null default '{}'::jsonb,
  audit_metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists public.approved_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  edit_plan_version_id uuid not null references public.edit_plan_versions(id) on delete restrict,
  credit_estimate_id uuid references public.credit_estimates(id) on delete restrict,
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  snapshot_version text not null default 'v1',
  snapshot_json jsonb not null,
  immutable boolean not null default true,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

comment on table public.approved_plan_snapshots is 'Immutable worker execution contract. Workers execute snapshot_json, not raw chat or mutable current plan state.';
comment on table public.approval_records is 'Approval links the exact plan version, credit estimate, and approved snapshot.';
comment on table public.credit_reservations is 'Future credit reservation planning table. Real reservation logic remains backend/service controlled.';
comment on table public.credit_ledger_entries is 'Append-only future credit ledger. Normal users must not update or delete ledger entries.';
comment on column public.approved_plan_snapshots.snapshot_json is 'Frozen approved EditPlan JSONB, including tier constraints, provider routes, fallback rules, QA, and tool notes.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credit_reservations_approved_plan_snapshot_id_fkey') then
    alter table public.credit_reservations
      add constraint credit_reservations_approved_plan_snapshot_id_fkey
      foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'credit_ledger_entries_approved_plan_snapshot_id_fkey') then
    alter table public.credit_ledger_entries
      add constraint credit_ledger_entries_approved_plan_snapshot_id_fkey
      foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'approval_records_approved_snapshot_id_fkey') then
    alter table public.approval_records
      add constraint approval_records_approved_snapshot_id_fkey
      foreign key (approved_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
  end if;
end $$;

create or replace function public.prevent_immutable_approved_snapshot_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.immutable = true then
    raise exception 'approved_plan_snapshots rows with immutable=true cannot be updated or deleted';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_credit_ledger_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'credit_ledger_entries are append-only and cannot be updated or deleted';
end;
$$;

drop trigger if exists prevent_immutable_approved_snapshot_update on public.approved_plan_snapshots;
create trigger prevent_immutable_approved_snapshot_update before update on public.approved_plan_snapshots
for each row execute function public.prevent_immutable_approved_snapshot_change();

drop trigger if exists prevent_immutable_approved_snapshot_delete on public.approved_plan_snapshots;
create trigger prevent_immutable_approved_snapshot_delete before delete on public.approved_plan_snapshots
for each row execute function public.prevent_immutable_approved_snapshot_change();

drop trigger if exists prevent_credit_ledger_update on public.credit_ledger_entries;
create trigger prevent_credit_ledger_update before update on public.credit_ledger_entries
for each row execute function public.prevent_credit_ledger_mutation();

drop trigger if exists prevent_credit_ledger_delete on public.credit_ledger_entries;
create trigger prevent_credit_ledger_delete before delete on public.credit_ledger_entries
for each row execute function public.prevent_credit_ledger_mutation();

drop trigger if exists set_credit_reservations_updated_at on public.credit_reservations;
create trigger set_credit_reservations_updated_at before update on public.credit_reservations
for each row execute function public.set_updated_at();

create index if not exists idx_credit_estimates_project_plan on public.credit_estimates(project_id, edit_plan_version_id);
create index if not exists idx_credit_estimate_items_estimate on public.credit_estimate_items(credit_estimate_id);
create index if not exists idx_credit_reservations_workspace_project_status on public.credit_reservations(workspace_id, project_id, status);
create index if not exists idx_credit_ledger_workspace_created on public.credit_ledger_entries(workspace_id, created_at);
create index if not exists idx_approval_records_project_plan on public.approval_records(project_id, edit_plan_version_id);
create index if not exists idx_approved_snapshots_project_plan on public.approved_plan_snapshots(project_id, edit_plan_version_id);
create index if not exists idx_approved_snapshots_status on public.approved_plan_snapshots(status);
