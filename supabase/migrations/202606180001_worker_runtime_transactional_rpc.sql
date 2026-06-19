-- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3
-- Static migration implementation packet only.
-- This file was added for review; it was not executed or deployed in RPC-3.

create schema if not exists worker_runtime;

comment on schema worker_runtime is
  'Private Worker Runtime RPC schema for Track A private E2E transactional claim/lease operations.';

revoke all on schema worker_runtime from public;
revoke all on schema worker_runtime from anon;
revoke all on schema worker_runtime from authenticated;
grant usage on schema worker_runtime to service_role;

create table if not exists public.worker_jobs (
  id uuid primary key default gen_random_uuid(),
  job_family text not null default 'tracka_private_e2e_revalidation',
  status text not null default 'queued',
  approved_plan_snapshot_id uuid not null,
  approved_plan_snapshot_ref text not null,
  restricted_scope_ref text not null,
  requested_capabilities text[] not null default array[]::text[],
  excluded_capabilities text[] not null default array[]::text[],
  input_manifest_ref text,
  private_manifest_ref text,
  artifact_manifest_ref text,
  qa_report_ref text,
  ffprobe_metadata_ref text,
  idempotency_key text,
  created_by text,
  lease_owner text,
  lease_acquired_at timestamptz,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  claim_attempt_count integer not null default 0,
  retry_count integer not null default 0,
  retry_after timestamptz,
  max_attempts integer not null default 3,
  cancel_requested_at timestamptz,
  cancel_requested_by text,
  cancel_reason text,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_summary text,
  error_code text,
  event_log_ref text,
  execution_allowed boolean not null default false,
  public_artifact_allowed boolean not null default false,
  signed_url_source_of_truth_allowed boolean not null default false,
  final_delivery_allowed boolean not null default false,
  internal_beta_unlock_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_jobs_tracka_family_chk check (job_family = 'tracka_private_e2e_revalidation'),
  constraint worker_jobs_status_chk check (
    status in (
      'queued',
      'claimed',
      'running',
      'heartbeat_stale',
      'completed',
      'failed',
      'canceled',
      'expired'
    )
  ),
  constraint worker_jobs_nonnegative_counts_chk check (
    claim_attempt_count >= 0
    and retry_count >= 0
    and max_attempts > 0
  ),
  constraint worker_jobs_restricted_scope_chk check (
    length(btrim(approved_plan_snapshot_ref)) > 0
    and length(btrim(restricted_scope_ref)) > 0
  ),
  constraint worker_jobs_scope_blockers_chk check (
    public_artifact_allowed is false
    and signed_url_source_of_truth_allowed is false
    and final_delivery_allowed is false
    and internal_beta_unlock_allowed is false
  ),
  constraint worker_jobs_lease_owner_chk check (
    lease_owner is null or length(btrim(lease_owner)) > 0
  ),
  constraint worker_jobs_lease_consistency_chk check (
    (status not in ('claimed', 'running') and lease_owner is null and lease_expires_at is null)
    or (status in ('claimed', 'running') and lease_owner is not null and lease_expires_at is not null)
  )
);

comment on table public.worker_jobs is
  'Track A private E2E worker jobs. Service-role-only; no frontend claim path.';
comment on column public.worker_jobs.execution_allowed is
  'Future guarded execution flag; defaults false and is not enabled by RPC-3.';
comment on column public.worker_jobs.restricted_scope_ref is
  'Approved restricted Track A private E2E scope reference.';

create table if not exists public.worker_job_events (
  id uuid primary key default gen_random_uuid(),
  worker_job_id uuid not null references public.worker_jobs(id) on delete cascade,
  job_family text not null default 'tracka_private_e2e_revalidation',
  event_type text not null,
  event_payload_sanitized jsonb not null default '{}'::jsonb,
  actor_type text not null default 'system',
  actor_ref text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint worker_job_events_tracka_family_chk check (job_family = 'tracka_private_e2e_revalidation'),
  constraint worker_job_events_type_chk check (
    event_type in (
      'job_created',
      'claim_started',
      'claim_idempotent_replay',
      'heartbeat_recorded',
      'job_completed',
      'job_failed',
      'job_canceled',
      'lease_expired',
      'artifact_recorded',
      'event_appended'
    )
  ),
  constraint worker_job_events_actor_chk check (length(btrim(actor_type)) > 0),
  constraint worker_job_events_payload_sanitized_chk check (jsonb_typeof(event_payload_sanitized) = 'object')
);

