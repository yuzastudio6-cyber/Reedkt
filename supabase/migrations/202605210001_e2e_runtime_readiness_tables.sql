-- RP-E2E-READY-01 runtime readiness tables.
-- Local/review-ready migration only. Do not run against production until local/staging
-- validation, RLS review, backups, rollback, and explicit approval are complete.
--
-- This migration does not connect to remote Supabase, deploy Google Cloud,
-- call providers, integrate Stripe, render media, execute workers, or add secrets.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Staging compatibility: some databases have the RP-E2E base tables but are
-- missing the earlier workspace/project RLS helper functions. Define the
-- helpers here so the runtime policies below can be created safely.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and public.is_workspace_member(p.workspace_id)
  );
$$;

create or replace function public.is_project_editor(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = auth.uid()
      and wm.role::text in ('owner', 'admin', 'editor')
  );
$$;

comment on function public.is_workspace_member(uuid) is
'SECURITY DEFINER RLS helper. Added here as a staging-safe dependency bridge for RP-E2E runtime policies.';
comment on function public.is_project_member(uuid) is
'SECURITY DEFINER RLS helper. Project access is workspace-membership scoped.';
comment on function public.is_project_editor(uuid) is
'SECURITY DEFINER RLS helper. Editor access is workspace role scoped.';

do $$
begin
  if to_regprocedure('public.can_run_job(uuid)') is null then
    execute $function$
      create function public.can_run_job(target_job_id uuid)
      returns boolean
      language sql
      stable
      as $body$
        select exists (
          select 1
          from public.jobs j
          where j.id = target_job_id
            and j.status::text in ('queued', 'retrying')
        );
      $body$;
    $function$;

    comment on function public.can_run_job(uuid) is
    'RP-E2E staging compatibility fallback. Checks basic queued/retrying job claimability when the earlier job helper migration is absent.';
  end if;
end $$;

-- Extend the existing RP-DATA-04 approved_plan_snapshots table in place.
-- Workers must execute this frozen snapshot contract instead of raw chat.
alter table public.approved_plan_snapshots
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists chat_session_id uuid references public.chat_sessions(id) on delete set null,
  add column if not exists edit_plan_id uuid references public.edit_plans(id) on delete restrict,
  add column if not exists edit_session_id uuid,
  add column if not exists edit_plan_version_id uuid,
  add column if not exists credit_approval_id uuid references public.credit_approvals(id) on delete restrict,
  add column if not exists credit_reservation_id uuid references public.credit_reservations(id) on delete restrict,
  add column if not exists approved_by_user_id uuid references auth.users(id) on delete restrict,
  add column if not exists snapshot_status text not null default 'approved'
    check (snapshot_status in ('draft', 'approved', 'locked', 'superseded', 'cancelled', 'failed')),
  add column if not exists status text not null default 'approved',
  add column if not exists snapshot_json jsonb not null default '{}'::jsonb,
  add column if not exists snapshot_payload jsonb not null default '{}'::jsonb,
  add column if not exists snapshot_hash text not null default md5('{}'),
  add column if not exists plan_hash text,
  add column if not exists credit_hash text,
  add column if not exists source_sequence_hash text,
  add column if not exists timing_hash text,
  add column if not exists immutable boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- Compatibility bridge for staging schemas that already have approved_plan_snapshots
-- with snapshot_payload/snapshot_hash columns but not the Prompt 7-9 snapshot_json
-- contract. This preserves existing data and aliases both shapes for the E2E RPCs.
do $$
declare
  v_has_immutable_snapshot_trigger boolean;
begin
  select exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.approved_plan_snapshots'::regclass
      and tgname = 'prevent_immutable_approved_snapshot_update'
      and not tgisinternal
  )
  into v_has_immutable_snapshot_trigger;

  if v_has_immutable_snapshot_trigger then
    -- Older local schemas may protect existing immutable snapshots from update.
    -- The compatibility columns have safe defaults, so leave existing rows intact.
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'approved_plan_snapshots'
      and column_name = 'snapshot_payload'
  ) then
    update public.approved_plan_snapshots
    set snapshot_json = snapshot_payload
    where snapshot_json = '{}'::jsonb
      and snapshot_payload is not null
      and snapshot_payload <> '{}'::jsonb;
  end if;

  update public.approved_plan_snapshots
  set snapshot_payload = snapshot_json
  where snapshot_payload = '{}'::jsonb
    and snapshot_json is not null
    and snapshot_json <> '{}'::jsonb;

  update public.approved_plan_snapshots
  set snapshot_hash = md5(coalesce(snapshot_json, '{}'::jsonb)::text)
  where snapshot_hash is null
    or snapshot_hash = ''
    or (snapshot_hash = md5('{}') and snapshot_json <> '{}'::jsonb);

  update public.approved_plan_snapshots
  set plan_hash = coalesce(plan_hash, nullif(snapshot_hash, ''))
  where plan_hash is null;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'approved_plan_snapshots'
      and column_name = 'approved_by'
  ) then
    update public.approved_plan_snapshots
    set approved_by_user_id = approved_by
    where approved_by_user_id is null
      and approved_by is not null;
  end if;
