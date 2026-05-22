-- RP-E2E-READY-01 Prompt 8: service-role runtime RPCs.
-- Local/review-ready only for the Supabase project named `reeditpro`.
-- Do not run this migration remotely without review and explicit approval.
-- These RPCs do not call providers, Stripe, Google Cloud, Remotion, or storage services.

create extension if not exists "pgcrypto";

alter table public.approved_plan_snapshots
  add column if not exists idempotency_key text;

create unique index if not exists approved_plan_snapshots_idempotency_uidx
on public.approved_plan_snapshots(workspace_id, idempotency_key)
where idempotency_key is not null;

create unique index if not exists worker_job_claims_job_idempotency_uidx
on public.worker_job_claims(job_id, idempotency_key);

create index if not exists job_events_job_created_at_idx
on public.job_events(job_id, created_at);

create index if not exists storage_object_records_purpose_status_idx
on public.storage_object_records(project_id, object_purpose, status);

create index if not exists render_jobs_project_status_idx
on public.render_jobs(project_id, render_type, status);

create index if not exists qa_reports_render_status_idx
on public.qa_reports(render_id, status);

create index if not exists api_idempotency_keys_lookup_idx
on public.api_idempotency_keys(workspace_id, user_id, idempotency_key, request_hash);

create or replace function public.e2e_jsonb_has_secret_like_content(target jsonb)
returns boolean
language plpgsql
stable
as $$
declare
  item_key text;
  item_value jsonb;
  scalar_text text;