comment on table public.worker_job_events is
  'Sanitized Track A private E2E worker event log. Secret payloads and raw prompts are not allowed.';

create table if not exists public.worker_job_artifacts (
  id uuid primary key default gen_random_uuid(),
  worker_job_id uuid not null references public.worker_jobs(id) on delete cascade,
  job_family text not null default 'tracka_private_e2e_revalidation',
  artifact_kind text not null,
  private_artifact_ref text not null,
  sha256 text not null,
  checksum_algorithm text not null default 'sha256',
  size_bytes bigint,
  content_type text,
  artifact_manifest_ref text,
  qa_report_ref text,
  ffprobe_metadata_ref text,
  public_artifact_allowed boolean not null default false,
  signed_url_source_of_truth_allowed boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  constraint worker_job_artifacts_tracka_family_chk check (job_family = 'tracka_private_e2e_revalidation'),
  constraint worker_job_artifacts_kind_chk check (
    artifact_kind in (
      'private_manifest',
      'checksum_manifest',
      'qa_report',
      'ffprobe_metadata',
      'private_render_preview',
      'private_caption_burnin_review'
    )
  ),
  constraint worker_job_artifacts_private_ref_chk check (length(btrim(private_artifact_ref)) > 0),
  constraint worker_job_artifacts_sha256_chk check (sha256 ~ '^[a-f0-9]{64}$'),
  constraint worker_job_artifacts_scope_blockers_chk check (
    public_artifact_allowed is false
    and signed_url_source_of_truth_allowed is false
  ),
  constraint worker_job_artifacts_size_chk check (size_bytes is null or size_bytes >= 0)
);

comment on table public.worker_job_artifacts is
  'Private Track A worker artifact references and checksums only; no public artifact or signed URL source of truth.';

create unique index if not exists worker_jobs_family_idempotency_uidx
  on public.worker_jobs (job_family, idempotency_key)
  where idempotency_key is not null;

create index if not exists worker_jobs_claim_queue_idx
  on public.worker_jobs (job_family, status, retry_after, created_at)
  where status in ('queued', 'heartbeat_stale', 'expired', 'failed');

create index if not exists worker_jobs_lease_expiry_idx
  on public.worker_jobs (job_family, lease_expires_at)
  where status in ('claimed', 'running');

create index if not exists worker_job_events_job_created_idx
  on public.worker_job_events (worker_job_id, created_at);

create unique index if not exists worker_job_events_idempotency_uidx
  on public.worker_job_events (worker_job_id, event_type, idempotency_key)
  where idempotency_key is not null;

create index if not exists worker_job_artifacts_job_kind_idx
  on public.worker_job_artifacts (worker_job_id, artifact_kind, created_at);

drop trigger if exists worker_jobs_set_updated_at on public.worker_jobs;
create trigger worker_jobs_set_updated_at
before update on public.worker_jobs
for each row execute function public.set_updated_at();

alter table public.worker_jobs enable row level security;
alter table public.worker_job_events enable row level security;
alter table public.worker_job_artifacts enable row level security;

revoke all on public.worker_jobs from public;
revoke all on public.worker_job_events from public;
revoke all on public.worker_job_artifacts from public;
revoke all on public.worker_jobs from anon;
revoke all on public.worker_job_events from anon;
revoke all on public.worker_job_artifacts from anon;
revoke all on public.worker_jobs from authenticated;
revoke all on public.worker_job_events from authenticated;
revoke all on public.worker_job_artifacts from authenticated;

grant select, insert, update, delete on public.worker_jobs to service_role;
grant select, insert, update, delete on public.worker_job_events to service_role;
grant select, insert, update, delete on public.worker_job_artifacts to service_role;