end $$;

comment on table public.approved_plan_snapshots is
'Immutable frozen execution contract after user approves edit plan and credit estimate. Future workers execute this snapshot, not raw chat or mutable plan state.';
comment on column public.approved_plan_snapshots.snapshot_json is
'Frozen approved execution contract. Must not contain secrets, service-role keys, provider API keys, signed URLs, or raw chat-only worker instructions.';
comment on column public.approved_plan_snapshots.plan_hash is
'Hash of the approved plan content used by future backend code for tamper/idempotency checks.';
comment on column public.approved_plan_snapshots.credit_hash is
'Hash of the approved credit estimate/reservation content used by future backend code for tamper/idempotency checks.';
comment on column public.approved_plan_snapshots.source_sequence_hash is
'Hash of approved source sequence ordering. Workers must not reinterpret uploaded order from raw chat.';
comment on column public.approved_plan_snapshots.timing_hash is
'Hash of approved timing plan content. Workers must execute approved timing rather than infer timing again.';

create table if not exists public.api_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_method text not null,
  request_path text not null,
  request_hash text not null,
  response_status integer check (response_status is null or (response_status >= 100 and response_status <= 599)),
  response_record_table text,
  response_record_id uuid,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, idempotency_key)
);

comment on table public.api_idempotency_keys is
'Prevents duplicate backend API writes, credit reservations, job creation, provider requests, render jobs, and export requests.';
comment on column public.api_idempotency_keys.request_hash is
'Future backend code must treat the same idempotency key with a different request hash as a conflict.';

create table if not exists public.upload_intents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  requested_by_user_id uuid not null references auth.users(id) on delete restrict,
  upload_purpose text not null
    check (upload_purpose in ('source_media', 'reference_media', 'generated_asset', 'preview_render', 'final_export', 'thumbnail', 'audio_asset', 'profile_asset', 'brand_asset', 'qa_artifact', 'worker_temp')),
  target_bucket text not null,
  target_path text not null,
  original_file_name text not null,
  mime_type text not null,
  expected_size_bytes bigint check (expected_size_bytes is null or expected_size_bytes >= 0),
  checksum_sha256 text,
  status text not null default 'planned'
    check (status in ('planned', 'signed', 'uploading', 'uploaded', 'finalized', 'expired', 'cancelled', 'failed')),
  expires_at timestamptz not null,
  finalized_at timestamptz,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.upload_intents is
'Controlled upload records created before source clips become canonical media assets. Signed URLs are temporary and are not stored here.';
comment on column public.upload_intents.target_path is
'Canonical bucket object path only. Do not store signed URLs as canonical media truth.';

