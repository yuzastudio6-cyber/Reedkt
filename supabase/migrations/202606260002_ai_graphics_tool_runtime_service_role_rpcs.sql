-- AI graphics tool-runtime service-role queue RPCs.
-- Review/local migration only. Do not apply to production until staging SQL,
-- RLS, rollback, worker claim, private artifact, and owner approval evidence pass.
--
-- This migration prepares the database contract needed by the all-21 AI graphics
-- runtime lane. It does not execute tools, workers, providers/models,
-- browser/WebGL/canvas runtime, GPU/model runtime, media processing, GCS,
-- signed URLs, public artifacts, beta, or production unlocks.

do $$
begin
  alter type public.job_type add value if not exists 'ai_graphics_tool_runtime';
exception
  when duplicate_object then null;
end $$;

alter table public.job_batches
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict;

alter table public.jobs
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict;

create index if not exists job_batches_approved_plan_snapshot_id_idx
on public.job_batches (approved_plan_snapshot_id);

create index if not exists jobs_approved_plan_snapshot_id_idx
on public.jobs (approved_plan_snapshot_id);

create or replace function public.enqueue_ai_graphics_tool_runtime_jobs(
  p_workspace_id uuid,
  p_project_id uuid,
  p_approved_plan_snapshot_id uuid,
  p_credit_reservation_id uuid,
  p_jobs jsonb,
  p_idempotency_key text,
  p_chat_session_id uuid default null,
  p_edit_plan_id uuid default null,
  p_credit_estimate_id uuid default null,
  p_batch_name text default 'AI graphics tool runtime',
  p_created_by_user_id uuid default null,
  p_created_by_agent text default 'ai_graphics_service_role_queue'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_existing_batch_id uuid;
  v_job jsonb;
  v_job_id uuid;
  v_job_ids uuid[] := array[]::uuid[];
  v_job_count integer := 0;
  v_tool_id text;
  v_production_tool_id text;
  v_worker_type text;
  v_runtime_target text;
  v_private_manifest_ref text;
  v_job_idempotency_key text;
  v_runtime_type public.worker_runtime_type;
begin
  if p_workspace_id is null or p_project_id is null then
    raise exception 'workspace_id and project_id are required';
  end if;

  if p_approved_plan_snapshot_id is null or p_credit_reservation_id is null then
    raise exception 'approved_plan_snapshot_id and credit_reservation_id are required';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key is required';
  end if;

  if p_jobs is null or jsonb_typeof(p_jobs) <> 'array' or jsonb_array_length(p_jobs) = 0 then
    raise exception 'p_jobs must be a non-empty jsonb array';
  end if;

  if jsonb_array_length(p_jobs) > 21 then
    raise exception 'AI graphics tool-runtime enqueue is limited to 21 tools per batch';
  end if;

  if not exists (
    select 1
    from public.approved_plan_snapshots aps
    where aps.id = p_approved_plan_snapshot_id
      and aps.project_id = p_project_id
      and (aps.workspace_id is null or aps.workspace_id = p_workspace_id)
      and aps.immutable = true
      and aps.status in ('approved', 'locked')
      and aps.snapshot_status in ('approved', 'locked')
  ) then
    raise exception 'approved immutable plan snapshot is required before AI graphics tool-runtime enqueue';
  end if;

  if not exists (
    select 1
    from public.credit_reservations cr
    where cr.id = p_credit_reservation_id
      and cr.workspace_id = p_workspace_id
      and cr.project_id = p_project_id
      and cr.status in ('reserved', 'active', 'partially_spent')
      and (cr.expires_at is null or cr.expires_at > now())
  ) then
    raise exception 'active credit reservation is required before AI graphics tool-runtime enqueue';
  end if;

  select id
  into v_existing_batch_id
  from public.job_batches
  where idempotency_key = p_idempotency_key;

  if v_existing_batch_id is not null then
    select array_agg(id order by created_at, id)
    into v_job_ids
    from public.jobs
    where job_batch_id = v_existing_batch_id
      and job_type = 'ai_graphics_tool_runtime'::public.job_type;

    return jsonb_build_object(
      'jobBatchId', v_existing_batch_id,
      'jobIds', coalesce(to_jsonb(v_job_ids), '[]'::jsonb),
      'idempotentReplay', true,
      'liveToolExecutionPerformed', false
    );
  end if;

  insert into public.job_batches (
    workspace_id,
    project_id,
    chat_session_id,
    edit_plan_id,
    credit_estimate_id,
    credit_reservation_id,
    approved_plan_snapshot_id,
    status,
    batch_name,
    batch_purpose,
    current_stage,
    priority,
    created_by_user_id,
    created_by_agent,
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
    p_approved_plan_snapshot_id,
    'queued'::public.job_batch_status,
    coalesce(nullif(trim(p_batch_name), ''), 'AI graphics tool runtime'),
    'AI graphics tool-runtime queue batch. Service-role enqueue only; workers must claim before execution.',
    'queued',
    'normal'::public.job_priority,
    p_created_by_user_id,
    p_created_by_agent,
    p_idempotency_key,
    jsonb_build_object(
      'requestedToolCount', jsonb_array_length(p_jobs),
      'requestedTools', p_jobs,
      'approvedPlanSnapshotId', p_approved_plan_snapshot_id,
      'creditReservationId', p_credit_reservation_id
    ),
    jsonb_build_object(
      'source', 'ai_graphics_service_role_queue',
      'toolExecutionPerformed', false,
      'workerExecutionPerformed', false,
      'signedUrlCreated', false,
      'publicArtifactCreated', false
    )
  )
  returning id into v_batch_id;

  for v_job in select value from jsonb_array_elements(p_jobs)
  loop
    v_tool_id := v_job->>'toolId';
    v_production_tool_id := v_job->>'productionToolId';
    v_worker_type := v_job->>'workerType';
    v_runtime_target := v_job->>'runtimeTarget';
    v_private_manifest_ref := v_job->>'privateArtifactManifestRef';
    v_job_idempotency_key := coalesce(nullif(v_job->>'idempotencyKey', ''), p_idempotency_key || ':' || coalesce(v_tool_id, 'unknown'));
    v_job_id := null;
    v_runtime_type := case
      when v_worker_type = 'gpu_ai_worker' or v_runtime_target ilike '%gpu%' then 'gpu_worker'::public.worker_runtime_type
      else 'cloud_run_job'::public.worker_runtime_type
    end;

    if v_tool_id is null or v_production_tool_id is null or v_worker_type is null then
      raise exception 'Each AI graphics job requires toolId, productionToolId, and workerType';
    end if;

    if v_private_manifest_ref is null or v_private_manifest_ref not like 'private://%' then
      raise exception 'AI graphics jobs require private:// artifact manifest references';
    end if;

    if v_private_manifest_ref ~* '(signed.?url|public://|https?://|gcs://)' then
      raise exception 'AI graphics jobs cannot use signed URLs, public URLs, or raw GCS URLs as artifact truth';
    end if;

    select id
    into v_job_id
    from public.jobs
    where idempotency_key = v_job_idempotency_key;

    if v_job_id is null then
      insert into public.jobs (
        job_batch_id,
        workspace_id,
        project_id,
        chat_session_id,
        edit_plan_id,
        credit_estimate_id,
        credit_reservation_id,
        approved_plan_snapshot_id,
        job_type,
        status,
        priority,
        worker_target,
        runtime_type,
        job_name,
        job_description,
        input_payload,
        metadata,
        idempotency_key,
        max_attempts
      )
      values (
        v_batch_id,
        p_workspace_id,
        p_project_id,
        p_chat_session_id,
        p_edit_plan_id,
        p_credit_estimate_id,
        p_credit_reservation_id,
        p_approved_plan_snapshot_id,
        'ai_graphics_tool_runtime'::public.job_type,
        'queued'::public.job_status,
        coalesce(nullif(v_job->>'priority', '')::public.job_priority, 'normal'::public.job_priority),
        'system'::public.agent_type,
        v_runtime_type,
        'AI graphics tool runtime: ' || v_tool_id,
        'Queued AI graphics tool-runtime job. Claim and execution remain worker/service-role gated.',
        v_job,
        jsonb_build_object(
          'toolId', v_tool_id,
          'productionToolId', v_production_tool_id,
          'workerType', v_worker_type,
          'runtimeTarget', v_runtime_target,
          'privateArtifactManifestRef', v_private_manifest_ref,
          'agentCanExecuteToolsNow', false,
          'toolExecutionPerformed', false,
          'workerExecutionPerformed', false
        ),
        v_job_idempotency_key,
        coalesce(nullif(v_job->>'maxAttempts', '')::integer, 3)
      )
      returning id into v_job_id;

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
        v_job_id,
        v_batch_id,
        p_workspace_id,
        p_project_id,
        'queued'::public.job_event_type,
        'AI graphics tool-runtime job queued by service-role RPC.',
        0,
        'system'::public.event_actor_type,
        'system'::public.agent_type,
        jsonb_build_object(
          'toolId', v_tool_id,
          'productionToolId', v_production_tool_id,
          'workerType', v_worker_type,
          'runtimeTarget', v_runtime_target,
          'toolExecutionPerformed', false
        )
      );

      v_job_count := v_job_count + 1;
    end if;

    v_job_ids := array_append(v_job_ids, v_job_id);
  end loop;

  insert into public.audit_events (
    workspace_id,
    project_id,
    actor_user_id,
    event_type,
    event_json
  )
  values (
    p_workspace_id,
    p_project_id,
    p_created_by_user_id,
    'ai_graphics_tool_runtime_jobs_enqueued',
    jsonb_build_object(
      'jobBatchId', v_batch_id,
      'jobIds', v_job_ids,
      'insertedJobCount', v_job_count,
      'approvedPlanSnapshotId', p_approved_plan_snapshot_id,
      'creditReservationId', p_credit_reservation_id,
      'toolExecutionPerformed', false,
      'workerExecutionPerformed', false,
      'signedUrlCreated', false,
      'publicArtifactCreated', false
    )
  );

  return jsonb_build_object(
    'jobBatchId', v_batch_id,
    'jobIds', to_jsonb(v_job_ids),
    'insertedJobCount', v_job_count,
    'idempotentReplay', false,
    'liveToolExecutionPerformed', false
  );
