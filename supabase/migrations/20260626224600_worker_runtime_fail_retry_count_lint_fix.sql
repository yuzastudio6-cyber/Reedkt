-- Fix Supabase linter ambiguity in worker_runtime.fail_tracka_private_e2e_job.
-- This migration does not execute workers, routes, providers, tools, media paths,
-- or beta/production unlocks. It only replaces the service-role-only RPC body.

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
      retry_count = v_job.retry_count + 1,
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

revoke all on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) from public;
revoke all on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) from anon;
revoke all on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) from authenticated;
grant execute on function worker_runtime.fail_tracka_private_e2e_job(uuid, text, text, timestamptz, text) to service_role;