create table if not exists public.storage_object_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  render_id uuid references public.renders(id) on delete set null,
  qa_report_id uuid references public.qa_reports(id) on delete set null,
  upload_intent_id uuid references public.upload_intents(id) on delete set null,
  bucket_name text not null,
  object_path text not null,
  object_purpose text not null
    check (object_purpose in ('source_media', 'reference_media', 'generated_asset', 'processed_media', 'preview_render', 'final_export', 'thumbnail', 'qa_artifact', 'worker_temp', 'audio_asset', 'caption_asset', 'other')),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  region text not null default 'us-east1'
    check (region in ('us-east1', 'europe-west1')),
  status text not null default 'planned'
    check (status in ('planned', 'uploading', 'ready', 'processing', 'archived', 'deleted', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

comment on table public.storage_object_records is
'Canonical storage records for source media, generated assets, previews, exports, thumbnails, QA artifacts, and worker temp files. Store bucket and object path only.';
comment on column public.storage_object_records.object_path is
'Canonical object path. Signed URLs must remain temporary delivery artifacts and must not be stored here.';

create table if not exists public.signed_url_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  storage_object_record_id uuid references public.storage_object_records(id) on delete set null,
  upload_intent_id uuid references public.upload_intents(id) on delete set null,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  url_purpose text not null
    check (url_purpose in ('upload', 'download', 'preview_review', 'thumbnail', 'qa_review', 'export_delivery', 'worker_read', 'worker_write')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb
);

comment on table public.signed_url_events is
'Audit of temporary upload/download URL generation. This table must never store the signed URL itself.';

create table if not exists public.worker_job_claims (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_type text not null,
  worker_instance_id text not null,
  claim_status text not null default 'active'
    check (claim_status in ('active', 'released', 'completed', 'failed', 'expired', 'cancelled')),
  claimed_at timestamptz not null default now(),
  heartbeat_at timestamptz,
  released_at timestamptz,
  lease_expires_at timestamptz not null,
  attempt_number integer not null default 1 check (attempt_number > 0),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.worker_job_claims is
'Runtime worker job claim table for preventing two workers from executing the same job at the same time. Future workers must claim before tool/provider/render work.';

create table if not exists public.tool_runtime_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  worker_type text not null,
  runtime_region text not null default 'us-east1'
    check (runtime_region in ('us-east1', 'europe-west1')),
  tool_name text not null
    check (tool_name in ('ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright')),
  tool_version text,
  check_status text not null default 'missing'
    check (check_status in ('passed', 'warning', 'failed', 'missing', 'blocked')),
  check_summary text not null,
  binary_path text,
  capabilities_json jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tool_runtime_checks is
'Worker tool readiness checks for actual editing tools. This records sanitized capability metadata only, not credentials or execution output.';

create table if not exists public.provider_request_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  credit_reservation_id uuid references public.credit_reservations(id) on delete restrict,
  provider_route text not null,
  provider_model text,
  attempt_status text not null default 'queued'
    check (attempt_status in ('queued', 'running', 'succeeded', 'failed', 'blocked', 'cancelled')),
  idempotency_key text not null,
  request_payload_hash text,
  normalized_error_code text,
  normalized_error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.provider_request_attempts is
'Sanitized provider gateway attempt records for future real provider calls. Do not store raw provider keys, provider secrets, signed URLs, or full unredacted provider payloads.';

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  provider_route text not null,
  provider_event_id text not null,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  event_status text not null default 'received'
    check (event_status in ('received', 'processed', 'ignored', 'failed', 'blocked')),
  signature_verified boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  event_payload_summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_route, provider_event_id)
);

comment on table public.provider_webhook_events is
'Sanitized provider webhook/checkback event summaries. Do not store raw webhook secrets or full unredacted provider payloads.';

create or replace function public.can_create_approved_plan_snapshot(
  target_edit_plan_id uuid,
  target_credit_estimate_id uuid,
  target_credit_reservation_id uuid
)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1
      from public.edit_plans ep
      where ep.id = target_edit_plan_id
        and ep.status::text = 'approved'
    )
    and exists (
      select 1
      from public.credit_estimates ce
      where ce.id = target_credit_estimate_id
        and ce.status::text in ('approved', 'accepted')
    )
    and exists (
      select 1
      from public.credit_reservations cr
      left join public.credit_approvals ca on ca.id = cr.credit_approval_id
      where cr.id = target_credit_reservation_id
        and cr.credit_estimate_id = target_credit_estimate_id
        and (cr.edit_plan_id is null or cr.edit_plan_id = target_edit_plan_id)
        and cr.status::text in ('reserved', 'active', 'partially_spent')
        and (cr.expires_at is null or cr.expires_at > now())
        and (cr.credit_approval_id is null or ca.status::text = 'approved')
    );
$$;

comment on function public.can_create_approved_plan_snapshot(uuid, uuid, uuid) is
'Readiness helper for future backend snapshot creation. Checks approved edit plan, approved credit estimate, and active/reserved credit reservation.';

create or replace function public.active_worker_claim_exists(target_job_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.worker_job_claims wjc
    where wjc.job_id = target_job_id
      and wjc.claim_status = 'active'
      and wjc.lease_expires_at > now()
  );
$$;

comment on function public.active_worker_claim_exists(uuid) is
'Returns true when a non-expired active runtime worker claim already exists for a job.';

