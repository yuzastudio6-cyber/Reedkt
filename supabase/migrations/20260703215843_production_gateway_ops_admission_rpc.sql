-- ReEditPro production gateway operations admission RPC.
-- This is a backend/service-role-only atomic admission helper for paid-production tool dispatch.
-- It does not run tools, call providers, call Stripe, process media, or approve production by itself.

create or replace function public.claim_production_gateway_worker_lease(
  p_workspace_id uuid,
  p_project_id uuid,
  p_job_id uuid,
  p_worker_id text,
  p_worker_kind text,
  p_lease_token text,
  p_expires_at timestamptz,
  p_workspace_job_creation_limit integer,
  p_project_concurrent_limit integer,
  p_worker_concurrent_limit integer,
  p_request_path_pattern text default '%/v1/tool-executions/dispatch%',
  p_now timestamptz default now(),
  p_render_mode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  workspace_job_count integer := 0;
  project_active_count integer := 0;
  worker_active_count integer := 0;
  lease_id uuid;
begin
  if p_workspace_id is null then
    raise exception 'workspace id is required';
  end if;

  if p_project_id is null then
    raise exception 'project id is required';
  end if;

  if p_job_id is null then
    raise exception 'job id is required';
  end if;

  if p_worker_id is null or length(trim(p_worker_id)) = 0 then
    raise exception 'worker id is required';
  end if;

  if p_worker_kind is null or length(trim(p_worker_kind)) = 0 then
    raise exception 'worker kind is required';
  end if;

  if p_lease_token is null or length(trim(p_lease_token)) = 0 then
    raise exception 'lease token is required';
  end if;

  if p_expires_at is null or p_expires_at <= v_now then
    raise exception 'lease expiry must be in the future';
  end if;

  if p_workspace_job_creation_limit is null or p_workspace_job_creation_limit <= 0 then
    raise exception 'workspace job creation limit is required';
  end if;

  if p_project_concurrent_limit is null or p_project_concurrent_limit <= 0 then
    raise exception 'project concurrency limit is required';
  end if;

  if p_worker_concurrent_limit is null or p_worker_concurrent_limit <= 0 then
    raise exception 'worker concurrency limit is required';
  end if;

  -- Serialize admission per workspace so rate/concurrency counts and lease creation are one decision.
  perform pg_advisory_xact_lock(
    hashtext('reeditpro_production_gateway_ops_admission'),
    hashtext(p_workspace_id::text)
  );

  select count(*)::integer
    into workspace_job_count
    from public.api_idempotency_keys
    where workspace_id = p_workspace_id
      and request_method = 'POST'
      and request_path ilike coalesce(nullif(p_request_path_pattern, ''), '%/v1/tool-executions/dispatch%')
      and created_at >= v_now - interval '1 hour';

  if workspace_job_count >= p_workspace_job_creation_limit then
    raise exception 'production workspace rate limit exceeded: % of %', workspace_job_count, p_workspace_job_creation_limit;
  end if;

  select count(*)::integer
    into project_active_count
    from public.worker_leases
    where workspace_id = p_workspace_id
      and project_id = p_project_id
      and status in ('claimed', 'active', 'renewed')
      and expires_at > v_now;

  if project_active_count >= p_project_concurrent_limit then
    raise exception 'production project concurrency limit exceeded: % of %', project_active_count, p_project_concurrent_limit;
  end if;

  select count(*)::integer
    into worker_active_count
    from public.worker_leases
    where workspace_id = p_workspace_id
      and worker_kind = p_worker_kind
      and status in ('claimed', 'active', 'renewed')
      and expires_at > v_now;

  if worker_active_count >= p_worker_concurrent_limit then
    raise exception 'production worker concurrency limit exceeded: % of %', worker_active_count, p_worker_concurrent_limit;
  end if;

  insert into public.worker_leases (
    workspace_id,
    project_id,
    job_id,
    worker_id,
    worker_kind,
    status,
    lease_token,
    claimed_at,
    heartbeat_at,
    expires_at,
    metadata
  )
  values (
    p_workspace_id,
    p_project_id,
    p_job_id,
    p_worker_id,
    p_worker_kind,
    'claimed',
    p_lease_token,
    v_now,
    v_now,
    p_expires_at,
    jsonb_build_object(
      'production_gateway_ops_admission', true,
      'render_mode', p_render_mode,
      'stripe_call_attempted', false,
      'service_fee_included', false
    )
  )
  returning id into lease_id;

  return jsonb_build_object(
    'leaseId', lease_id,
    'workspaceJobCreationCountLastHour', workspace_job_count,
    'projectActiveJobCount', project_active_count,
    'workerActiveJobCount', worker_active_count
  );
exception
  when unique_violation then
    raise exception 'production worker lease claim conflict for job %', p_job_id;
end;
$$;

comment on function public.claim_production_gateway_worker_lease(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  integer,
  integer,
  integer,
  text,
  timestamptz,
  text
) is
'Atomically checks production gateway rate/concurrency limits and claims a worker_leases admission row. Requires service-role/backend use and does not run tools, call Stripe, process media, or approve production.';

revoke all on function public.claim_production_gateway_worker_lease(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  integer,
  integer,
  integer,
  text,
  timestamptz,
  text
) from public;
revoke all on function public.claim_production_gateway_worker_lease(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  integer,
  integer,
  integer,
  text,
  timestamptz,
  text
) from anon;
revoke all on function public.claim_production_gateway_worker_lease(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  integer,
  integer,
  integer,
  text,
  timestamptz,
  text
) from authenticated;
grant execute on function public.claim_production_gateway_worker_lease(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  integer,
  integer,
  integer,
  text,
  timestamptz,
  text
) to service_role;
