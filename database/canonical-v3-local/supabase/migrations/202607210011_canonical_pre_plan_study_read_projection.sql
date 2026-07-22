-- Canonical V3 local: authenticated server-only read projection for the
-- distributed pre-plan study state created by migration 010. This adds no
-- mutation, scheduler, worker, provider, billing, or production authority.

create or replace function public.reeditpro_read_pre_plan_study_projection_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  response_without_hash jsonb;
  work_items_value jsonb;
  read_at_value timestamptz := clock_timestamp();
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or coalesce(p_request->>'runId', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'
    or coalesce(p_request->>'idempotencyKey', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{15,239}$'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <> public.reeditpro_pre_plan_request_hash(
      'read_projection', p_request
    ) then
    raise exception using errcode = '22023', message = 'PRE_PLAN_READ_REQUEST_INVALID';
  end if;
  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);

  select * into run_row
  from public.preference_long_form_study_runs run_source
  where run_source.external_run_id = p_request->>'runId';
  if not found then return null; end if;
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_READ_DENIED';
  end if;
  select * into strict plan_row
  from public.preference_long_form_study_plans
  where id = run_row.study_plan_id;
  if plan_row.plan_json->>'seedHash' <> plan_row.seed_hash
    or plan_row.plan_json->'identity'->>'identityHash' <> run_row.study_identity_hash
    or plan_row.plan_json->>'runId' <> run_row.external_run_id then
    raise exception using errcode = '55000', message = 'PRE_PLAN_READ_LINEAGE_INVALID';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'seed', work.seed_json,
    'view', public.reeditpro_pre_plan_work_item_view(work.id),
    'latestAttempt', case when latest_attempt.id is null then null
      else public.reeditpro_pre_plan_attempt_view(latest_attempt.id) end
  ) order by work.sequence), '[]'::jsonb)
  into work_items_value
  from public.preference_long_form_study_work_items work
  left join lateral (
    select attempt.id
    from public.preference_long_form_study_attempts attempt
    where attempt.study_work_item_id = work.id
    order by attempt.attempt_number desc, attempt.started_at desc, attempt.id desc
    limit 1
  ) latest_attempt on true
  where work.study_run_id = run_row.id;

  response_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-read-projection-v1',
    'seed', plan_row.plan_json,
    'run', public.reeditpro_pre_plan_run_view(run_row.id),
    'workItems', work_items_value,
    'readAt', public.reeditpro_iso_timestamp(read_at_value),
    'boundaries', public.reeditpro_pre_plan_boundaries() || jsonb_build_object(
      'readProjectionOnly', true,
      'mutationAuthorityIncluded', false
    )
  );
  return response_without_hash || jsonb_build_object(
    'responseHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_read_projection_v1',
      response_without_hash
    )
  );
end;
$$;

revoke all on function public.reeditpro_read_pre_plan_study_projection_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_read_pre_plan_study_projection_v1(text,jsonb)
  to authenticated;