create or replace function public.can_claim_worker_job(target_job_id uuid)
returns boolean
language sql
stable
as $$
  select public.can_run_job(target_job_id)
    and not public.active_worker_claim_exists(target_job_id);
$$;

comment on function public.can_claim_worker_job(uuid) is
'Future worker readiness helper. A worker can claim a job only when job gates pass and no active claim exists.';

create index if not exists approved_plan_snapshots_project_idx on public.approved_plan_snapshots(project_id);
create index if not exists approved_plan_snapshots_edit_plan_idx on public.approved_plan_snapshots(edit_plan_id);
create index if not exists approved_plan_snapshots_credit_estimate_idx on public.approved_plan_snapshots(credit_estimate_id);
create index if not exists approved_plan_snapshots_project_plan_credit_idx on public.approved_plan_snapshots(project_id, edit_plan_id, credit_estimate_id);

create index if not exists upload_intents_project_chat_status_idx on public.upload_intents(project_id, chat_session_id, status);
create index if not exists storage_object_records_project_purpose_status_idx on public.storage_object_records(project_id, object_purpose, status);
create index if not exists signed_url_events_storage_created_idx on public.signed_url_events(storage_object_record_id, created_at);
create index if not exists worker_job_claims_job_status_idx on public.worker_job_claims(job_id, claim_status);
create unique index if not exists worker_job_claims_active_job_uidx
on public.worker_job_claims(job_id)
where claim_status = 'active';
create index if not exists tool_runtime_checks_workspace_tool_idx on public.tool_runtime_checks(workspace_id, worker_type, runtime_region, tool_name);
create index if not exists provider_request_attempts_request_job_idempotency_idx on public.provider_request_attempts(generation_request_id, job_id, idempotency_key);
create index if not exists provider_request_attempts_workspace_status_idx on public.provider_request_attempts(workspace_id, attempt_status);
create index if not exists provider_webhook_events_route_event_idx on public.provider_webhook_events(provider_route, provider_event_id);

drop trigger if exists set_approved_plan_snapshots_updated_at on public.approved_plan_snapshots;
create trigger set_approved_plan_snapshots_updated_at before update on public.approved_plan_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists set_api_idempotency_keys_updated_at on public.api_idempotency_keys;
create trigger set_api_idempotency_keys_updated_at before update on public.api_idempotency_keys
for each row execute function public.set_updated_at();

drop trigger if exists set_upload_intents_updated_at on public.upload_intents;
create trigger set_upload_intents_updated_at before update on public.upload_intents
for each row execute function public.set_updated_at();

drop trigger if exists set_storage_object_records_updated_at on public.storage_object_records;
create trigger set_storage_object_records_updated_at before update on public.storage_object_records
for each row execute function public.set_updated_at();

drop trigger if exists set_worker_job_claims_updated_at on public.worker_job_claims;
create trigger set_worker_job_claims_updated_at before update on public.worker_job_claims
for each row execute function public.set_updated_at();

drop trigger if exists set_tool_runtime_checks_updated_at on public.tool_runtime_checks;
create trigger set_tool_runtime_checks_updated_at before update on public.tool_runtime_checks
for each row execute function public.set_updated_at();

drop trigger if exists set_provider_request_attempts_updated_at on public.provider_request_attempts;
create trigger set_provider_request_attempts_updated_at before update on public.provider_request_attempts
for each row execute function public.set_updated_at();

drop trigger if exists set_provider_webhook_events_updated_at on public.provider_webhook_events;
create trigger set_provider_webhook_events_updated_at before update on public.provider_webhook_events
for each row execute function public.set_updated_at();

alter table public.approved_plan_snapshots enable row level security;
alter table public.api_idempotency_keys enable row level security;
alter table public.upload_intents enable row level security;
alter table public.storage_object_records enable row level security;
alter table public.signed_url_events enable row level security;
alter table public.worker_job_claims enable row level security;
alter table public.tool_runtime_checks enable row level security;
alter table public.provider_request_attempts enable row level security;
alter table public.provider_webhook_events enable row level security;

drop policy if exists approved_plan_snapshots_select_member on public.approved_plan_snapshots;
create policy approved_plan_snapshots_select_member
on public.approved_plan_snapshots for select
to authenticated
using (
  (workspace_id is not null and public.is_workspace_member(workspace_id))
  or (project_id is not null and public.is_project_member(project_id))
);

