-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: credit estimates, approval records, and immutable approved plan snapshots.
-- Core rule: workers execute approved_plan_snapshots.snapshot_json, not raw chat.
-- Hardening note: normal users must not update/delete approved snapshots; future real migrations need reviewed RLS and trigger protection.

create table if not exists credit_estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete cascade,
  estimate_version integer not null,
  edit_level text,
  editing_category text,
  total_credits numeric not null default 0,
  fallback_allowance_credits numeric not null default 0,
  risk_level text,
  estimate_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

comment on table credit_estimates is 'Draft credit estimate table. Real reservation/ledger records are future append-only work, not implemented here.';

create table if not exists credit_estimate_items (
  id uuid primary key default gen_random_uuid(),
  credit_estimate_id uuid not null references credit_estimates(id) on delete cascade,
  label text not null,
  credits numeric not null default 0,
  reason text,
  category text,
  metadata_json jsonb not null default '{}'::jsonb
);

comment on table credit_estimate_items is 'Draft line-item credit estimate table for user-facing approval context.';

create table if not exists approval_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete cascade,
  credit_estimate_id uuid not null references credit_estimates(id) on delete restrict,
  approval_type text not null,
  approved_by uuid not null,
  approved_at timestamptz not null default now(),
  approved_snapshot_id uuid,
  approved_snapshot_summary_json jsonb not null default '{}'::jsonb,
  audit_metadata_json jsonb not null default '{}'::jsonb
);

comment on table approval_records is 'Draft approval table linking exact plan version and credit estimate to the approved snapshot.';
comment on column approval_records.approved_snapshot_id is 'Draft forward reference to approved_plan_snapshots; add reviewed FK after table creation order is finalized.';
comment on column approval_records.audit_metadata_json is 'Draft approval audit metadata. Future real migration should preserve plan, credit estimate, and snapshot linkage for review.';

create table if not exists approved_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete restrict,
  credit_estimate_id uuid not null references credit_estimates(id) on delete restrict,
  approved_by uuid not null,
  approved_at timestamptz not null default now(),
  snapshot_version text not null default 'v1',
  snapshot_json jsonb not null,
  immutable boolean not null default true,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

comment on table approved_plan_snapshots is 'Draft immutable approved plan snapshot table. This is the future worker execution contract.';
comment on column approved_plan_snapshots.snapshot_json is 'Full approved plan snapshot JSONB. Workers execute this field, not raw chat or mutable current plan state.';
comment on column approved_plan_snapshots.immutable is 'Draft immutability marker. Real migration must add reviewed trigger/policy protection.';
comment on column approved_plan_snapshots.status is 'Draft status field only. Normal users should not use status changes to mutate approved snapshot content.';

-- Draft immutability template only. Do not run until reviewed:
-- Normal users should not update or delete approved_plan_snapshots.
-- Backend/service role inserts snapshots only after user plan and credit approval.
-- A real migration should pair RLS deny policies with a trigger that blocks update/delete when immutable = true.
-- create or replace function prevent_approved_snapshot_mutation()
-- returns trigger as $$
-- begin
--   if old.immutable then
--     raise exception 'approved_plan_snapshots are immutable once approved';
--   end if;
--   return new;
-- end;
-- $$ language plpgsql;
--
-- create trigger approved_plan_snapshots_prevent_update
-- before update or delete on approved_plan_snapshots
-- for each row execute function prevent_approved_snapshot_mutation();

create index if not exists idx_credit_estimates_project_plan on credit_estimates(project_id, edit_plan_version_id);
create index if not exists idx_credit_estimate_items_estimate on credit_estimate_items(credit_estimate_id);
create index if not exists idx_approval_records_project_plan on approval_records(project_id, edit_plan_version_id);
create index if not exists idx_approved_plan_snapshots_project_plan on approved_plan_snapshots(project_id, edit_plan_version_id);
create index if not exists idx_approved_plan_snapshots_status on approved_plan_snapshots(status);