end;
$$;

comment on function public.enqueue_ai_graphics_tool_runtime_jobs(
  uuid, uuid, uuid, uuid, jsonb, text, uuid, uuid, uuid, text, uuid, text
) is
'Service-role-only enqueue transaction for AI graphics tool-runtime jobs. Requires immutable approved snapshot, active credit reservation, private artifact manifest references, and idempotency. It queues jobs only; it does not execute tools.';

create or replace function public.claim_ai_graphics_tool_runtime_job(
  p_job_id uuid,
  p_worker_type text,
  p_worker_instance_id text,
  p_idempotency_key text,
  p_lease_seconds integer default 900
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs%rowtype;
  v_claim_id uuid;
  v_lease_expires_at timestamptz;
begin
  if p_job_id is null or p_worker_type is null or p_worker_instance_id is null then
    raise exception 'job_id, worker_type, and worker_instance_id are required';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key is required';
  end if;

  select *
  into v_job
  from public.jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'AI graphics job was not found';
  end if;

  if v_job.job_type <> 'ai_graphics_tool_runtime'::public.job_type then
    raise exception 'Only ai_graphics_tool_runtime jobs can use this claim RPC';
  end if;

  if v_job.status not in ('queued'::public.job_status, 'retrying'::public.job_status) then
    raise exception 'AI graphics job is not claimable in its current status';
  end if;

  if v_job.approved_plan_snapshot_id is null or v_job.credit_reservation_id is null then
    raise exception 'AI graphics job requires approved snapshot and credit reservation before claim';
  end if;

  if public.active_worker_claim_exists(p_job_id) then
    raise exception 'AI graphics job already has an active worker claim';
  end if;

  v_lease_expires_at := now() + make_interval(secs => greatest(60, coalesce(p_lease_seconds, 900)));

  insert into public.worker_job_claims (
    workspace_id,
    project_id,
    job_id,
    worker_type,
    worker_instance_id,
    claim_status,
    lease_expires_at,
    idempotency_key
  )
  values (
    v_job.workspace_id,
    v_job.project_id,
    p_job_id,
    p_worker_type,
    p_worker_instance_id,
    'active',
    v_lease_expires_at,
    p_idempotency_key
  )
  returning id into v_claim_id;

  update public.jobs
  set
    status = 'running'::public.job_status,
    locked_by = p_worker_instance_id,
    locked_at = now(),
    started_at = coalesce(started_at, now()),
    last_heartbeat_at = now(),
    updated_at = now(),
    metadata = metadata || jsonb_build_object(
      'claimedByWorkerType', p_worker_type,
      'workerClaimId', v_claim_id,
      'toolExecutionPerformed', false
    )
  where id = p_job_id;

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
    v_job.workspace_id,
    v_job.project_id,
    'started'::public.job_event_type,
    'AI graphics tool-runtime job claimed by service-role worker.',
    5,
    'worker'::public.event_actor_type,
    'system'::public.agent_type,
    jsonb_build_object(
      'workerType', p_worker_type,
      'workerInstanceId', p_worker_instance_id,
      'workerClaimId', v_claim_id,
      'toolExecutionPerformed', false
    )
  );

  return jsonb_build_object(
    'jobId', p_job_id,
    'workerClaimId', v_claim_id,
    'leaseExpiresAt', v_lease_expires_at,
    'toolExecutionPerformed', false
  );