drop policy if exists api_idempotency_keys_select_owner on public.api_idempotency_keys;
create policy api_idempotency_keys_select_owner
on public.api_idempotency_keys for select
to authenticated
using (user_id = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists upload_intents_select_member on public.upload_intents;
create policy upload_intents_select_member
on public.upload_intents for select
to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

drop policy if exists upload_intents_insert_editor on public.upload_intents;
create policy upload_intents_insert_editor
on public.upload_intents for insert
to authenticated
with check (
  requested_by_user_id = auth.uid()
  and public.is_workspace_member(workspace_id)
  and public.is_project_editor(project_id)
);

drop policy if exists storage_object_records_select_member on public.storage_object_records;
create policy storage_object_records_select_member
on public.storage_object_records for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (project_id is null or public.is_project_member(project_id))
);

drop policy if exists signed_url_events_select_member on public.signed_url_events;
create policy signed_url_events_select_member
on public.signed_url_events for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (project_id is null or public.is_project_member(project_id))
);

drop policy if exists worker_job_claims_select_member on public.worker_job_claims;
create policy worker_job_claims_select_member
on public.worker_job_claims for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (project_id is null or public.is_project_member(project_id))
);

drop policy if exists tool_runtime_checks_select_member on public.tool_runtime_checks;
create policy tool_runtime_checks_select_member
on public.tool_runtime_checks for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists provider_request_attempts_select_member on public.provider_request_attempts;
create policy provider_request_attempts_select_member
on public.provider_request_attempts for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (project_id is null or public.is_project_member(project_id))
);

drop policy if exists provider_webhook_events_select_member on public.provider_webhook_events;
create policy provider_webhook_events_select_member
on public.provider_webhook_events for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (project_id is null or public.is_project_member(project_id))
);

revoke all on table public.approved_plan_snapshots from public, anon;
revoke all on table public.api_idempotency_keys from public, anon;
revoke all on table public.upload_intents from public, anon;
revoke all on table public.storage_object_records from public, anon;
revoke all on table public.signed_url_events from public, anon;
revoke all on table public.worker_job_claims from public, anon;
revoke all on table public.tool_runtime_checks from public, anon;
revoke all on table public.provider_request_attempts from public, anon;
revoke all on table public.provider_webhook_events from public, anon;

grant select on table public.approved_plan_snapshots to authenticated;
grant select on table public.api_idempotency_keys to authenticated;
grant select, insert on table public.upload_intents to authenticated;
grant select on table public.storage_object_records to authenticated;
grant select on table public.signed_url_events to authenticated;
grant select on table public.worker_job_claims to authenticated;
grant select on table public.tool_runtime_checks to authenticated;
grant select on table public.provider_request_attempts to authenticated;
grant select on table public.provider_webhook_events to authenticated;

grant select, insert, update, delete on table public.approved_plan_snapshots to service_role;
grant select, insert, update, delete on table public.api_idempotency_keys to service_role;
grant select, insert, update, delete on table public.upload_intents to service_role;
grant select, insert, update, delete on table public.storage_object_records to service_role;
grant select, insert, update, delete on table public.signed_url_events to service_role;
grant select, insert, update, delete on table public.worker_job_claims to service_role;
grant select, insert, update, delete on table public.tool_runtime_checks to service_role;
grant select, insert, update, delete on table public.provider_request_attempts to service_role;
grant select, insert, update, delete on table public.provider_webhook_events to service_role;

revoke execute on function public.can_create_approved_plan_snapshot(uuid, uuid, uuid) from public, anon;
revoke execute on function public.active_worker_claim_exists(uuid) from public, anon;
revoke execute on function public.can_claim_worker_job(uuid) from public, anon;
revoke execute on function public.can_run_job(uuid) from public, anon;
revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.is_project_member(uuid) from public, anon;
revoke execute on function public.is_project_editor(uuid) from public, anon;
grant execute on function public.can_create_approved_plan_snapshot(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.active_worker_claim_exists(uuid) to authenticated, service_role;
grant execute on function public.can_claim_worker_job(uuid) to authenticated, service_role;
grant execute on function public.can_run_job(uuid) to authenticated, service_role;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function public.is_project_member(uuid) to authenticated, service_role;
grant execute on function public.is_project_editor(uuid) to authenticated, service_role;