begin
  if target is null then
    return false;
  end if;

  if jsonb_typeof(target) = 'object' then
    for item_key, item_value in select key, value from jsonb_each(target) loop
      if lower(item_key) ~ '(api[_-]?key|secret|service[_-]?role|signed[_-]?url|password|token)' then
        return true;
      end if;
      if public.e2e_jsonb_has_secret_like_content(item_value) then
        return true;
      end if;
    end loop;
    return false;
  end if;

  if jsonb_typeof(target) = 'array' then
    for item_value in select value from jsonb_array_elements(target) loop
      if public.e2e_jsonb_has_secret_like_content(item_value) then
        return true;
      end if;
    end loop;
    return false;
  end if;

  if jsonb_typeof(target) = 'string' then
    scalar_text := lower(target #>> '{}');
    return scalar_text ~ '(api[_-]?key|service[_-]?role|signed[_-]?url|bearer[[:space:]]+[a-z0-9._-]+|sk-[a-z0-9_-]{12,})';
  end if;

  return false;
end;
$$;

create or replace function public.e2e_assert_safe_json(target jsonb, field_name text)
returns void
language plpgsql
stable
as $$
begin
  if target is null then
    return;
  end if;

  if jsonb_typeof(target) not in ('object', 'array') then
    raise exception 'E2E_UNSAFE_JSON: % must be a JSON object or array', field_name;
  end if;

  if public.e2e_jsonb_has_secret_like_content(target) then
    raise exception 'E2E_UNSAFE_JSON: % contains a secret-like field or value', field_name;
  end if;
end;
$$;

create or replace function public.e2e_record_job_event(
  p_workspace_id uuid,
  p_project_id uuid,
  p_job_id uuid,
  p_event_name text,
  p_event_message text,
  p_progress_percent numeric,
  p_payload_json jsonb default '{}'::jsonb,
  p_visible_to_user boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.jobs%rowtype;
  v_event_id uuid;
  v_event_type public.job_event_type;
begin
  perform public.e2e_assert_safe_json(coalesce(p_payload_json, '{}'::jsonb), 'p_payload_json');

  select * into v_job
  from public.jobs
  where id = p_job_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_JOB_NOT_FOUND: job % was not found for workspace/project', p_job_id;
  end if;

  select enumlabel::text::public.job_event_type into v_event_type
  from pg_enum
  where enumtypid = 'public.job_event_type'::regtype
    and enumlabel = p_event_name
  limit 1;

  if v_event_type is null then
    v_event_type := case
      when p_event_name ilike '%fail%' then 'failed'::public.job_event_type
      when p_event_name ilike '%complete%' then 'completed'::public.job_event_type
      when p_event_name ilike '%start%' or p_event_name ilike '%claim%' then 'started'::public.job_event_type
      else 'progress'::public.job_event_type
    end;
  end if;

  insert into public.job_events (
    job_id,
    job_batch_id,
    workspace_id,
    project_id,
    event_type,
    message,
    progress_percent,
    actor_type,
    actor_agent_type,
    payload
  )
  values (
    p_job_id,
    v_job.job_batch_id,
    p_workspace_id,
    p_project_id,
    v_event_type,
    p_event_message,
    p_progress_percent,
    'worker',
    'render_worker',
    jsonb_build_object(
      'eventName', p_event_name,
      'visibleToUser', p_visible_to_user,
      'payload', coalesce(p_payload_json, '{}'::jsonb)
    )
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'recorded',
    'jobEventId', v_event_id,
    'eventName', p_event_name,
    'eventType', v_event_type
  );
end;
$$;

create or replace function public.e2e_reserve_credits_for_smoke(
  p_workspace_id uuid,
  p_project_id uuid,
  p_credit_wallet_id uuid,
  p_credit_estimate_id uuid,
  p_credit_approval_id uuid,
  p_amount integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_estimate public.credit_estimates%rowtype;
  v_approval public.credit_approvals%rowtype;
  v_wallet public.credit_wallets%rowtype;
  v_reservation_id uuid;
  v_ledger_id uuid;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'E2E_IDEMPOTENCY_REQUIRED: credit reservation idempotency key is required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'E2E_CREDIT_AMOUNT_INVALID: smoke credit reservation amount must be positive';
  end if;

  select * into v_estimate
  from public.credit_estimates
  where id = p_credit_estimate_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_CREDIT_ESTIMATE_MISSING: credit estimate % was not found', p_credit_estimate_id;
  end if;
  if v_estimate.status::text <> 'approved' then
    raise exception 'E2E_CREDIT_ESTIMATE_NOT_APPROVED: credit estimate % is not approved', p_credit_estimate_id;
  end if;

  select * into v_approval
  from public.credit_approvals
  where id = p_credit_approval_id
    and credit_estimate_id = p_credit_estimate_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_CREDIT_APPROVAL_MISSING: credit approval % was not found', p_credit_approval_id;
  end if;
  if v_approval.status::text <> 'approved' then
    raise exception 'E2E_CREDIT_APPROVAL_NOT_APPROVED: credit approval % is not approved', p_credit_approval_id;
  end if;

  select * into v_wallet
  from public.credit_wallets
  where id = p_credit_wallet_id
    and workspace_id = p_workspace_id;
  if not found then
    raise exception 'E2E_CREDIT_WALLET_MISSING: credit wallet % was not found', p_credit_wallet_id;
  end if;

  select id into v_reservation_id
  from public.credit_reservations
  where workspace_id = p_workspace_id
    and idempotency_key = p_idempotency_key
  limit 1;

  if v_reservation_id is null then
    insert into public.credit_reservations (
      credit_wallet_id,
      workspace_id,
      project_id,
      chat_session_id,
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
      v_estimate.chat_session_id,
      p_credit_estimate_id,
      p_credit_approval_id,
      v_estimate.edit_plan_id,
      'reserved',
      p_amount,
      'RP-E2E smoke reservation; not production billing',
      p_idempotency_key,
      now(),
      now() + interval '1 hour',
      jsonb_build_object('rpE2eSmoke', true, 'productionBilling', false)
    )
    returning id into v_reservation_id;

    update public.credit_wallets
    set cached_reserved_credits = cached_reserved_credits + p_amount,
        updated_at = now()
    where id = p_credit_wallet_id;
  end if;

  select id into v_ledger_id
  from public.credit_ledger_entries
  where workspace_id = p_workspace_id
    and idempotency_key = p_idempotency_key
  limit 1;

  if v_ledger_id is null then
    insert into public.credit_ledger_entries (
      credit_wallet_id,
      workspace_id,
      user_id,
      entry_type,
      amount,
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
      v_wallet.user_id,
      'reservation',
      -p_amount,
      p_project_id,
      v_estimate.edit_plan_id,
      v_reservation_id,
      p_credit_estimate_id,
      p_idempotency_key,
      'RP-E2E smoke reservation ledger entry; not production billing',
      jsonb_build_object('rpE2eSmoke', true, 'productionBilling', false)
    )
    returning id into v_ledger_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', 'reserved',
    'creditReservationId', v_reservation_id,
    'creditLedgerEntryId', v_ledger_id
  );
end;
$$;

create or replace function public.e2e_create_approved_plan_snapshot(
  p_workspace_id uuid,
  p_project_id uuid,
  p_chat_session_id uuid,
  p_edit_plan_id uuid,
  p_credit_estimate_id uuid,
  p_credit_approval_id uuid,
  p_credit_reservation_id uuid,
  p_approved_by_user_id uuid,
  p_snapshot_json jsonb,
  p_plan_hash text,
  p_credit_hash text,
  p_source_sequence_hash text,
  p_timing_hash text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_edit_plan public.edit_plans%rowtype;
  v_estimate public.credit_estimates%rowtype;
  v_approval public.credit_approvals%rowtype;
  v_reservation public.credit_reservations%rowtype;
  v_snapshot_id uuid;
  v_edit_session_id uuid;
  v_edit_plan_version_id uuid;
begin
  perform public.e2e_assert_safe_json(p_snapshot_json, 'p_snapshot_json');
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'E2E_IDEMPOTENCY_REQUIRED: approved snapshot idempotency key is required';
  end if;

  select id into v_snapshot_id
  from public.approved_plan_snapshots
  where workspace_id = p_workspace_id
    and idempotency_key = p_idempotency_key
  limit 1;
  if v_snapshot_id is not null then
    return jsonb_build_object('ok', true, 'status', 'idempotent_replay', 'approvedPlanSnapshotId', v_snapshot_id);
  end if;

  select * into v_edit_plan
  from public.edit_plans
  where id = p_edit_plan_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_EDIT_PLAN_MISSING: edit plan % was not found', p_edit_plan_id;
  end if;
  if v_edit_plan.status::text <> 'approved' then
    raise exception 'E2E_PLAN_NOT_APPROVED: edit plan % is not approved', p_edit_plan_id;
  end if;

  select * into v_estimate
  from public.credit_estimates
  where id = p_credit_estimate_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
    and edit_plan_id = p_edit_plan_id;
  if not found then
    raise exception 'E2E_CREDIT_ESTIMATE_MISSING: credit estimate % was not found for edit plan', p_credit_estimate_id;
  end if;
  if v_estimate.status::text <> 'approved' then
    raise exception 'E2E_CREDIT_ESTIMATE_NOT_APPROVED: credit estimate % is not approved', p_credit_estimate_id;
  end if;

  select * into v_approval
  from public.credit_approvals
  where id = p_credit_approval_id
    and credit_estimate_id = p_credit_estimate_id
    and status = 'approved';
  if not found then
    raise exception 'E2E_CREDIT_APPROVAL_MISSING: approved credit approval % was not found', p_credit_approval_id;
  end if;

  select * into v_reservation
  from public.credit_reservations
  where id = p_credit_reservation_id
    and credit_estimate_id = p_credit_estimate_id
    and credit_approval_id = p_credit_approval_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_CREDIT_RESERVATION_MISSING: credit reservation % was not found', p_credit_reservation_id;
  end if;
  if v_reservation.status::text not in ('reserved', 'active') then
    raise exception 'E2E_CREDITS_NOT_RESERVED: credit reservation % is not reserved/active', p_credit_reservation_id;
  end if;

  select epv.id, epv.edit_session_id
  into v_edit_plan_version_id, v_edit_session_id
  from public.edit_plan_versions epv
  where epv.project_id = p_project_id
    and (epv.credit_estimate_id = p_credit_estimate_id or epv.status = 'approved')
  order by epv.approved_at desc nulls last, epv.version desc
  limit 1;
  if v_edit_plan_version_id is null or v_edit_session_id is null then
    raise exception 'E2E_SCHEMA_DEPENDENCY_MISSING: edit_plan_versions/edit_sessions are required before approved snapshots can be created';
  end if;

  insert into public.approved_plan_snapshots (
    workspace_id,
    project_id,
    chat_session_id,
    edit_plan_id,
    edit_session_id,
    edit_plan_version_id,
    credit_estimate_id,
    credit_approval_id,
    credit_reservation_id,
    approved_by_user_id,
    approved_by,
    approved_at,
    snapshot_version,
    snapshot_status,
    status,
    snapshot_json,
    plan_hash,
    credit_hash,
    source_sequence_hash,
    timing_hash,
    immutable,
    idempotency_key
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    p_edit_plan_id,
    v_edit_session_id,
    v_edit_plan_version_id,
    p_credit_estimate_id,
    p_credit_approval_id,
    p_credit_reservation_id,
    p_approved_by_user_id,
    p_approved_by_user_id,
    now(),
    'v1',
    'approved',
    'approved',
    p_snapshot_json,
    p_plan_hash,
    p_credit_hash,
    p_source_sequence_hash,
    p_timing_hash,
    true,
    p_idempotency_key
  )
  returning id into v_snapshot_id;

  return jsonb_build_object('ok', true, 'status', 'approved', 'approvedPlanSnapshotId', v_snapshot_id);
end;
$$;

create or replace function public.e2e_create_job_batch_and_render_job(
  p_workspace_id uuid,
  p_project_id uuid,
  p_chat_session_id uuid,
  p_edit_plan_id uuid,
  p_approved_plan_snapshot_id uuid,
  p_credit_estimate_id uuid,
  p_credit_reservation_id uuid,
  p_render_type text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_snapshot public.approved_plan_snapshots%rowtype;
  v_reservation public.credit_reservations%rowtype;
  v_existing_render_job_id uuid;
  v_existing_job_id uuid;
  v_existing_batch_id uuid;
  v_job_batch_id uuid;
  v_job_id uuid;
  v_render_job_id uuid;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'E2E_IDEMPOTENCY_REQUIRED: job/render idempotency key is required';
  end if;

  select id, job_id, job_batch_id into v_existing_render_job_id, v_existing_job_id, v_existing_batch_id
  from public.render_jobs
  where workspace_id = p_workspace_id
    and idempotency_key = p_idempotency_key
  limit 1;
  if v_existing_render_job_id is not null then
    return jsonb_build_object(
      'ok', true,
      'status', 'idempotent_replay',
      'jobBatchId', v_existing_batch_id,
      'jobId', v_existing_job_id,
      'renderJobId', v_existing_render_job_id
    );
  end if;

  select * into v_snapshot
  from public.approved_plan_snapshots
  where id = p_approved_plan_snapshot_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
    and snapshot_status = 'approved';
  if not found then
    raise exception 'E2E_APPROVED_SNAPSHOT_MISSING: approved snapshot % was not found', p_approved_plan_snapshot_id;
  end if;

  select * into v_reservation
  from public.credit_reservations
  where id = p_credit_reservation_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found or v_reservation.status::text not in ('reserved', 'active') then
    raise exception 'E2E_CREDITS_NOT_RESERVED: credit reservation % is not reserved/active', p_credit_reservation_id;
  end if;

  insert into public.job_batches (
    workspace_id,
    project_id,
    chat_session_id,
    edit_plan_id,
    credit_estimate_id,
    credit_reservation_id,
    status,
    batch_name,
    batch_purpose,
    idempotency_key,
    input_payload,
    metadata
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    p_edit_plan_id,
    p_credit_estimate_id,
    p_credit_reservation_id,
    'queued',
    'RP-E2E RPC persisted render smoke',
    'no-ai persisted render smoke',
    p_idempotency_key,
    jsonb_build_object('approvedPlanSnapshotId', p_approved_plan_snapshot_id),
    jsonb_build_object('rpE2eSmoke', true, 'rpcRuntime', true)
  )
  returning id into v_job_batch_id;

  insert into public.jobs (
    job_batch_id,
    workspace_id,
    project_id,
    chat_session_id,
    edit_plan_id,
    credit_estimate_id,
    credit_reservation_id,
    job_type,
    status,
    worker_target,
    runtime_type,
    job_name,
    idempotency_key,
    input_payload,
    metadata
  )
  values (
    v_job_batch_id,
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    p_edit_plan_id,
    p_credit_estimate_id,
    p_credit_reservation_id,
    'render_preview',
    'queued',
    'render_worker',
    'backend_api',
    'RP-E2E RPC persisted render smoke job',
    p_idempotency_key,
    jsonb_build_object('approvedPlanSnapshotId', p_approved_plan_snapshot_id),
    jsonb_build_object('rpE2eSmoke', true, 'rpcRuntime', true)
  )
  returning id into v_job_id;

  insert into public.render_jobs (
    workspace_id,
    project_id,
    chat_session_id,
    edit_plan_id,
    job_id,
    job_batch_id,
    credit_estimate_id,
    credit_reservation_id,
    status,
    render_type,
    quality_level,
    output_format,
    render_name,
    timeline_spec,
    render_settings,
    width,
    height,
    frame_rate,
    idempotency_key,
    worker_runtime
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    p_edit_plan_id,
    v_job_id,
    v_job_batch_id,
    p_credit_estimate_id,
    p_credit_reservation_id,
    'queued',
    coalesce(nullif(p_render_type, ''), 'preview')::public.render_type,
    'draft',
    'mp4',
    'RP-E2E RPC persisted render smoke',
    jsonb_build_object('approvedPlanSnapshotId', p_approved_plan_snapshot_id),
    jsonb_build_object('rpE2eSmoke', true, 'rpcRuntime', true),
    320,
    180,
    30,
    p_idempotency_key,
    'local'
  )
  returning id into v_render_job_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'queued',
    'jobBatchId', v_job_batch_id,
    'jobId', v_job_id,
    'renderJobId', v_render_job_id
  );
end;
$$;

create or replace function public.e2e_claim_worker_job(
  p_workspace_id uuid,
  p_project_id uuid,
  p_job_id uuid,
  p_worker_type text,
  p_worker_instance_id text,
  p_lease_seconds integer,
  p_attempt_number integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.jobs%rowtype;
  v_claim_id uuid;
  v_conflicting_claim_id uuid;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'E2E_IDEMPOTENCY_REQUIRED: worker claim idempotency key is required';
  end if;

  select * into v_job
  from public.jobs
  where id = p_job_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_JOB_NOT_FOUND: job % was not found', p_job_id;
  end if;
  if v_job.status::text not in ('queued', 'retrying', 'running') then
    raise exception 'E2E_JOB_NOT_CLAIMABLE: job % has status %', p_job_id, v_job.status;
  end if;

  select id into v_claim_id
  from public.worker_job_claims
  where job_id = p_job_id
    and idempotency_key = p_idempotency_key
  limit 1;
  if v_claim_id is not null then
    return jsonb_build_object('ok', true, 'status', 'idempotent_replay', 'workerJobClaimId', v_claim_id);
  end if;

  select id into v_conflicting_claim_id
  from public.worker_job_claims
  where job_id = p_job_id
    and claim_status = 'active'
    and lease_expires_at > now()
  limit 1;
  if v_conflicting_claim_id is not null then
    raise exception 'E2E_WORKER_CLAIM_CONFLICT: job % already has active claim %', p_job_id, v_conflicting_claim_id;
  end if;

  insert into public.worker_job_claims (
    workspace_id,
    project_id,
    job_id,
    worker_type,
    worker_instance_id,
    claim_status,
    claimed_at,
    heartbeat_at,
    lease_expires_at,
    attempt_number,
    idempotency_key
  )
  values (
    p_workspace_id,
    p_project_id,
    p_job_id,
    p_worker_type,
    p_worker_instance_id,
    'active',
    now(),
    now(),
    now() + make_interval(secs => greatest(coalesce(p_lease_seconds, 300), 1)),
    greatest(coalesce(p_attempt_number, 1), 1),
    p_idempotency_key
  )
  returning id into v_claim_id;

  update public.jobs
  set status = 'running',
      started_at = coalesce(started_at, now()),
      last_heartbeat_at = now(),
      progress_percent = greatest(progress_percent, 5),
      updated_at = now()
  where id = p_job_id;

  return jsonb_build_object('ok', true, 'status', 'active', 'workerJobClaimId', v_claim_id);
end;
$$;

create or replace function public.e2e_release_worker_job_claim(
  p_claim_id uuid,
  p_job_id uuid,
  p_worker_instance_id text,
  p_release_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_release_status text := coalesce(nullif(p_release_status, ''), 'released');
  v_claim_id uuid;
begin
  if v_release_status not in ('released', 'completed', 'failed', 'expired', 'cancelled') then
    raise exception 'E2E_RELEASE_STATUS_INVALID: invalid worker claim release status %', v_release_status;
  end if;

  update public.worker_job_claims
  set claim_status = v_release_status,
      released_at = now(),
      updated_at = now()
  where id = p_claim_id
    and job_id = p_job_id
    and worker_instance_id = p_worker_instance_id
    and claim_status = 'active'
  returning id into v_claim_id;

  if v_claim_id is null then
    raise exception 'E2E_WORKER_LEASE_EXPIRED: active claim % for job % was not found for worker %', p_claim_id, p_job_id, p_worker_instance_id;
  end if;

  return jsonb_build_object('ok', true, 'status', v_release_status, 'workerJobClaimId', v_claim_id);
end;
$$;

create or replace function public.e2e_record_preview_storage_object(
  p_workspace_id uuid,
  p_project_id uuid,
  p_render_id uuid,
  p_bucket_name text,
  p_object_path text,
  p_size_bytes bigint,
  p_checksum_sha256 text,
  p_region text default 'us-east1'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_storage_object_id uuid;
begin
  if p_bucket_name is null or length(trim(p_bucket_name)) = 0 or p_object_path is null or length(trim(p_object_path)) = 0 then
    raise exception 'E2E_STORAGE_OBJECT_INVALID: bucket and object path are required';
  end if;
  if p_object_path ilike '%signed%' or p_object_path like '%://%' or p_object_path like '%..%' then
    raise exception 'E2E_STORAGE_OBJECT_INVALID: canonical object path is unsafe';
  end if;

  insert into public.storage_object_records (
    workspace_id,
    project_id,
    render_id,
    bucket_name,
    object_path,
    object_purpose,
    mime_type,
    size_bytes,
    checksum_sha256,
    region,
    status
  )
  values (
    p_workspace_id,
    p_project_id,
    p_render_id,
    p_bucket_name,
    p_object_path,
    'preview_render',
    'video/mp4',
    p_size_bytes,
    p_checksum_sha256,
    case when p_region in ('us-east1', 'europe-west1') then p_region else 'us-east1' end,
    'ready'
  )
  on conflict (bucket_name, object_path) do update
    set render_id = excluded.render_id,
        size_bytes = excluded.size_bytes,
        checksum_sha256 = excluded.checksum_sha256,
        status = 'ready',
        updated_at = now()
  returning id into v_storage_object_id;

  return jsonb_build_object('ok', true, 'status', 'ready', 'previewStorageObjectId', v_storage_object_id);
end;
$$;

create or replace function public.e2e_record_preview_render_result(
  p_workspace_id uuid,
  p_project_id uuid,
  p_render_job_id uuid,
  p_job_id uuid,
  p_edit_plan_id uuid,
  p_approved_plan_snapshot_id uuid,
  p_credit_reservation_id uuid,
  p_preview_storage_object_id uuid,
  p_duration_seconds numeric,
  p_size_bytes bigint,
  p_checksum_sha256 text,
  p_metadata_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_render_job public.render_jobs%rowtype;
  v_storage public.storage_object_records%rowtype;
  v_render_id uuid;
begin
  perform public.e2e_assert_safe_json(coalesce(p_metadata_json, '{}'::jsonb), 'p_metadata_json');

  select * into v_render_job
  from public.render_jobs
  where id = p_render_job_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
    and job_id = p_job_id
    and credit_reservation_id = p_credit_reservation_id;
  if not found then
    raise exception 'E2E_RENDER_JOB_MISSING: render job % was not found', p_render_job_id;
  end if;

  select * into v_storage
  from public.storage_object_records
  where id = p_preview_storage_object_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
    and object_purpose = 'preview_render'
    and status = 'ready';
  if not found then
    raise exception 'E2E_STORAGE_OBJECT_NOT_FOUND: preview storage object % was not found', p_preview_storage_object_id;
  end if;

  select id into v_render_id
  from public.renders
  where render_job_id = p_render_job_id
    and job_id = p_job_id
  limit 1;

  if v_render_id is null then
    insert into public.renders (
      workspace_id,
      project_id,
      edit_plan_id,
      render_job_id,
      job_id,
      status,
      render_type,
      quality_level,
      output_format,
      display_name,
      storage_provider,
      storage_bucket,
      storage_path,
      file_size_bytes,
      duration_seconds,
      render_payload
    )
    values (
      p_workspace_id,
      p_project_id,
      p_edit_plan_id,
      p_render_job_id,
      p_job_id,
      'ready',
      'preview',
      'draft',
      'mp4',
      'RP-E2E RPC smoke preview',
      'local_private_storage',
      v_storage.bucket_name,
      v_storage.object_path,
      p_size_bytes,
      p_duration_seconds,
      jsonb_build_object(
        'rpE2eSmoke', true,
        'approvedPlanSnapshotId', p_approved_plan_snapshot_id,
        'creditReservationId', p_credit_reservation_id,
        'previewStorageObjectId', p_preview_storage_object_id,
        'checksumSha256', p_checksum_sha256,
        'metadata', coalesce(p_metadata_json, '{}'::jsonb)
      )
    )
    returning id into v_render_id;
  else
    update public.renders
    set status = 'ready',
        storage_provider = 'local_private_storage',
        storage_bucket = v_storage.bucket_name,
        storage_path = v_storage.object_path,
        file_size_bytes = p_size_bytes,
        duration_seconds = p_duration_seconds,
        render_payload = jsonb_build_object(
          'rpE2eSmoke', true,
          'approvedPlanSnapshotId', p_approved_plan_snapshot_id,
          'creditReservationId', p_credit_reservation_id,
          'previewStorageObjectId', p_preview_storage_object_id,
          'checksumSha256', p_checksum_sha256,
          'metadata', coalesce(p_metadata_json, '{}'::jsonb)
        ),
        updated_at = now()
    where id = v_render_id;
  end if;

  update public.storage_object_records
  set render_id = v_render_id,
      updated_at = now()
  where id = p_preview_storage_object_id;

  update public.render_jobs
  set status = 'completed',
      completed_at = now(),
      progress_percent = 90,
      progress_message = 'Preview render metadata recorded.',
      updated_at = now()
  where id = p_render_job_id;

  return jsonb_build_object('ok', true, 'status', 'ready', 'renderId', v_render_id);
end;
$$;

create or replace function public.e2e_record_preview_qa_result(
  p_workspace_id uuid,
  p_project_id uuid,
  p_render_id uuid,
  p_job_id uuid,
  p_overall_status text,
  p_summary text,
  p_checks_json jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_render public.renders%rowtype;
  v_status public.qa_report_status;
  v_item_status public.qa_report_item_status;
  v_qa_report_id uuid;
  v_check jsonb;
begin
  perform public.e2e_assert_safe_json(coalesce(p_checks_json, '[]'::jsonb), 'p_checks_json');
  if jsonb_typeof(coalesce(p_checks_json, '[]'::jsonb)) <> 'array' then
    raise exception 'E2E_QA_CHECKS_INVALID: QA checks must be a JSON array';
  end if;

  select * into v_render
  from public.renders
  where id = p_render_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
    and job_id = p_job_id;
  if not found then
    raise exception 'E2E_RENDER_NOT_READY: render % was not found for QA', p_render_id;
  end if;

  v_status := case
    when p_overall_status in ('passed', 'warning', 'failed') then p_overall_status::public.qa_report_status
    else 'failed'::public.qa_report_status
  end;
  v_item_status := case
    when v_status = 'passed' then 'passed'::public.qa_report_item_status
    when v_status = 'warning' then 'warning'::public.qa_report_item_status
    else 'failed'::public.qa_report_item_status
  end;

  insert into public.qa_reports (
    workspace_id,
    project_id,
    edit_plan_id,
    render_job_id,
    render_id,
    job_id,
    status,
    overall_score,
    summary,
    requires_retry,
    checked_by,
    qa_payload,
    completed_at
  )
  values (
    p_workspace_id,
    p_project_id,
    v_render.edit_plan_id,
    v_render.render_job_id,
    p_render_id,
    p_job_id,
    v_status,
    case when v_status = 'passed' then 100 when v_status = 'warning' then 75 else 0 end,
    p_summary,
    v_status = 'failed',
    'rp-e2e-service-role-rpc',
    jsonb_build_object('rpE2eSmoke', true, 'checks', coalesce(p_checks_json, '[]'::jsonb)),
    now()
  )
  returning id into v_qa_report_id;

  for v_check in select value from jsonb_array_elements(coalesce(p_checks_json, '[]'::jsonb)) loop
    insert into public.qa_report_items (
      qa_report_id,
      workspace_id,
      project_id,
      check_type,
      status,
      score,
      issue,
      recommendation,
      requires_retry,
      item_payload
    )
    values (
      v_qa_report_id,
      p_workspace_id,
      p_project_id,
      'other',
      v_item_status,
      case when v_item_status = 'passed' then 100 when v_item_status = 'warning' then 75 else 0 end,
      nullif(v_check->>'issue', ''),
      nullif(v_check->>'recommendation', ''),
      v_item_status = 'failed',
      v_check
    );
  end loop;

  return jsonb_build_object('ok', true, 'status', v_status, 'qaReportId', v_qa_report_id);
end;
$$;

create or replace function public.e2e_complete_render_job_preview_ready(
  p_workspace_id uuid,
  p_project_id uuid,
  p_job_id uuid,
  p_render_job_id uuid,
  p_render_id uuid,
  p_qa_report_id uuid,
  p_preview_storage_object_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event jsonb;
begin
  if not exists (
    select 1 from public.qa_reports
    where id = p_qa_report_id
      and render_id = p_render_id
      and status in ('passed', 'warning')
  ) then
    raise exception 'E2E_QA_BLOCKED_PREVIEW: QA report % does not allow preview-ready completion', p_qa_report_id;
  end if;

  if not exists (
    select 1 from public.storage_object_records
    where id = p_preview_storage_object_id
      and render_id = p_render_id
      and status = 'ready'
  ) then
    raise exception 'E2E_STORAGE_OBJECT_NOT_FOUND: preview storage object % is not ready', p_preview_storage_object_id;
  end if;

  update public.jobs
  set status = 'completed',
      completed_at = now(),
      progress_percent = 100,
      progress_message = 'Preview ready.',
      updated_at = now()
  where id = p_job_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_JOB_NOT_FOUND: job % was not found for completion', p_job_id;
  end if;

  update public.render_jobs
  set status = 'completed',
      completed_at = now(),
      progress_percent = 100,
      progress_message = 'Preview ready.',
      updated_at = now()
  where id = p_render_job_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;
  if not found then
    raise exception 'E2E_RENDER_JOB_MISSING: render job % was not found for completion', p_render_job_id;
  end if;

  update public.renders
  set status = 'ready',
      updated_at = now()
  where id = p_render_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;

  v_event := public.e2e_record_job_event(
    p_workspace_id,
    p_project_id,
    p_job_id,
    'completed',
    'Preview ready after no-AI RPC persisted render smoke.',
    100,
    jsonb_build_object(
      'renderJobId', p_render_job_id,
      'renderId', p_render_id,
      'qaReportId', p_qa_report_id,
      'previewStorageObjectId', p_preview_storage_object_id
    ),
    true
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'preview_ready',
    'jobId', p_job_id,
    'renderJobId', p_render_job_id,
    'renderId', p_render_id,
    'qaReportId', p_qa_report_id,
    'previewStorageObjectId', p_preview_storage_object_id,
    'jobEvent', v_event
  );
end;
$$;

revoke execute on function public.e2e_jsonb_has_secret_like_content(jsonb) from public, anon, authenticated;
revoke execute on function public.e2e_assert_safe_json(jsonb, text) from public, anon, authenticated;
revoke execute on function public.e2e_create_approved_plan_snapshot(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, jsonb, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.e2e_reserve_credits_for_smoke(uuid, uuid, uuid, uuid, uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.e2e_create_job_batch_and_render_job(uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.e2e_claim_worker_job(uuid, uuid, uuid, text, text, integer, integer, text) from public, anon, authenticated;
revoke execute on function public.e2e_release_worker_job_claim(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.e2e_record_job_event(uuid, uuid, uuid, text, text, numeric, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.e2e_record_preview_storage_object(uuid, uuid, uuid, text, text, bigint, text, text) from public, anon, authenticated;
revoke execute on function public.e2e_record_preview_render_result(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, numeric, bigint, text, jsonb) from public, anon, authenticated;
revoke execute on function public.e2e_record_preview_qa_result(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.e2e_complete_render_job_preview_ready(uuid, uuid, uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function public.e2e_create_approved_plan_snapshot(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, jsonb, text, text, text, text, text) to service_role;
grant execute on function public.e2e_reserve_credits_for_smoke(uuid, uuid, uuid, uuid, uuid, integer, text) to service_role;
grant execute on function public.e2e_create_job_batch_and_render_job(uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.e2e_claim_worker_job(uuid, uuid, uuid, text, text, integer, integer, text) to service_role;
grant execute on function public.e2e_release_worker_job_claim(uuid, uuid, text, text) to service_role;
grant execute on function public.e2e_record_job_event(uuid, uuid, uuid, text, text, numeric, jsonb, boolean) to service_role;
grant execute on function public.e2e_record_preview_storage_object(uuid, uuid, uuid, text, text, bigint, text, text) to service_role;
grant execute on function public.e2e_record_preview_render_result(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, numeric, bigint, text, jsonb) to service_role;
grant execute on function public.e2e_record_preview_qa_result(uuid, uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.e2e_complete_render_job_preview_ready(uuid, uuid, uuid, uuid, uuid, uuid, uuid) to service_role;

comment on function public.e2e_create_approved_plan_snapshot(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, jsonb, text, text, text, text, text) is
'Service-role-only RP-E2E smoke RPC. Creates immutable approved snapshots only after approved plan, approved credits, and reserved credits exist.';
comment on function public.e2e_reserve_credits_for_smoke(uuid, uuid, uuid, uuid, uuid, integer, text) is
'Service-role-only RP-E2E smoke RPC. Reserves credits for no-AI smoke tests only; not production billing.';
comment on function public.e2e_claim_worker_job(uuid, uuid, uuid, text, text, integer, integer, text) is
'Service-role-only RP-E2E smoke RPC. Prevents duplicate active worker claims before tool/render work.';