end;
$$;

comment on function public.claim_ai_graphics_tool_runtime_job(uuid, text, text, text, integer) is
'Service-role-only claim transaction for queued ai_graphics_tool_runtime jobs. It claims and locks a job; it does not execute tools.';

create or replace function public.record_ai_graphics_worker_event(
  p_job_id uuid,
  p_event_type public.job_event_type,
  p_message text,
  p_payload jsonb default '{}'::jsonb,
  p_progress_percent numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs%rowtype;
  v_event_id uuid;
begin
  select *
  into v_job
  from public.jobs
  where id = p_job_id;

  if not found then
    raise exception 'AI graphics job was not found';
  end if;

  if v_job.job_type <> 'ai_graphics_tool_runtime'::public.job_type then
    raise exception 'Only ai_graphics_tool_runtime jobs can use this event RPC';
  end if;

  if p_payload::text ~* '(service.?role|api.?key|authorization|signed.?url|https?://)' then
    raise exception 'AI graphics worker event payload contains blocked secret or public URL token';
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
    v_job.workspace_id,
    v_job.project_id,
    p_event_type,
    p_message,
    p_progress_percent,
    'worker'::public.event_actor_type,
    'system'::public.agent_type,
    p_payload || jsonb_build_object('toolExecutionPerformed', false)
  )
  returning id into v_event_id;

  return jsonb_build_object('jobEventId', v_event_id, 'toolExecutionPerformed', false);