create or replace function worker_runtime.append_tracka_private_e2e_event(
  p_worker_job_id uuid,
  p_event_type text,
  p_event_payload_sanitized jsonb default '{}'::jsonb,
  p_actor_type text default 'system',
  p_actor_ref text default null,
  p_idempotency_key text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
begin
  if p_worker_job_id is null then
    raise exception 'worker_job_id_required' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_event_payload_sanitized, '{}'::jsonb)) <> 'object' then
    raise exception 'event_payload_must_be_object' using errcode = '22023';
  end if;

  perform 1
  from public.worker_jobs j
  where j.id = p_worker_job_id
    and j.job_family = 'tracka_private_e2e_revalidation';

  if not found then
    raise exception 'tracka_worker_job_not_found' using errcode = 'P0002';
  end if;

  if p_idempotency_key is not null then
    select e.id
    into v_event_id
    from public.worker_job_events e
    where e.worker_job_id = p_worker_job_id
      and e.event_type = p_event_type
      and e.idempotency_key = p_idempotency_key
    order by e.created_at
    limit 1;

    if v_event_id is not null then
      return v_event_id;
    end if;
  end if;

  insert into public.worker_job_events (
    worker_job_id,
    job_family,
    event_type,
    event_payload_sanitized,
    actor_type,
    actor_ref,
    idempotency_key
  ) values (
    p_worker_job_id,
    'tracka_private_e2e_revalidation',
    p_event_type,
    coalesce(p_event_payload_sanitized, '{}'::jsonb),
    coalesce(nullif(btrim(p_actor_type), ''), 'system'),
    nullif(btrim(coalesce(p_actor_ref, '')), ''),
    nullif(btrim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function worker_runtime.claim_tracka_private_e2e_job(
  p_worker_instance_id text,
  p_lease_owner text,
  p_idempotency_key text,
  p_lease_duration interval default interval '15 minutes'
) returns table (
  worker_job_id uuid,
  status text,
  lease_owner text,
  lease_expires_at timestamptz,
  event_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.worker_jobs%rowtype;
  v_event_id uuid;
  v_lease_duration interval := coalesce(p_lease_duration, interval '15 minutes');
begin
  if nullif(btrim(coalesce(p_worker_instance_id, '')), '') is null then
    raise exception 'worker_instance_id_required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_lease_owner, '')), '') is null then
    raise exception 'lease_owner_required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
    raise exception 'idempotency_key_required' using errcode = '22023';
  end if;

  if v_lease_duration <= interval '0 seconds' or v_lease_duration > interval '1 hour' then
    raise exception 'lease_duration_out_of_range' using errcode = '22023';
  end if;

  select j.*
  into v_job
  from public.worker_jobs j
  where j.job_family = 'tracka_private_e2e_revalidation'
    and j.idempotency_key = p_idempotency_key
    and j.lease_owner = p_lease_owner
    and j.status in ('claimed', 'running')
  order by j.updated_at desc
  limit 1;

  if found then
    v_event_id := worker_runtime.append_tracka_private_e2e_event(
      v_job.id,
      'claim_idempotent_replay',
      jsonb_build_object('workerInstanceId', p_worker_instance_id),
      'worker',
      p_lease_owner,
      p_idempotency_key
    );

    return query select v_job.id, v_job.status, v_job.lease_owner, v_job.lease_expires_at, v_event_id;
    return;
  end if;

  select j.*
  into v_job
  from public.worker_jobs j
  where j.job_family = 'tracka_private_e2e_revalidation'
    and j.execution_allowed is true
    and j.cancel_requested_at is null
    and j.status in ('queued', 'heartbeat_stale', 'expired', 'failed')
    and (j.retry_after is null or j.retry_after <= now())
    and j.retry_count < j.max_attempts
    and length(btrim(j.approved_plan_snapshot_ref)) > 0
    and length(btrim(j.restricted_scope_ref)) > 0
    and j.public_artifact_allowed is false
    and j.signed_url_source_of_truth_allowed is false
    and j.final_delivery_allowed is false
    and j.internal_beta_unlock_allowed is false
  order by j.created_at
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.worker_jobs
  set status = 'claimed',
      lease_owner = p_lease_owner,
      lease_acquired_at = now(),
      lease_expires_at = now() + v_lease_duration,
      heartbeat_at = now(),
      claim_attempt_count = claim_attempt_count + 1,
      idempotency_key = p_idempotency_key,
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  v_event_id := worker_runtime.append_tracka_private_e2e_event(
    v_job.id,
    'claim_started',
    jsonb_build_object('workerInstanceId', p_worker_instance_id),
    'worker',
    p_lease_owner,
    p_idempotency_key
  );

  return query select v_job.id, v_job.status, v_job.lease_owner, v_job.lease_expires_at, v_event_id;
end;
$$;

create or replace function worker_runtime.heartbeat_tracka_private_e2e_job(
  p_worker_job_id uuid,
  p_lease_owner text,
  p_idempotency_key text,
  p_lease_duration interval default interval '15 minutes'
) returns table (
  worker_job_id uuid,
  status text,
  lease_owner text,
  lease_expires_at timestamptz,
  event_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.worker_jobs%rowtype;
  v_event_id uuid;
  v_lease_duration interval := coalesce(p_lease_duration, interval '15 minutes');
begin
  select j.*
  into v_job
  from public.worker_jobs j
  where j.id = p_worker_job_id
    and j.job_family = 'tracka_private_e2e_revalidation'
  for update;

  if not found then
    raise exception 'tracka_worker_job_not_found' using errcode = 'P0002';
  end if;

  if v_job.lease_owner is distinct from p_lease_owner then
    raise exception 'lease_owner_mismatch' using errcode = '42501';
  end if;

  if v_job.status not in ('claimed', 'running') then
    raise exception 'job_not_heartbeatable' using errcode = '22023';
  end if;

  if v_job.lease_expires_at <= now() then
    raise exception 'lease_expired' using errcode = '22023';
  end if;

  update public.worker_jobs
  set status = 'running',
      heartbeat_at = now(),
      lease_expires_at = now() + v_lease_duration,
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  v_event_id := worker_runtime.append_tracka_private_e2e_event(
    v_job.id,
    'heartbeat_recorded',
    jsonb_build_object('leaseExpiresAt', v_job.lease_expires_at),
    'worker',
    p_lease_owner,
    p_idempotency_key
  );

  return query select v_job.id, v_job.status, v_job.lease_owner, v_job.lease_expires_at, v_event_id;
end;
$$;

create or replace function worker_runtime.complete_tracka_private_e2e_job(
  p_worker_job_id uuid,
  p_lease_owner text,
  p_artifact_manifest_ref text,
  p_qa_report_ref text,
  p_idempotency_key text
) returns table (
  worker_job_id uuid,
  status text,
  event_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.worker_jobs%rowtype;
  v_event_id uuid;
begin
  if nullif(btrim(coalesce(p_artifact_manifest_ref, '')), '') is null then
    raise exception 'artifact_manifest_ref_required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_qa_report_ref, '')), '') is null then
    raise exception 'qa_report_ref_required' using errcode = '22023';
  end if;

  select j.*
  into v_job
  from public.worker_jobs j
  where j.id = p_worker_job_id
    and j.job_family = 'tracka_private_e2e_revalidation'
  for update;

  if not found then
    raise exception 'tracka_worker_job_not_found' using errcode = 'P0002';
  end if;

  if v_job.lease_owner is distinct from p_lease_owner then
    raise exception 'lease_owner_mismatch' using errcode = '42501';
  end if;

  if v_job.status not in ('claimed', 'running') then
    raise exception 'job_not_completable' using errcode = '22023';
  end if;

  update public.worker_jobs
  set status = 'completed',
      artifact_manifest_ref = p_artifact_manifest_ref,
      qa_report_ref = p_qa_report_ref,
      completed_at = now(),
      lease_owner = null,
      lease_acquired_at = null,
      lease_expires_at = null,
      heartbeat_at = now(),
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  v_event_id := worker_runtime.append_tracka_private_e2e_event(
    v_job.id,
    'job_completed',
    jsonb_build_object(
      'artifactManifestRef', p_artifact_manifest_ref,
      'qaReportRef', p_qa_report_ref
    ),
    'worker',
    p_lease_owner,
    p_idempotency_key
  );

  return query select v_job.id, v_job.status, v_event_id;
end;
$$;

create or replace function worker_runtime.fail_tracka_private_e2e_job(
  p_worker_job_id uuid,
  p_lease_owner text,
  p_error_summary text,
  p_retry_after timestamptz default null,
  p_idempotency_key text default null
) returns table (
  worker_job_id uuid,
  status text,
  retry_count integer,
  retry_after timestamptz,
  event_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.worker_jobs%rowtype;
  v_event_id uuid;
begin
  select j.*
  into v_job
  from public.worker_jobs j
  where j.id = p_worker_job_id
    and j.job_family = 'tracka_private_e2e_revalidation'
  for update;

  if not found then
    raise exception 'tracka_worker_job_not_found' using errcode = 'P0002';
  end if;

  if v_job.lease_owner is distinct from p_lease_owner then
    raise exception 'lease_owner_mismatch' using errcode = '42501';
  end if;

  update public.worker_jobs
  set status = 'failed',
      retry_count = retry_count + 1,
      retry_after = p_retry_after,
      failed_at = now(),
      failure_summary = left(coalesce(p_error_summary, 'worker failure'), 500),
      lease_owner = null,
      lease_acquired_at = null,
      lease_expires_at = null,
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  v_event_id := worker_runtime.append_tracka_private_e2e_event(
    v_job.id,
    'job_failed',
    jsonb_build_object(
      'errorSummary', left(coalesce(p_error_summary, 'worker failure'), 500),
      'retryAfter', p_retry_after
    ),
    'worker',
    p_lease_owner,
    p_idempotency_key
  );

  return query select v_job.id, v_job.status, v_job.retry_count, v_job.retry_after, v_event_id;
end;
$$;

create or replace function worker_runtime.cancel_tracka_private_e2e_job(
  p_worker_job_id uuid,
  p_actor_ref text,
  p_cancel_reason text,
  p_idempotency_key text default null
) returns table (
  worker_job_id uuid,
  status text,
  event_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.worker_jobs%rowtype;
  v_event_id uuid;
begin
  select j.*
  into v_job
  from public.worker_jobs j
  where j.id = p_worker_job_id
    and j.job_family = 'tracka_private_e2e_revalidation'
  for update;

  if not found then
    raise exception 'tracka_worker_job_not_found' using errcode = 'P0002';
  end if;

  if v_job.status in ('completed', 'canceled') then
    v_event_id := worker_runtime.append_tracka_private_e2e_event(
      v_job.id,
      'job_canceled',
      jsonb_build_object('idempotentReplay', true),
      'system',
      p_actor_ref,
      p_idempotency_key
    );
    return query select v_job.id, v_job.status, v_event_id;
    return;
  end if;

  update public.worker_jobs
  set status = 'canceled',
      cancel_requested_at = coalesce(cancel_requested_at, now()),
      cancel_requested_by = p_actor_ref,
      cancel_reason = left(coalesce(p_cancel_reason, 'canceled'), 500),
      lease_owner = null,
      lease_acquired_at = null,
      lease_expires_at = null,
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  v_event_id := worker_runtime.append_tracka_private_e2e_event(
    v_job.id,
    'job_canceled',
    jsonb_build_object('cancelReason', left(coalesce(p_cancel_reason, 'canceled'), 500)),
    'system',
    p_actor_ref,
    p_idempotency_key
  );

  return query select v_job.id, v_job.status, v_event_id;
end;
$$;

create or replace function worker_runtime.release_expired_tracka_private_e2e_leases(
  p_batch_limit integer default 50,
  p_idempotency_key text default null
) returns table (
  worker_job_id uuid,
  status text,
  event_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.worker_jobs%rowtype;
  v_event_id uuid;
  v_limit integer := least(greatest(coalesce(p_batch_limit, 50), 1), 100);
begin
  for v_job in
    with candidates as (
      select j.id
      from public.worker_jobs j
      where j.job_family = 'tracka_private_e2e_revalidation'
        and j.status in ('claimed', 'running')
        and j.lease_expires_at <= now()
      order by j.lease_expires_at
      for update skip locked
      limit v_limit
    )
    update public.worker_jobs j
    set status = 'expired',
        lease_owner = null,
        lease_acquired_at = null,
        lease_expires_at = null,
        updated_at = now()
    from candidates
    where j.id = candidates.id
    returning j.*
  loop
    v_event_id := worker_runtime.append_tracka_private_e2e_event(
      v_job.id,
      'lease_expired',
      jsonb_build_object('releasedBy', 'release_expired_tracka_private_e2e_leases'),
      'system',
      'worker_runtime',
      p_idempotency_key
    );

    return query select v_job.id, v_job.status, v_event_id;
  end loop;
end;
$$;

revoke all on function worker_runtime.append_tracka_private_e2e_event(uuid, text, jsonb, text, text, text) from public;
revoke all on function worker_runtime.append_tracka_private_e2e_event(uuid, text, jsonb, text, text, text) from anon;
revoke all on function worker_runtime.append_tracka_private_e2e_event(uuid, text, jsonb, text, text, text) from authenticated;
grant execute on function worker_runtime.append_tracka_private_e2e_event(uuid, text, jsonb, text, text, text) to service_role;

revoke all on function worker_runtime.claim_tracka_private_e2e_job(text, text, text, interval) from public;
revoke all on function worker_runtime.claim_tracka_private_e2e_job(text, text, text, interval) from anon;
revoke all on function worker_runtime.claim_tracka_private_e2e_job(text, text, text, interval) from authenticated;
grant execute on function worker_runtime.claim_tracka_private_e2e_job(text, text, text, interval) to service_role;

revoke all on function worker_runtime.heartbeat_tracka_private_e2e_job(uuid, text, text, interval) from public;
revoke all on function worker_runtime.heartbeat_tracka_private_e2e_job(uuid, text, text, interval) from anon;
revoke all on function worker_runtime.heartbeat_tracka_private_e2e_job(uuid, text, text, interval) from authenticated;
grant execute on function worker_runtime.heartbeat_tracka_private_e2e_job(uuid, text, text, interval) to service_role;

revoke all on function worker_runtime.complete_tracka_private_e2e_job(uuid, text, text, text, text) from public;
revoke all on function worker_runtime.complete_tracka_private_e2e_job(uuid, text, text, text, text) from anon;
revoke all on function worker_runtime.complete_tracka_private_e2e_job(uuid, text, text, text, text) from authenticated;
grant execute on function worker_runtime.complete_tracka_private_e2e_job(uuid, text, text, text, text) to service_role;

revoke all on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) from public;
revoke all on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) from anon;
revoke all on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) from authenticated;
grant execute on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) to service_role;

revoke all on function worker_runtime.cancel_tracka_private_e2e_job(uuid, text, text, text) from public;
revoke all on function worker_runtime.cancel_tracka_private_e2e_job(uuid, text, text, text) from anon;
revoke all on function worker_runtime.cancel_tracka_private_e2e_job(uuid, text, text, text) from authenticated;
grant execute on function worker_runtime.cancel_tracka_private_e2e_job(uuid, text, text, text) to service_role;

revoke all on function worker_runtime.release_expired_tracka_private_e2e_leases(integer, text) from public;
revoke all on function worker_runtime.release_expired_tracka_private_e2e_leases(integer, text) from anon;
revoke all on function worker_runtime.release_expired_tracka_private_e2e_leases(integer, text) from authenticated;
grant execute on function worker_runtime.release_expired_tracka_private_e2e_leases(integer, text) to service_role;