end;
$$;

comment on function public.record_ai_graphics_worker_event(uuid, public.job_event_type, text, jsonb, numeric) is
'Service-role-only append event helper for ai_graphics_tool_runtime jobs. Uses job_events as the canonical queue event table and rejects secrets, signed URLs, and public URLs.';

create or replace function public.record_ai_graphics_audit_event(
  p_workspace_id uuid,
  p_project_id uuid,
  p_event_type text,
  p_event_json jsonb default '{}'::jsonb,
  p_actor_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_event_id uuid;
begin
  if p_event_json::text ~* '(service.?role|api.?key|authorization|signed.?url|https?://)' then
    raise exception 'AI graphics audit payload contains blocked secret or public URL token';
  end if;

  insert into public.audit_events (
    workspace_id,
    project_id,
    actor_user_id,
    event_type,
    event_json
  )
  values (
    p_workspace_id,
    p_project_id,
    p_actor_user_id,
    p_event_type,
    p_event_json || jsonb_build_object('toolExecutionPerformed', false)
  )
  returning id into v_audit_event_id;

  return jsonb_build_object('auditEventId', v_audit_event_id, 'toolExecutionPerformed', false);
end;
$$;

comment on function public.record_ai_graphics_audit_event(uuid, uuid, text, jsonb, uuid) is
'Service-role-only append audit helper for AI graphics queue/runtime state changes. It rejects secrets, signed URLs, and public URLs.';

revoke execute on function public.enqueue_ai_graphics_tool_runtime_jobs(
  uuid, uuid, uuid, uuid, jsonb, text, uuid, uuid, uuid, text, uuid, text
) from public, anon, authenticated;
revoke execute on function public.claim_ai_graphics_tool_runtime_job(
  uuid, text, text, text, integer
) from public, anon, authenticated;
revoke execute on function public.record_ai_graphics_worker_event(
  uuid, public.job_event_type, text, jsonb, numeric
) from public, anon, authenticated;
revoke execute on function public.record_ai_graphics_audit_event(
  uuid, uuid, text, jsonb, uuid
) from public, anon, authenticated;

grant execute on function public.enqueue_ai_graphics_tool_runtime_jobs(
  uuid, uuid, uuid, uuid, jsonb, text, uuid, uuid, uuid, text, uuid, text
) to service_role;
grant execute on function public.claim_ai_graphics_tool_runtime_job(
  uuid, text, text, text, integer
) to service_role;
grant execute on function public.record_ai_graphics_worker_event(
  uuid, public.job_event_type, text, jsonb, numeric
) to service_role;
grant execute on function public.record_ai_graphics_audit_event(
  uuid, uuid, text, jsonb, uuid
) to service_role;
