-- ReEditPro canonical V3 local baseline: V6 security and transactional RPCs.

create or replace function public.reeditpro_canonical_json(p_value jsonb)
returns text
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare
  rendered text;
begin
  case jsonb_typeof(p_value)
    when 'object' then
      select '{' || coalesce(string_agg(to_jsonb(entry.key)::text || ':' || public.reeditpro_canonical_json(entry.value), ',' order by entry.key), '') || '}'
        into rendered
        from jsonb_each(p_value) as entry;
      return rendered;
    when 'array' then
      select '[' || coalesce(string_agg(public.reeditpro_canonical_json(entry.value), ',' order by entry.ordinality), '') || ']'
        into rendered
        from jsonb_array_elements(p_value) with ordinality as entry(value, ordinality);
      return rendered;
    else
      return p_value::text;
  end case;
end;
$$;

create or replace function public.enqueue_edit_reference_long_form_study_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  workspace_uuid uuid := (p_request->>'workspaceId')::uuid;
  reference_uuid uuid := (p_request->>'editReferenceId')::uuid;
  study_uuid uuid := (p_request->>'studySessionId')::uuid;
  source_asset_uuid uuid := (p_request->>'sourceAssetId')::uuid;
  plan_uuid uuid := extensions.gen_random_uuid();
  run_uuid uuid := extensions.gen_random_uuid();
  existing_plan public.preference_long_form_study_plans%rowtype;
  work_item jsonb;
  work_item_count integer := 0;
  cost_sum numeric := 0;
begin
  if p_request->>'authorityClass' <> 'pre_plan_edit_reference_long_form_study'
    or coalesce(p_request->>'planDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'sourceChecksumSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'rateCardSnapshotDigest', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'studyUsageApprovalStatus' <> 'approved'
    or p_request->>'currency' <> 'USD'
    or jsonb_typeof(p_request->'workItems') <> 'array'
    or jsonb_array_length(p_request->'workItems') < 1 then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_LONG_FORM_ENQUEUE_INVALID';
  end if;
  if not exists (
    select 1 from public.preference_assets asset
    where asset.id = source_asset_uuid and asset.workspace_id = workspace_uuid
      and asset.edit_reference_id = reference_uuid and asset.study_session_id = study_uuid
      and asset.checksum_sha256 = p_request->>'sourceChecksumSha256'
  ) then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_LONG_FORM_SOURCE_CHANGED';
  end if;
  select * into existing_plan from public.preference_long_form_study_plans plan_source
    where plan_source.study_session_id = study_uuid
      and plan_source.plan_version = (p_request->>'planVersion')::bigint;
  if found then
    if existing_plan.plan_digest <> p_request->>'planDigest' then
      raise exception using errcode = '23505', message = 'EDIT_REFERENCE_LONG_FORM_PLAN_VERSION_CONFLICT';
    end if;
    select id into run_uuid from public.preference_long_form_study_runs where study_plan_id = existing_plan.id;
    return next jsonb_build_object(
      'studyPlanId', existing_plan.id::text,
      'studyRunId', run_uuid::text,
      'replayed', true,
      'approvedEditPlanSnapshotFabricated', false,
      'approvedEditCreditReservationFabricated', false
    );
    return;
  end if;

  for work_item in select value from jsonb_array_elements(p_request->'workItems') loop
    if (work_item->>'sequence')::bigint < 1
      or coalesce(work_item->>'dependencyDigest', '') !~ '^[a-f0-9]{64}$'
      or coalesce(work_item->>'idempotencyKeyHash', '') !~ '^[a-f0-9]{64}$'
      or (work_item->>'maximumAuthorizedInternalCostMicros')::bigint < 0
      or jsonb_typeof(coalesce(work_item->'dependencySequences', '[]'::jsonb)) <> 'array' then
      raise exception using errcode = '22023', message = 'EDIT_REFERENCE_LONG_FORM_WORK_ITEM_INVALID';
    end if;
    if exists (
      select 1 from jsonb_array_elements_text(coalesce(work_item->'dependencySequences', '[]'::jsonb)) dependency
      where dependency.value::bigint >= (work_item->>'sequence')::bigint
    ) then
      raise exception using errcode = '23514', message = 'EDIT_REFERENCE_LONG_FORM_DEPENDENCY_ORDER_INVALID';
    end if;
    work_item_count := work_item_count + 1;
    cost_sum := cost_sum + (work_item->>'maximumAuthorizedInternalCostMicros')::bigint;
  end loop;
  if cost_sum > (p_request->>'maximumAuthorizedInternalCostMicros')::bigint then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_LONG_FORM_PLAN_COST_CEILING_INVALID';
  end if;

  insert into public.preference_long_form_study_plans (
    id, workspace_id, edit_reference_id, study_session_id, source_asset_id,
    plan_version, plan_digest, source_checksum_sha256, rate_card_snapshot_digest,
    maximum_authorized_internal_cost_micros, currency, study_usage_approval_status, plan_json
  ) values (
    plan_uuid, workspace_uuid, reference_uuid, study_uuid, source_asset_uuid,
    (p_request->>'planVersion')::bigint, p_request->>'planDigest',
    p_request->>'sourceChecksumSha256', p_request->>'rateCardSnapshotDigest',
    (p_request->>'maximumAuthorizedInternalCostMicros')::bigint,
    'USD', 'approved', p_request - 'workItems'
  );
  insert into public.preference_long_form_study_runs (
    id, workspace_id, edit_reference_id, study_session_id, study_plan_id,
    revision, status, recovery_generation
  ) values (
    run_uuid, workspace_uuid, reference_uuid, study_uuid, plan_uuid, 1, 'queued', 0
  );
  for work_item in select value from jsonb_array_elements(p_request->'workItems') loop
    insert into public.preference_long_form_study_work_items (
      workspace_id, edit_reference_id, study_session_id, study_plan_id,
      study_run_id, sequence, work_type, dependency_digest, dependency_sequences,
      idempotency_key_hash, status, maximum_authorized_internal_cost_micros
    ) values (
      workspace_uuid, reference_uuid, study_uuid, plan_uuid, run_uuid,
      (work_item->>'sequence')::bigint, work_item->>'workType',
      work_item->>'dependencyDigest',
      array(select value::bigint from jsonb_array_elements_text(coalesce(work_item->'dependencySequences', '[]'::jsonb))),
      work_item->>'idempotencyKeyHash', 'queued',
      (work_item->>'maximumAuthorizedInternalCostMicros')::bigint
    );
  end loop;
  update public.preference_long_form_study_work_items target
    set dependency_ids = coalesce((
      select array_agg(dependency.id order by dependency.sequence)
      from public.preference_long_form_study_work_items dependency
      where dependency.study_run_id = target.study_run_id
        and dependency.sequence = any(target.dependency_sequences)
    ), '{}'::uuid[])
    where target.study_run_id = run_uuid;
  if exists (
    select 1 from public.preference_long_form_study_work_items target
    where target.study_run_id = run_uuid
      and cardinality(target.dependency_ids) <> cardinality(target.dependency_sequences)
  ) then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_LONG_FORM_DEPENDENCY_MISSING';
  end if;
  return next jsonb_build_object(
    'studyPlanId', plan_uuid::text,
    'studyRunId', run_uuid::text,
    'workItemCount', work_item_count,
    'status', 'queued',
    'replayed', false,
    'approvedEditPlanSnapshotFabricated', false,
    'approvedEditCreditReservationFabricated', false,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false
  );
end;
$$;

create or replace function public.claim_edit_reference_long_form_work_item_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run_uuid uuid := (p_request->>'studyRunId')::uuid;
  work_row public.preference_long_form_study_work_items%rowtype;
begin
  if coalesce(p_request->>'leaseOwnerDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'leaseTokenDigest', '') !~ '^[a-f0-9]{64}$'
    or (p_request->>'leaseExpiresAt')::timestamptz <= clock_timestamp() then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_LONG_FORM_LEASE_INVALID';
  end if;
  select candidate.* into work_row
    from public.preference_long_form_study_work_items candidate
    join public.preference_long_form_study_runs run_source on run_source.id = candidate.study_run_id
    where candidate.study_run_id = run_uuid
      and candidate.status = 'queued'
      and run_source.status in ('queued', 'running')
      and not exists (
        select 1 from unnest(candidate.dependency_ids) dependency_id
        left join public.preference_long_form_study_work_items dependency on dependency.id = dependency_id
        where dependency.id is null or dependency.status <> 'completed'
      )
    order by candidate.sequence
    for update of candidate skip locked
    limit 1;
  if not found then
    return;
  end if;
  update public.preference_long_form_study_work_items
    set status = 'leased', attempt_count = attempt_count + 1,
        lease_owner_digest = p_request->>'leaseOwnerDigest',
        lease_token_digest = p_request->>'leaseTokenDigest',
        lease_expires_at = (p_request->>'leaseExpiresAt')::timestamptz,
        updated_at = clock_timestamp()
    where id = work_row.id;
  update public.preference_long_form_study_runs
    set status = 'running', revision = revision + 1, updated_at = clock_timestamp()
    where id = run_uuid and status = 'queued';
  return next jsonb_build_object(
    'studyWorkItemId', work_row.id::text,
    'sequence', work_row.sequence,
    'workType', work_row.work_type,
    'attemptNumber', work_row.attempt_count + 1,
    'leaseExpiresAt', p_request->>'leaseExpiresAt',
    'maximumAuthorizedInternalCostMicros', work_row.maximum_authorized_internal_cost_micros
  );
end;
$$;

create or replace function public.heartbeat_edit_reference_long_form_work_item_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  work_uuid uuid := (p_request->>'studyWorkItemId')::uuid;
  work_row public.preference_long_form_study_work_items%rowtype;
  next_sequence bigint;
begin
  select * into work_row from public.preference_long_form_study_work_items work_source
    where work_source.id = work_uuid for update;
  next_sequence := work_row.checkpoint_sequence + 1;
  if not found or work_row.status not in ('leased', 'running')
    or work_row.lease_token_digest <> p_request->>'leaseTokenDigest'
    or work_row.lease_expires_at <= clock_timestamp()
    or (p_request->>'checkpointSequence')::bigint <> next_sequence
    or coalesce(p_request->>'checkpointDigest', '') !~ '^[a-f0-9]{64}$'
    or (p_request->>'completedUnitCount')::bigint < 0
    or (p_request->>'leaseExpiresAt')::timestamptz <= work_row.lease_expires_at then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_HEARTBEAT_CHANGED';
  end if;
  insert into public.preference_long_form_study_checkpoint_authority (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, sequence, checkpoint_digest,
    completed_unit_count, heartbeat_at
  ) values (
    work_row.workspace_id, work_row.edit_reference_id, work_row.study_session_id,
    work_row.study_plan_id, work_row.study_run_id, work_uuid, next_sequence,
    p_request->>'checkpointDigest', (p_request->>'completedUnitCount')::bigint,
    clock_timestamp()
  );
  update public.preference_long_form_study_work_items
    set status = 'running', checkpoint_sequence = next_sequence,
        lease_expires_at = (p_request->>'leaseExpiresAt')::timestamptz,
        updated_at = clock_timestamp()
    where id = work_uuid;
  return next jsonb_build_object(
    'studyWorkItemId', work_uuid::text,
    'checkpointSequence', next_sequence,
    'status', 'running',
    'leaseExpiresAt', p_request->>'leaseExpiresAt'
  );
end;
$$;

create or replace function public.complete_edit_reference_long_form_work_item_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  work_uuid uuid := (p_request->>'studyWorkItemId')::uuid;
  work_row public.preference_long_form_study_work_items%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  attempt_uuid uuid := extensions.gen_random_uuid();
  output_uuid uuid := extensions.gen_random_uuid();
  provider_cost bigint := (p_request->>'providerCostMicros')::bigint;
  infrastructure_cost bigint := (p_request->>'infrastructureCostMicros')::bigint;
  total_cost bigint;
  aggregate_cost bigint;
  remaining_count integer;
begin
  select * into work_row from public.preference_long_form_study_work_items work_source
    where work_source.id = work_uuid for update;
  if not found or work_row.status not in ('leased', 'running')
    or work_row.lease_token_digest <> p_request->>'leaseTokenDigest'
    or work_row.lease_expires_at <= clock_timestamp()
    or coalesce(p_request->>'usageDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'outputDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'checksumSha256', '') !~ '^[a-f0-9]{64}$'
    or provider_cost < 0 or infrastructure_cost < 0 then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_COMPLETION_CHANGED';
  end if;
  total_cost := provider_cost + infrastructure_cost;
  if total_cost > work_row.maximum_authorized_internal_cost_micros then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_LONG_FORM_WORK_ITEM_COST_EXCEEDED';
  end if;
  select * into plan_row from public.preference_long_form_study_plans where id = work_row.study_plan_id;
  select coalesce(sum(internal_cost_micros), 0) + total_cost into aggregate_cost
    from public.preference_long_form_study_attempts where study_run_id = work_row.study_run_id;
  if aggregate_cost > plan_row.maximum_authorized_internal_cost_micros then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_LONG_FORM_PLAN_COST_EXCEEDED';
  end if;
  insert into public.preference_long_form_study_attempts (
    id, workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, attempt_number, status, usage_digest,
    provider_cost_micros, infrastructure_cost_micros, internal_cost_micros,
    currency, failure_class, started_at, finished_at
  ) values (
    attempt_uuid, work_row.workspace_id, work_row.edit_reference_id,
    work_row.study_session_id, work_row.study_plan_id, work_row.study_run_id,
    work_uuid, work_row.attempt_count, 'completed', p_request->>'usageDigest',
    provider_cost, infrastructure_cost, total_cost, 'USD', null,
    coalesce((p_request->>'startedAt')::timestamptz, clock_timestamp()), clock_timestamp()
  );
  insert into public.preference_long_form_study_checkpoints (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, study_attempt_id, sequence,
    checkpoint_digest, completed_unit_count, heartbeat_at, created_at
  ) select
    authority.workspace_id, authority.edit_reference_id, authority.study_session_id,
    authority.study_plan_id, authority.study_run_id, authority.study_work_item_id,
    attempt_uuid, authority.sequence, authority.checkpoint_digest,
    authority.completed_unit_count, authority.heartbeat_at, authority.created_at
  from public.preference_long_form_study_checkpoint_authority authority
  where authority.study_work_item_id = work_uuid
    and not exists (
      select 1
      from public.preference_long_form_study_checkpoints persisted
      where persisted.study_work_item_id = authority.study_work_item_id
        and persisted.sequence = authority.sequence
    )
  order by authority.sequence;
  insert into public.preference_long_form_study_work_outputs (
    id, workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, study_attempt_id, output_type,
    output_digest, storage_object_id, storage_generation, storage_etag,
    checksum_sha256
  ) values (
    output_uuid, work_row.workspace_id, work_row.edit_reference_id,
    work_row.study_session_id, work_row.study_plan_id, work_row.study_run_id,
    work_uuid, attempt_uuid, p_request->>'outputType', p_request->>'outputDigest',
    p_request->>'storageObjectId', p_request->>'storageGeneration',
    p_request->>'storageEtag', p_request->>'checksumSha256'
  );
  update public.preference_long_form_study_work_items
    set status = 'completed', lease_owner_digest = null, lease_token_digest = null,
        lease_expires_at = null, updated_at = clock_timestamp()
    where id = work_uuid;
  select count(*) into remaining_count from public.preference_long_form_study_work_items
    where study_run_id = work_row.study_run_id and status <> 'completed';
  if remaining_count = 0 then
    update public.preference_long_form_study_runs
      set status = 'completed', revision = revision + 1, updated_at = clock_timestamp()
      where id = work_row.study_run_id;
  end if;
  return next jsonb_build_object(
    'studyWorkItemId', work_uuid::text,
    'studyAttemptId', attempt_uuid::text,
    'workOutputId', output_uuid::text,
    'status', 'completed',
    'internalCostMicros', total_cost,
    'failedAttemptCostRetained', true,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false
  );
end;
$$;

create or replace function public.fail_edit_reference_long_form_work_item_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  work_uuid uuid := (p_request->>'studyWorkItemId')::uuid;
  work_row public.preference_long_form_study_work_items%rowtype;
  attempt_uuid uuid := extensions.gen_random_uuid();
  provider_cost bigint := (p_request->>'providerCostMicros')::bigint;
  infrastructure_cost bigint := (p_request->>'infrastructureCostMicros')::bigint;
  total_cost bigint := provider_cost + infrastructure_cost;
  next_status text;
begin
  select * into work_row from public.preference_long_form_study_work_items work_source
    where work_source.id = work_uuid for update;
  if not found or work_row.status not in ('leased', 'running')
    or work_row.lease_token_digest <> p_request->>'leaseTokenDigest'
    or work_row.lease_expires_at <= clock_timestamp()
    or coalesce(p_request->>'usageDigest', '') !~ '^[a-f0-9]{64}$'
    or length(btrim(p_request->>'failureClass')) < 1
    or total_cost < 0
    or total_cost > work_row.maximum_authorized_internal_cost_micros then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_FAILURE_CHANGED';
  end if;
  next_status := case when coalesce((p_request->>'retryAllowed')::boolean, false) then 'queued' else 'failed' end;
  insert into public.preference_long_form_study_attempts (
    id, workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, attempt_number, status, usage_digest,
    provider_cost_micros, infrastructure_cost_micros, internal_cost_micros,
    currency, failure_class, started_at, finished_at
  ) values (
    attempt_uuid, work_row.workspace_id, work_row.edit_reference_id,
    work_row.study_session_id, work_row.study_plan_id, work_row.study_run_id,
    work_uuid, work_row.attempt_count, 'failed', p_request->>'usageDigest',
    provider_cost, infrastructure_cost, total_cost, 'USD', p_request->>'failureClass',
    coalesce((p_request->>'startedAt')::timestamptz, clock_timestamp()), clock_timestamp()
  );
  insert into public.preference_long_form_study_checkpoints (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, study_attempt_id, sequence,
    checkpoint_digest, completed_unit_count, heartbeat_at, created_at
  ) select
    authority.workspace_id, authority.edit_reference_id, authority.study_session_id,
    authority.study_plan_id, authority.study_run_id, authority.study_work_item_id,
    attempt_uuid, authority.sequence, authority.checkpoint_digest,
    authority.completed_unit_count, authority.heartbeat_at, authority.created_at
  from public.preference_long_form_study_checkpoint_authority authority
  where authority.study_work_item_id = work_uuid
    and not exists (
      select 1
      from public.preference_long_form_study_checkpoints persisted
      where persisted.study_work_item_id = authority.study_work_item_id
        and persisted.sequence = authority.sequence
    )
  order by authority.sequence;
  update public.preference_long_form_study_work_items
    set status = next_status, lease_owner_digest = null, lease_token_digest = null,
        lease_expires_at = null, updated_at = clock_timestamp()
    where id = work_uuid;
  if next_status = 'failed' then
    update public.preference_long_form_study_runs
      set status = 'failed', revision = revision + 1, updated_at = clock_timestamp()
      where id = work_row.study_run_id;
  end if;
  return next jsonb_build_object(
    'studyWorkItemId', work_uuid::text,
    'studyAttemptId', attempt_uuid::text,
    'status', next_status,
    'failedAttemptCostRetained', true,
    'internalCostMicros', total_cost
  );
end;
$$;

create or replace function public.pause_edit_reference_long_form_study_v1(p_study_run_id uuid, p_expected_revision bigint)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare affected integer;
begin
  update public.preference_long_form_study_runs
    set status = 'paused', pause_requested_at = clock_timestamp(),
        revision = revision + 1, updated_at = clock_timestamp()
    where id = p_study_run_id and revision = p_expected_revision and status in ('queued', 'running');
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_PAUSE_CHANGED'; end if;
  update public.preference_long_form_study_work_items set status = 'paused', updated_at = clock_timestamp()
    where study_run_id = p_study_run_id and status = 'queued';
  return next jsonb_build_object('studyRunId', p_study_run_id::text, 'status', 'paused');
end;
$$;

create or replace function public.resume_edit_reference_long_form_study_v1(p_study_run_id uuid, p_expected_revision bigint)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare affected integer;
begin
  update public.preference_long_form_study_runs
    set status = 'queued', pause_requested_at = null,
        recovery_generation = recovery_generation + 1,
        revision = revision + 1, updated_at = clock_timestamp()
    where id = p_study_run_id and revision = p_expected_revision and status = 'paused';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_RESUME_CHANGED'; end if;
  update public.preference_long_form_study_work_items set status = 'queued', updated_at = clock_timestamp()
    where study_run_id = p_study_run_id and status = 'paused';
  return next jsonb_build_object('studyRunId', p_study_run_id::text, 'status', 'queued');
end;
$$;

create or replace function public.cancel_edit_reference_long_form_study_v1(p_study_run_id uuid, p_expected_revision bigint)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare affected integer;
begin
  update public.preference_long_form_study_runs
    set status = 'cancelled', cancel_requested_at = clock_timestamp(),
        revision = revision + 1, updated_at = clock_timestamp()
    where id = p_study_run_id and revision = p_expected_revision
      and status not in ('completed', 'failed', 'cancelled');
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_CANCEL_CHANGED'; end if;
  update public.preference_long_form_study_work_items
    set status = 'cancelled', lease_owner_digest = null, lease_token_digest = null,
        lease_expires_at = null, updated_at = clock_timestamp()
    where study_run_id = p_study_run_id and status not in ('completed', 'failed', 'cancelled');
  return next jsonb_build_object('studyRunId', p_study_run_id::text, 'status', 'cancelled', 'unusedInternalBudgetReleased', true);
end;
$$;

create or replace function public.recover_expired_edit_reference_long_form_lease_v1(p_study_work_item_id uuid)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  work_row public.preference_long_form_study_work_items%rowtype;
begin
  select * into work_row from public.preference_long_form_study_work_items work_source
    where work_source.id = p_study_work_item_id for update;
  if not found or work_row.status not in ('leased', 'running') or work_row.lease_expires_at > clock_timestamp() then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_LONG_FORM_LEASE_NOT_EXPIRED';
  end if;
  update public.preference_long_form_study_work_items
    set status = 'queued', lease_owner_digest = null, lease_token_digest = null,
        lease_expires_at = null, updated_at = clock_timestamp()
    where id = p_study_work_item_id;
  update public.preference_long_form_study_runs
    set status = 'queued', recovery_generation = recovery_generation + 1,
        revision = revision + 1, updated_at = clock_timestamp()
    where id = work_row.study_run_id and status not in ('paused', 'cancelled', 'completed', 'failed');
  return next jsonb_build_object(
    'studyWorkItemId', p_study_work_item_id::text,
    'status', 'queued',
    'expiredLeaseRecovered', true
  );
end;
$$;

do $$
declare
  signature text;
begin
  foreach signature in array array[
    'enqueue_edit_reference_long_form_study_v1(jsonb)',
    'claim_edit_reference_long_form_work_item_v1(jsonb)',
    'heartbeat_edit_reference_long_form_work_item_v1(jsonb)',
    'complete_edit_reference_long_form_work_item_v1(jsonb)',
    'fail_edit_reference_long_form_work_item_v1(jsonb)',
    'pause_edit_reference_long_form_study_v1(uuid,bigint)',
    'resume_edit_reference_long_form_study_v1(uuid,bigint)',
    'cancel_edit_reference_long_form_study_v1(uuid,bigint)',
    'recover_expired_edit_reference_long_form_lease_v1(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', signature);
    execute format('grant execute on function public.%s to service_role', signature);
  end loop;
end;
$$;

create or replace function public.reeditpro_sha256_json(p_value jsonb)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public, extensions
as $$
  select encode(extensions.digest(convert_to(public.reeditpro_canonical_json(p_value), 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function public.reeditpro_iso_timestamp(p_value timestamptz)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select to_char(p_value at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

create or replace function public.reeditpro_reject_row_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  raise exception using errcode = '55000', message = 'REEDITPRO_IMMUTABLE_ROW';
end;
$$;

create or replace function public.reeditpro_lock_terminal_reasoning_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.status in ('completed', 'failed', 'cancelled') and new is distinct from old then
    raise exception using errcode = '55000', message = 'REEDITPRO_TERMINAL_REASONING_ROW_IMMUTABLE';
  end if;
  if old.status = 'unknown'
    and (
      new.status not in ('completed', 'failed', 'cancelled')
      or new.revision <> old.revision + 1
      or new.id <> old.id
      or new.reasoning_run_id <> old.reasoning_run_id
      or new.route_id <> old.route_id
      or new.request_digest <> old.request_digest
    ) then
    raise exception using errcode = '55000', message = 'REEDITPRO_UNKNOWN_REASONING_ROW_RECONCILIATION_INVALID';
  end if;
  return new;
end;
$$;

create trigger approved_plan_snapshots_immutable
  before update or delete on public.approved_plan_snapshots
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_study_messages_immutable
  before update or delete on public.preference_study_messages
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_evidence_immutable
  before update or delete on public.preference_evidence
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_assets_immutable
  before update or delete on public.preference_assets
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_reasoning_observations_immutable
  before update or delete on public.preference_study_reasoning_provider_observations
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_reasoning_receipts_immutable
  before update or delete on public.preference_study_reasoning_run_receipts
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_reasoning_attempt_terminal_lock
  before update on public.preference_study_reasoning_route_attempts
  for each row execute function public.reeditpro_lock_terminal_reasoning_row();
create trigger preference_long_form_plans_immutable
  before update or delete on public.preference_long_form_study_plans
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_long_form_attempts_immutable
  before update or delete on public.preference_long_form_study_attempts
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_long_form_checkpoints_immutable
  before update or delete on public.preference_long_form_study_checkpoints
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_long_form_outputs_immutable
  before update or delete on public.preference_long_form_study_work_outputs
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_long_form_checkpoint_authority_immutable
  before update or delete on public.preference_long_form_study_checkpoint_authority
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_skill_runs_immutable
  before update or delete on public.preference_skill_runs
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_dna_versions_immutable
  before update or delete on public.preference_dna_versions
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_dna_qa_results_immutable
  before update or delete on public.preference_dna_qa_results
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_usage_events_immutable
  before update or delete on public.preference_usage_events
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_audit_segments_immutable
  before update or delete on public.preference_audit_segments
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_application_invalidations_immutable
  before update or delete on public.preference_application_plan_invalidations
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_application_lifecycle_events_immutable
  before update or delete on public.preference_application_lifecycle_events
  for each row execute function public.reeditpro_reject_row_mutation();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'edit_references',
    'preference_study_sessions',
    'preference_study_messages',
    'preference_evidence',
    'preference_assets',
    'preference_study_reasoning_runs',
    'preference_study_reasoning_route_attempts',
    'preference_study_reasoning_provider_requests',
    'preference_study_reasoning_provider_observations',
    'preference_study_reasoning_checkbacks',
    'preference_study_reasoning_run_receipts',
    'preference_long_form_study_plans',
    'preference_long_form_study_runs',
    'preference_long_form_study_work_items',
    'preference_long_form_study_attempts',
    'preference_long_form_study_checkpoints',
    'preference_long_form_study_work_outputs',
    'preference_long_form_study_checkpoint_authority',
    'preference_skill_runs',
    'preference_dna_versions',
    'preference_dna_qa_results',
    'preference_applications',
    'preference_usage_events',
    'preference_audit_segments',
    'preference_application_plan_invalidations',
    'edit_reference_idempotency_receipts',
    'preference_application_lifecycle_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', table_name);
  end loop;
end;
$$;

create policy edit_references_read_member on public.edit_references
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_study_sessions_read_member on public.preference_study_sessions
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_study_messages_read_member on public.preference_study_messages
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_evidence_read_member on public.preference_evidence
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_long_form_plans_read_member on public.preference_long_form_study_plans
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_long_form_runs_read_member on public.preference_long_form_study_runs
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_dna_versions_read_member on public.preference_dna_versions
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_dna_qa_results_read_member on public.preference_dna_qa_results
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy preference_applications_read_member on public.preference_applications
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));

grant select on public.edit_references, public.preference_study_sessions,
  public.preference_study_messages, public.preference_evidence,
  public.preference_long_form_study_plans, public.preference_long_form_study_runs,
  public.preference_dna_versions, public.preference_dna_qa_results,
  public.preference_applications to authenticated;

create or replace function public.mutate_edit_reference_application_lifecycle_v3(
  p_contract_version text,
  p_request jsonb
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid;
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  reference_uuid uuid;
  study_uuid uuid;
  dna_uuid uuid;
  application_uuid uuid;
  expected_application_uuid uuid;
  request_digest text;
  key_digest text;
  mutation_name text;
  requested_at timestamptz;
  reference_row public.edit_references%rowtype;
  exact_state public.exact_edit_preference_states%rowtype;
  application_row public.preference_applications%rowtype;
  previous_application public.preference_applications%rowtype;
  dna_row public.preference_dna_versions%rowtype;
  qa_row public.preference_dna_qa_results%rowtype;
  existing_receipt public.edit_reference_idempotency_receipts%rowtype;
  idempotency_receipt_id uuid;
  invalidation_id uuid := extensions.gen_random_uuid();
  usage_event_id uuid := extensions.gen_random_uuid();
  audit_segment_id uuid := extensions.gen_random_uuid();
  transaction_id uuid := extensions.gen_random_uuid();
  committed_at timestamptz := clock_timestamp();
  committed_at_text text;
  next_reference_revision bigint;
  next_planning_revision bigint;
  plan_disposition text;
  estimate_disposition text;
  execution_disposition text;
  approval_status text;
  response_association_digest text;
  receipt_without_digest jsonb;
  receipt jsonb;
  frame jsonb;
  expected_frame_digest text;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_CONTRACT_VERSION_INVALID';
  end if;
  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REQUEST_INVALID';
  end if;
  if p_request->>'schemaVersion' <> 'edit-reference-production-application-lifecycle-request-v2'
    or p_request->>'rpcName' <> 'mutate_edit_reference_application_lifecycle_v3' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REQUEST_SCHEMA_INVALID';
  end if;

  actor_id := auth.uid();
  if actor_id is null or p_request->>'actorUserId' <> actor_id::text then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_ACTOR_NOT_AUTHORIZED';
  end if;

  begin
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    edit_session_uuid := (p_request->>'editSessionId')::uuid;
    reference_uuid := (p_request->>'editReferenceId')::uuid;
    study_uuid := (p_request->>'studySessionId')::uuid;
    dna_uuid := (p_request->>'dnaVersionId')::uuid;
    application_uuid := (p_request->>'applicationId')::uuid;
    expected_application_uuid := nullif(p_request->>'expectedCurrentApplicationId', '')::uuid;
    requested_at := (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REQUEST_IDENTITY_INVALID';
  end;

  if not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_WORKSPACE_WRITE_REQUIRED';
  end if;
  if not exists (
    select 1 from public.projects p
    join public.edit_sessions e on e.project_id = p.id and e.workspace_id = p.workspace_id
    where p.id = project_uuid and p.workspace_id = workspace_uuid and e.id = edit_session_uuid
  ) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_EXACT_EDIT_SCOPE_INVALID';
  end if;

  mutation_name := p_request->>'mutation';
  if mutation_name not in ('apply', 'replace', 'remove') then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_MUTATION_INVALID';
  end if;
  request_digest := p_request->>'requestDigestSha256';
  key_digest := p_request->>'idempotencyKeyHashSha256';
  if coalesce(request_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(key_digest, '') !~ '^[a-f0-9]{64}$'
    or request_digest <> public.reeditpro_sha256_json(p_request - 'requestDigestSha256') then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REQUEST_DIGEST_INVALID';
  end if;

  select * into existing_receipt
    from public.edit_reference_idempotency_receipts receipt_row
    where receipt_row.workspace_id = workspace_uuid
      and receipt_row.actor_user_id = actor_id
      and receipt_row.operation = 'mutate_edit_reference_application_lifecycle_v3'
      and receipt_row.idempotency_key_hash = key_digest
    for update;
  if found then
    if existing_receipt.request_hash <> request_digest then
      raise exception using errcode = '23505', message = 'EDIT_REFERENCE_IDEMPOTENCY_CONFLICT';
    end if;
    if existing_receipt.status = 'completed' and existing_receipt.response_json is not null then
      return next existing_receipt.response_json;
      return;
    end if;
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_IDEMPOTENCY_IN_PROGRESS';
  end if;

  insert into public.edit_reference_idempotency_receipts (
    workspace_id, actor_user_id, operation, idempotency_key_hash,
    request_hash, status, expires_at
  ) values (
    workspace_uuid, actor_id, 'mutate_edit_reference_application_lifecycle_v3',
    key_digest, request_digest, 'reserved', committed_at + interval '24 hours'
  ) returning id into idempotency_receipt_id;

  select * into reference_row from public.edit_references r
    where r.id = reference_uuid and r.workspace_id = workspace_uuid
    for update;
  if not found or reference_row.revision <> (p_request->>'expectedReferenceRevision')::bigint then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_REVISION_CHANGED';
  end if;

  select * into exact_state from public.exact_edit_preference_states state_row
    where state_row.workspace_id = workspace_uuid
      and state_row.project_id = project_uuid
      and state_row.edit_session_id = edit_session_uuid
    for update;
  if not found
    or exact_state.planning_input_revision <> (p_request->>'expectedPlanningInputRevision')::bigint
    or exact_state.locked
    or exact_state.lifecycle_phase <> 'planning' then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_PLANNING_AUTHORITY_CHANGED';
  end if;

  select * into application_row from public.preference_applications app
    where app.id = application_uuid
      and app.workspace_id = workspace_uuid
      and app.project_id = project_uuid
      and app.edit_session_id = edit_session_uuid
      and app.edit_reference_id = reference_uuid
      and app.study_session_id = study_uuid
      and app.dna_version_id = dna_uuid
    for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'EDIT_REFERENCE_APPLICATION_NOT_FOUND';
  end if;
  if application_row.content_digest <> p_request->>'applicationContentDigestSha256'
    or application_row.context_hash <> p_request->>'applicationContextHashSha256' then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_APPLICATION_CHANGED';
  end if;

  if mutation_name = 'apply' then
    if expected_application_uuid is not null or exact_state.current_application_state = 'connected' then
      raise exception using errcode = '40001', message = 'EDIT_REFERENCE_APPLICATION_ALREADY_CONNECTED';
    end if;
  else
    if expected_application_uuid is null
      or exact_state.current_application_state <> 'connected'
      or exact_state.current_application_id <> expected_application_uuid then
      raise exception using errcode = '40001', message = 'EDIT_REFERENCE_CURRENT_APPLICATION_CHANGED';
    end if;
    select * into previous_application from public.preference_applications previous_row
      where previous_row.id = expected_application_uuid
        and previous_row.workspace_id = workspace_uuid
        and previous_row.project_id = project_uuid
        and previous_row.edit_session_id = edit_session_uuid
      for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'EDIT_REFERENCE_CURRENT_APPLICATION_NOT_FOUND';
    end if;
  end if;

  if mutation_name = 'replace' and expected_application_uuid = application_uuid then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REPLACEMENT_REQUIRES_NEW_APPLICATION';
  end if;
  if mutation_name = 'remove' and expected_application_uuid <> application_uuid then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REMOVE_EXPECTATION_INVALID';
  end if;

  if mutation_name <> 'remove' then
    select * into dna_row from public.preference_dna_versions dna
      where dna.id = dna_uuid
        and dna.workspace_id = workspace_uuid
        and dna.edit_reference_id = reference_uuid
        and dna.study_session_id = study_uuid;
    select * into qa_row from public.preference_dna_qa_results qa
      where qa.id = application_row.dna_qa_result_id
        and qa.workspace_id = workspace_uuid
        and qa.edit_reference_id = reference_uuid
        and qa.study_session_id = study_uuid
        and qa.dna_version_id = dna_uuid;
    if dna_row.status <> 'approved'
      or qa_row.status <> 'passed'
      or application_row.status <> 'prepared'
      or application_row.connection_state <> 'not_connected'
      or application_row.runtime_source <> 'verified_live'
      or application_row.target_understanding_package_digest <> p_request->>'targetUnderstandingPackageDigestSha256' then
      raise exception using errcode = '23514', message = 'EDIT_REFERENCE_APPLICATION_NOT_APPROVED';
    end if;

    frame := p_request->'outputFrameConfirmation';
    if frame is null or jsonb_typeof(frame) <> 'object' then
      raise exception using errcode = '23514', message = 'EDIT_REFERENCE_OUTPUT_FRAME_REQUIRED';
    end if;
    expected_frame_digest := frame->>'authorityDigestSha256';
    if coalesce(expected_frame_digest, '') !~ '^[a-f0-9]{64}$'
      or expected_frame_digest <> public.reeditpro_sha256_json(frame - 'authorityDigestSha256')
      or frame->>'schemaVersion' <> 'edit-reference-production-output-frame-authority-v1'
      or frame->>'repositoryAuthority' <> 'supabase_rls_transactional'
      or frame->>'sourceAuthority' <> 'canonical_exact_edit_preference_frame_confirmation'
      or coalesce((frame->>'browserSuppliedAuthorityAccepted')::boolean, true) <> false
      or (frame->>'workspaceId')::uuid <> workspace_uuid
      or (frame->>'projectId')::uuid <> project_uuid
      or (frame->>'editSessionId')::uuid <> edit_session_uuid
      or (frame->>'planningInputRevision')::bigint <> exact_state.planning_input_revision
      or (frame->>'exactEditPreferenceRecordRevision')::bigint <> exact_state.record_revision
      or (frame->>'confirmationId')::uuid <> exact_state.output_frame_confirmation_id
      or frame->>'aspectRatio' <> exact_state.output_frame_aspect_ratio
      or (frame->>'confirmedAt')::timestamptz <> exact_state.output_frame_confirmed_at
      or expected_frame_digest <> exact_state.output_frame_authority_digest_sha256
      or not exact_state.output_frame_confirmed then
      raise exception using errcode = '40001', message = 'EDIT_REFERENCE_OUTPUT_FRAME_AUTHORITY_CHANGED';
    end if;
  elsif p_request->'outputFrameConfirmation' <> 'null'::jsonb
    or p_request->'targetUnderstandingPackageDigestSha256' <> 'null'::jsonb then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_REMOVE_TARGET_AUTHORITY_FORBIDDEN';
  end if;

  plan_disposition := case when exact_state.current_draft_plan_version_id is null then 'absent' else 'invalidated' end;
  estimate_disposition := case when exact_state.current_draft_estimate_id is null then 'absent' else 'invalidated' end;
  update public.edit_plan_versions
    set status = 'stale', stale_reason = 'preference_application_changed', updated_at = committed_at
    where id = exact_state.current_draft_plan_version_id and status = 'draft';
  update public.edit_credit_estimates
    set status = 'stale', updated_at = committed_at
    where id = exact_state.current_draft_estimate_id and status = 'draft';
  update public.edit_execution_authorizations
    set status = 'revoked', revoked_at = committed_at,
        revoke_reason = 'preference_application_changed', updated_at = committed_at
    where workspace_id = workspace_uuid and project_id = project_uuid
      and edit_session_id = edit_session_uuid and status = 'active';
  execution_disposition := case when found then 'revoked' else 'not_active' end;
  approval_status := case
    when exact_state.current_draft_plan_version_id is not null
      or exists (select 1 from public.approved_plan_snapshots s where s.workspace_id = workspace_uuid and s.project_id = project_uuid and s.edit_session_id = edit_session_uuid)
    then 'reset_after_revision' else 'not_approved' end;

  next_reference_revision := reference_row.revision + 1;
  next_planning_revision := exact_state.planning_input_revision + 1;

  if mutation_name = 'replace' then
    update public.preference_applications
      set status = 'replaced', connection_state = 'invalidated',
          replaced_by_application_id = application_uuid,
          record_json = record_json || jsonb_build_object(
            'status', 'replaced', 'targetIntegrationStatus', 'invalidated',
            'replacedByApplicationId', application_uuid::text,
            'invalidatedAt', public.reeditpro_iso_timestamp(committed_at),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = expected_application_uuid;
  end if;

  if mutation_name in ('apply', 'replace') then
    update public.preference_applications
      set connection_state = 'connected', connected_at = committed_at,
          record_json = record_json || jsonb_build_object(
            'status', 'prepared', 'targetIntegrationStatus', 'connected',
            'downstreamInvalidationStatus', 'not_required',
            'targetEditMutationMade', true, 'downstreamContextWritten', true,
            'connectedAt', public.reeditpro_iso_timestamp(committed_at),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = application_uuid;
  else
    update public.preference_applications
      set status = 'cleared', connection_state = 'invalidated', cleared_at = committed_at,
          record_json = record_json || jsonb_build_object(
            'status', 'cleared', 'targetIntegrationStatus', 'invalidated',
            'downstreamInvalidationStatus', 'completed',
            'clearedAt', public.reeditpro_iso_timestamp(committed_at),
            'invalidatedAt', public.reeditpro_iso_timestamp(committed_at),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = application_uuid;
  end if;

  update public.edit_references
    set revision = next_reference_revision, updated_at = committed_at
    where id = reference_uuid and workspace_id = workspace_uuid;
  update public.edit_sessions
    set planning_input_revision = next_planning_revision, status = 'planning', updated_at = committed_at
    where id = edit_session_uuid and project_id = project_uuid and workspace_id = workspace_uuid;
  update public.exact_edit_preference_states
    set record_revision = record_revision + 1,
        planning_input_revision = next_planning_revision,
        current_application_state = case when mutation_name = 'remove' then 'cleared' else 'connected' end,
        current_application_id = case when mutation_name = 'remove' then null else application_uuid end,
        current_draft_plan_version_id = null,
        current_draft_estimate_id = null,
        updated_at = committed_at
    where workspace_id = workspace_uuid and project_id = project_uuid and edit_session_id = edit_session_uuid;

  insert into public.preference_application_plan_invalidations (
    id, workspace_id, project_id, edit_session_id, preference_application_id,
    edit_plan_version_id, application_content_digest, context_hash, reason,
    execution_authorization_revoked, invalidated_at
  ) values (
    invalidation_id, workspace_uuid, project_uuid, edit_session_uuid, application_uuid,
    exact_state.current_draft_plan_version_id, application_row.content_digest,
    application_row.context_hash, 'preference_application_' || mutation_name,
    execution_disposition = 'revoked', committed_at
  );

  insert into public.preference_usage_events (
    id, workspace_id, edit_reference_id, event_type, event_digest, event_json, created_at
  ) values (
    usage_event_id, workspace_uuid, reference_uuid, 'application_' || mutation_name,
    public.reeditpro_sha256_json(jsonb_build_object('requestDigestSha256', request_digest, 'transactionId', transaction_id::text)),
    jsonb_build_object('applicationId', application_uuid::text, 'projectId', project_uuid::text, 'editSessionId', edit_session_uuid::text),
    committed_at
  );
  insert into public.preference_audit_segments (
    id, workspace_id, edit_reference_id, first_sequence, last_sequence,
    event_count, content_digest, previous_segment_digest, created_at
  ) values (
    audit_segment_id, workspace_uuid, reference_uuid, next_reference_revision,
    next_reference_revision, 1,
    public.reeditpro_sha256_json(jsonb_build_object('usageEventId', usage_event_id::text, 'requestDigestSha256', request_digest)),
    null, committed_at
  );

  committed_at_text := public.reeditpro_iso_timestamp(committed_at);
  response_association_digest := public.reeditpro_sha256_json(jsonb_build_object(
    'requestDigestSha256', request_digest,
    'transactionId', transaction_id::text,
    'committedAt', committed_at_text
  ));
  receipt_without_digest := jsonb_build_object(
    'schemaVersion', 'edit-reference-production-application-lifecycle-receipt-v2',
    'sourceAuthority', 'canonical_application_lifecycle_rpc',
    'rpcName', 'mutate_edit_reference_application_lifecycle_v3',
    'transactionId', transaction_id::text,
    'requestDigestSha256', request_digest,
    'mutation', mutation_name,
    'actorUserId', actor_id::text,
    'workspaceId', workspace_uuid::text,
    'projectId', project_uuid::text,
    'editSessionId', edit_session_uuid::text,
    'editReferenceId', reference_uuid::text,
    'applicationId', application_uuid::text,
    'previousApplicationId', case when expected_application_uuid is null then null else to_jsonb(expected_application_uuid::text) end,
    'committedReferenceRevision', next_reference_revision,
    'committedPlanningInputRevision', next_planning_revision,
    'applicationStatusAfter', case when mutation_name = 'remove' then 'cleared' else 'connected' end,
    'preferenceContextStatusAfter', case when mutation_name = 'remove' then 'invalidated' else 'connected' end,
    'priorDraftPlanDisposition', plan_disposition,
    'priorDraftEstimateDisposition', estimate_disposition,
    'approvalStatusAfter', approval_status,
    'executionAuthorizationDisposition', execution_disposition,
    'freshPlanAndEstimateRequired', true,
    'approvedSnapshotPreserved', true,
    'historicalPrivatePreviewPreserved', true,
    'applicationPlanInvalidationReceiptId', invalidation_id::text,
    'auditEventIds', jsonb_build_array(usage_event_id::text, audit_segment_id::text),
    'idempotencyReceiptId', idempotency_receipt_id::text,
    'idempotencyResponseDigestSha256', response_association_digest,
    'committedAt', committed_at_text,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false,
    'providerOrWorkerExecutionStarted', false
  );
  receipt := receipt_without_digest || jsonb_build_object(
    'receiptDigestSha256', public.reeditpro_sha256_json(receipt_without_digest)
  );

  insert into public.preference_application_lifecycle_events (
    workspace_id, project_id, edit_session_id, edit_reference_id, application_id,
    mutation, committed_reference_revision, committed_planning_input_revision,
    request_digest_sha256, receipt_digest_sha256, request_json, receipt_json, created_at
  ) values (
    workspace_uuid, project_uuid, edit_session_uuid, reference_uuid, application_uuid,
    mutation_name, next_reference_revision, next_planning_revision,
    request_digest, receipt->>'receiptDigestSha256', p_request, receipt, committed_at
  );
  update public.edit_reference_idempotency_receipts
    set status = 'completed', response_digest = receipt->>'receiptDigestSha256', response_json = receipt
    where id = idempotency_receipt_id;

  return next receipt;
end;
$$;

create or replace function public.read_exact_edit_reference_application_state_v2(
  p_contract_version text,
  p_read_version text,
  p_scope jsonb
)
returns setof jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid := auth.uid();
  workspace_uuid uuid;
  project_uuid uuid;
  edit_session_uuid uuid;
  state_row public.exact_edit_preference_states%rowtype;
  application_row public.preference_applications%rowtype;
  lifecycle_row public.preference_application_lifecycle_events%rowtype;
  access_receipt_id uuid := extensions.gen_random_uuid();
  result jsonb;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6'
    or p_read_version <> 'edit-reference-production-planning-authority-read-v2' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_READ_VERSION_INVALID';
  end if;
  if actor_id is null or p_scope->>'actorUserId' <> actor_id::text then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_READ_ACTOR_INVALID';
  end if;
  begin
    workspace_uuid := (p_scope->>'workspaceId')::uuid;
    project_uuid := (p_scope->>'projectId')::uuid;
    edit_session_uuid := (p_scope->>'editSessionId')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_READ_SCOPE_INVALID';
  end;
  if not public.reeditpro_is_workspace_member(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_READ_WORKSPACE_DENIED';
  end if;
  if not exists (
    select 1 from public.projects p
    join public.edit_sessions e on e.project_id = p.id and e.workspace_id = p.workspace_id
    where p.id = project_uuid and p.workspace_id = workspace_uuid and e.id = edit_session_uuid
  ) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_READ_EXACT_EDIT_DENIED';
  end if;

  select * into state_row from public.exact_edit_preference_states state_source
    where state_source.workspace_id = workspace_uuid
      and state_source.project_id = project_uuid
      and state_source.edit_session_id = edit_session_uuid;
  if not found then
    raise exception using errcode = 'P0002', message = 'EDIT_REFERENCE_READ_STATE_MISSING';
  end if;

  result := jsonb_build_object(
    'schemaVersion', 'edit-reference-production-planning-authority-read-v2',
    'repositoryAuthority', 'supabase_rls_transactional',
    'currentState', state_row.current_application_state,
    'stateRecordCount', case when state_row.current_application_state = 'not_selected' then 0 else 1 end,
    'tenantIsolation', jsonb_build_object(
      'authenticatedUserVerified', true,
      'workspaceMembershipVerified', true,
      'workspaceProjectCompositeBindingVerified', true,
      'projectEditSessionCompositeBindingVerified', true,
      'rlsPolicyVersion', 'reeditpro-edit-reference-rls-v6',
      'accessCheckReceiptId', access_receipt_id::text
    ),
    'readRevision', state_row.planning_input_revision,
    'readAt', public.reeditpro_iso_timestamp(clock_timestamp())
  );

  if state_row.current_application_state = 'connected' then
    select * into application_row from public.preference_applications app
      where app.id = state_row.current_application_id
        and app.workspace_id = workspace_uuid
        and app.project_id = project_uuid
        and app.edit_session_id = edit_session_uuid
        and app.connection_state = 'connected';
    select * into lifecycle_row from public.preference_application_lifecycle_events lifecycle
      where lifecycle.workspace_id = workspace_uuid
        and lifecycle.project_id = project_uuid
        and lifecycle.edit_session_id = edit_session_uuid
        and lifecycle.application_id = state_row.current_application_id
        and lifecycle.mutation in ('apply', 'replace')
      order by lifecycle.committed_planning_input_revision desc limit 1;
    if application_row.id is null or lifecycle_row.id is null then
      raise exception using errcode = '23514', message = 'EDIT_REFERENCE_CONNECTED_LINEAGE_INCOMPLETE';
    end if;
    result := result || jsonb_build_object(
      'application', application_row.record_json,
      'lifecycleRequest', lifecycle_row.request_json,
      'lifecycleReceipt', lifecycle_row.receipt_json
    );
  elsif state_row.current_application_state = 'cleared' then
    select * into lifecycle_row from public.preference_application_lifecycle_events lifecycle
      where lifecycle.workspace_id = workspace_uuid
        and lifecycle.project_id = project_uuid
        and lifecycle.edit_session_id = edit_session_uuid
        and lifecycle.mutation = 'remove'
      order by lifecycle.committed_planning_input_revision desc limit 1;
    if lifecycle_row.id is null then
      raise exception using errcode = '23514', message = 'EDIT_REFERENCE_CLEARED_LINEAGE_INCOMPLETE';
    end if;
    result := result || jsonb_build_object(
      'lifecycleRequest', lifecycle_row.request_json,
      'lifecycleReceipt', lifecycle_row.receipt_json
    );
  end if;

  return next result;
end;
$$;

create or replace function public.assert_preference_application_plan_current_v1(
  p_contract_version text,
  p_scope jsonb,
  p_application_id uuid,
  p_application_content_digest_sha256 text,
  p_application_context_hash_sha256 text,
  p_approved_plan_snapshot_id uuid,
  p_stage text
)
returns setof jsonb
language plpgsql
security definer
stable
set search_path = pg_catalog, public, auth
as $$
declare
  actor_id uuid := auth.uid();
  workspace_uuid uuid := (p_scope->>'workspaceId')::uuid;
  project_uuid uuid := (p_scope->>'projectId')::uuid;
  edit_session_uuid uuid := (p_scope->>'editSessionId')::uuid;
  is_current boolean;
begin
  if p_contract_version <> 'edit-reference-production-persistence-contract-v6' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_EXECUTION_READ_VERSION_INVALID';
  end if;
  if actor_id is null or p_scope->>'actorUserId' <> actor_id::text
    or not public.reeditpro_is_workspace_member(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_EXECUTION_READ_DENIED';
  end if;
  if p_stage not in (
    'approval_replay', 'plan_activation', 'worker_claim', 'caption_execution',
    'visual_execution', 'render_start', 'artifact_persistence',
    'private_review_ready', 'public_delivery'
  ) then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_EXECUTION_STAGE_INVALID';
  end if;

  select exists (
    select 1
    from public.exact_edit_preference_states state_row
    join public.preference_applications app
      on app.id = state_row.current_application_id
      and app.workspace_id = state_row.workspace_id
      and app.project_id = state_row.project_id
      and app.edit_session_id = state_row.edit_session_id
    join public.approved_plan_snapshots snapshot
      on snapshot.id = p_approved_plan_snapshot_id
      and snapshot.workspace_id = state_row.workspace_id
      and snapshot.project_id = state_row.project_id
      and snapshot.edit_session_id = state_row.edit_session_id
    join public.edit_execution_authorizations authz
      on authz.approved_plan_snapshot_id = snapshot.id
      and authz.workspace_id = snapshot.workspace_id
      and authz.project_id = snapshot.project_id
      and authz.edit_session_id = snapshot.edit_session_id
      and authz.status = 'active'
    where state_row.workspace_id = workspace_uuid
      and state_row.project_id = project_uuid
      and state_row.edit_session_id = edit_session_uuid
      and state_row.current_application_state = 'connected'
      and app.id = p_application_id
      and app.connection_state = 'connected'
      and app.content_digest = p_application_content_digest_sha256
      and app.context_hash = p_application_context_hash_sha256
      and snapshot.preference_application_id = app.id
      and snapshot.preference_application_content_digest_sha256 = app.content_digest
      and snapshot.preference_application_context_hash_sha256 = app.context_hash
      and not exists (
        select 1 from public.preference_application_plan_invalidations invalidation
        where invalidation.workspace_id = workspace_uuid
          and invalidation.project_id = project_uuid
          and invalidation.edit_session_id = edit_session_uuid
          and invalidation.preference_application_id = app.id
          and invalidation.invalidated_at >= snapshot.approved_at
      )
  ) into is_current;

  return next jsonb_build_object(
    'schemaVersion', 'assert-preference-application-plan-current-v1',
    'stage', p_stage,
    'current', is_current,
    'planLifecycleStatus', case when is_current then 'approved' else 'stale' end,
    'executionAuthorizationRevoked', not is_current,
    'approvedSnapshotPreserved', true,
    'historicalPrivatePreviewPreserved', true
  );
end;
$$;

revoke all on function public.reeditpro_canonical_json(jsonb) from public, anon, authenticated;
revoke all on function public.reeditpro_sha256_json(jsonb) from public, anon, authenticated;
revoke all on function public.reeditpro_iso_timestamp(timestamptz) from public, anon, authenticated;
revoke all on function public.mutate_edit_reference_application_lifecycle_v3(text, jsonb) from public, anon;
revoke all on function public.read_exact_edit_reference_application_state_v2(text, text, jsonb) from public, anon;
revoke all on function public.assert_preference_application_plan_current_v1(text, jsonb, uuid, text, text, uuid, text) from public, anon;
grant execute on function public.mutate_edit_reference_application_lifecycle_v3(text, jsonb) to authenticated, service_role;
grant execute on function public.read_exact_edit_reference_application_state_v2(text, text, jsonb) to authenticated, service_role;
grant execute on function public.assert_preference_application_plan_current_v1(text, jsonb, uuid, text, text, uuid, text) to authenticated, service_role;

create or replace function public.reserve_edit_reference_study_chat_run_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid := auth.uid();
  workspace_uuid uuid := (p_request->>'workspaceId')::uuid;
  reference_uuid uuid := (p_request->>'editReferenceId')::uuid;
  study_uuid uuid := (p_request->>'studySessionId')::uuid;
  key_digest text := p_request->>'reservationIdempotencyKeyDigest';
  request_digest text;
  run_id uuid := extensions.gen_random_uuid();
  message_id uuid := extensions.gen_random_uuid();
  evidence_id uuid := extensions.gen_random_uuid();
  receipt_id uuid;
  existing public.edit_reference_idempotency_receipts%rowtype;
  study_row public.preference_study_sessions%rowtype;
  response jsonb;
  next_message_sequence bigint;
  next_evidence_revision bigint;
begin
  if actor_id is null or p_request->>'actorUserId' <> actor_id::text
    or not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'EDIT_REFERENCE_STUDY_CHAT_RESERVE_DENIED';
  end if;
  if coalesce(key_digest, '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'clientMessageDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'structuredContextDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'savedDirectionEvidenceDigest', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'routeContractVersion' <> 'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek'
    or coalesce((p_request->>'maximumAuthorizedInternalCostMicros')::bigint, -1) < 0
    or length(btrim(p_request->>'messageContent')) < 1 then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_STUDY_CHAT_RESERVE_INVALID';
  end if;
  request_digest := public.reeditpro_sha256_json(p_request);

  select * into existing from public.edit_reference_idempotency_receipts receipt_row
    where receipt_row.workspace_id = workspace_uuid
      and receipt_row.actor_user_id = actor_id
      and receipt_row.operation = 'reserve_edit_reference_study_chat_run_v1'
      and receipt_row.idempotency_key_hash = key_digest
    for update;
  if found then
    if existing.request_hash <> request_digest then
      raise exception using errcode = '23505', message = 'EDIT_REFERENCE_STUDY_CHAT_IDEMPOTENCY_CONFLICT';
    end if;
    if existing.status = 'completed' then
      return next existing.response_json;
      return;
    end if;
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_RESERVATION_IN_PROGRESS';
  end if;

  select * into study_row from public.preference_study_sessions study
    where study.id = study_uuid
      and study.edit_reference_id = reference_uuid
      and study.workspace_id = workspace_uuid
    for update;
  if not found or study_row.revision <> (p_request->>'studyRevision')::bigint then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_REVISION_CHANGED';
  end if;

  insert into public.edit_reference_idempotency_receipts (
    workspace_id, actor_user_id, operation, idempotency_key_hash,
    request_hash, status, expires_at
  ) values (
    workspace_uuid, actor_id, 'reserve_edit_reference_study_chat_run_v1',
    key_digest, request_digest, 'reserved', clock_timestamp() + interval '24 hours'
  ) returning id into receipt_id;

  select coalesce(max(sequence), 0) + 1 into next_message_sequence
    from public.preference_study_messages where study_session_id = study_uuid;
  select coalesce(max(revision), 0) + 1 into next_evidence_revision
    from public.preference_evidence where study_session_id = study_uuid;

  insert into public.preference_study_messages (
    id, workspace_id, edit_reference_id, study_session_id, sequence, role,
    content, content_digest, client_message_id, runtime_source
  ) values (
    message_id, workspace_uuid, reference_uuid, study_uuid, next_message_sequence,
    'user', p_request->>'messageContent', p_request->>'clientMessageDigest',
    nullif(p_request->>'clientMessageId', ''), 'user_input'
  );
  insert into public.preference_evidence (
    id, workspace_id, edit_reference_id, study_session_id, revision,
    content_digest, evidence_type, evidence_json
  ) values (
    evidence_id, workspace_uuid, reference_uuid, study_uuid, next_evidence_revision,
    p_request->>'savedDirectionEvidenceDigest', 'saved_user_direction',
    coalesce(p_request->'savedDirectionEvidence', '{}'::jsonb)
  );
  insert into public.preference_study_reasoning_runs (
    id, workspace_id, actor_user_id, edit_reference_id, study_session_id,
    study_revision, user_message_id, saved_direction_evidence_id,
    client_message_digest, structured_context_digest, route_contract_version,
    approved_usage_estimate_id, internal_cost_budget_id, rate_card_snapshot_id,
    maximum_authorized_internal_cost_micros, reservation_idempotency_key_digest,
    canonical_request_hash, revision, status
  ) values (
    run_id, workspace_uuid, actor_id, reference_uuid, study_uuid,
    study_row.revision, message_id, evidence_id,
    p_request->>'clientMessageDigest', p_request->>'structuredContextDigest',
    'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek',
    p_request->>'approvedUsageEstimateId', p_request->>'internalCostBudgetId',
    p_request->>'rateCardSnapshotId',
    (p_request->>'maximumAuthorizedInternalCostMicros')::bigint,
    key_digest, request_digest, 1, 'reserved'
  );

  response := jsonb_build_object(
    'schemaVersion', 'edit-reference-study-chat-run-reservation-v1',
    'reasoningRunId', run_id::text,
    'userMessageId', message_id::text,
    'savedDirectionEvidenceId', evidence_id::text,
    'status', 'reserved',
    'revision', 1,
    'canonicalRequestHash', request_digest,
    'providerCallMade', false,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false
  );
  update public.edit_reference_idempotency_receipts
    set status = 'completed', response_digest = public.reeditpro_sha256_json(response), response_json = response
    where id = receipt_id;
  return next response;
end;
$$;

create or replace function public.authorize_edit_reference_study_chat_route_attempt_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  run_uuid uuid := (p_request->>'reasoningRunId')::uuid;
  run_row public.preference_study_reasoning_runs%rowtype;
  prior_row public.preference_study_reasoning_route_attempts%rowtype;
  attempt_id uuid := extensions.gen_random_uuid();
  ordinal_value integer;
  expected_route text;
  entry_trigger text := nullif(p_request->>'entryFallbackTrigger', '');
begin
  select * into run_row from public.preference_study_reasoning_runs run_source
    where run_source.id = run_uuid for update;
  if not found or run_row.status not in ('reserved', 'running', 'waiting')
    or run_row.revision <> (p_request->>'expectedRunRevision')::bigint then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_RUN_CHANGED';
  end if;
  select count(*)::integer + 1 into ordinal_value
    from public.preference_study_reasoning_route_attempts where reasoning_run_id = run_uuid;
  expected_route := case ordinal_value
    when 1 then 'kimi_k3_primary'
    when 2 then 'qwen_3_7_fallback'
    when 3 then 'deepseek_v4_pro_fallback'
    else null end;
  if expected_route is null or p_request->>'routeId' <> expected_route
    or coalesce(p_request->>'routeAuthorizationDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'requestDigest', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_STUDY_CHAT_ROUTE_INVALID';
  end if;
  if ordinal_value > 1 then
    select * into prior_row from public.preference_study_reasoning_route_attempts prior
      where prior.reasoning_run_id = run_uuid and prior.attempt_ordinal = ordinal_value - 1
      for share;
    if prior_row.status <> 'failed'
      or prior_row.internal_cost_micros is null
      or prior_row.terminal_fallback_trigger is null
      or entry_trigger is distinct from prior_row.terminal_fallback_trigger then
      raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_FALLBACK_NOT_AUTHORIZED';
    end if;
  elsif entry_trigger is not null then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_STUDY_CHAT_PRIMARY_TRIGGER_FORBIDDEN';
  end if;

  insert into public.preference_study_reasoning_route_attempts (
    id, workspace_id, edit_reference_id, study_session_id, reasoning_run_id,
    attempt_ordinal, revision, status, route_id, route_authorization_digest,
    request_digest, entry_fallback_trigger, started_at
  ) values (
    attempt_id, run_row.workspace_id, run_row.edit_reference_id, run_row.study_session_id,
    run_uuid, ordinal_value, 1, 'authorized', expected_route,
    p_request->>'routeAuthorizationDigest', p_request->>'requestDigest',
    entry_trigger, clock_timestamp()
  );
  update public.preference_study_reasoning_runs
    set status = 'running', revision = revision + 1, updated_at = clock_timestamp()
    where id = run_uuid;
  return next jsonb_build_object(
    'routeAttemptId', attempt_id::text,
    'attemptOrdinal', ordinal_value,
    'routeId', expected_route,
    'status', 'authorized',
    'runRevision', run_row.revision + 1
  );
end;
$$;

create or replace function public.reserve_edit_reference_study_chat_provider_request_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  attempt_uuid uuid := (p_request->>'routeAttemptId')::uuid;
  attempt_row public.preference_study_reasoning_route_attempts%rowtype;
  provider_request_id uuid := extensions.gen_random_uuid();
  expected_boundary text;
  expected_model text;
begin
  select * into attempt_row from public.preference_study_reasoning_route_attempts attempt_source
    where attempt_source.id = attempt_uuid for update;
  if not found or attempt_row.status <> 'authorized'
    or attempt_row.revision <> (p_request->>'expectedAttemptRevision')::bigint then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_ATTEMPT_CHANGED';
  end if;
  expected_boundary := case attempt_row.route_id
    when 'kimi_k3_primary' then 'kimi_k3_provider_boundary'
    when 'qwen_3_7_fallback' then 'qwen_3_7_provider_boundary'
    else 'deepseek_v4_pro_tool_code_boundary' end;
  expected_model := case attempt_row.route_id
    when 'kimi_k3_primary' then 'kimi-k3'
    when 'qwen_3_7_fallback' then 'qwen3.7-max-2026-06-08'
    else 'deepseek-v4-pro' end;
  if p_request->>'providerBoundary' <> expected_boundary
    or p_request->>'providerModelId' <> expected_model
    or coalesce(p_request->>'submissionIdempotencyKeyDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'oneUseSubmissionAuthorityDigest', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_STUDY_CHAT_PROVIDER_ROUTE_INVALID';
  end if;
  insert into public.preference_study_reasoning_provider_requests (
    id, workspace_id, edit_reference_id, study_session_id, reasoning_run_id,
    route_attempt_id, provider_boundary, provider_model_id, provider_model_revision,
    submission_idempotency_key_digest, one_use_submission_authority_digest,
    revision, status, provider_call_may_have_occurred
  ) values (
    provider_request_id, attempt_row.workspace_id, attempt_row.edit_reference_id,
    attempt_row.study_session_id, attempt_row.reasoning_run_id, attempt_uuid,
    expected_boundary, expected_model, p_request->>'providerModelRevision',
    p_request->>'submissionIdempotencyKeyDigest',
    p_request->>'oneUseSubmissionAuthorityDigest', 1, 'reserved', false
  );
  return next jsonb_build_object(
    'providerRequestId', provider_request_id::text,
    'routeAttemptId', attempt_uuid::text,
    'status', 'reserved',
    'revision', 1
  );
end;
$$;

create or replace function public.consume_edit_reference_study_chat_submission_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request_uuid uuid := (p_request->>'providerRequestId')::uuid;
  request_row public.preference_study_reasoning_provider_requests%rowtype;
begin
  select * into request_row from public.preference_study_reasoning_provider_requests provider_request
    where provider_request.id = request_uuid for update;
  if not found
    or request_row.status <> 'reserved'
    or request_row.revision <> (p_request->>'expectedRevision')::bigint
    or request_row.one_use_submission_authority_digest <> p_request->>'oneUseSubmissionAuthorityDigest' then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_SUBMISSION_AUTHORITY_CHANGED';
  end if;
  update public.preference_study_reasoning_provider_requests
    set status = 'submitted', provider_call_may_have_occurred = true,
        revision = revision + 1, updated_at = clock_timestamp()
    where id = request_uuid;
  update public.preference_study_reasoning_route_attempts
    set status = 'submitted', revision = revision + 1
    where id = request_row.route_attempt_id and status = 'authorized';
  return next jsonb_build_object(
    'providerRequestId', request_uuid::text,
    'status', 'submitted',
    'revision', request_row.revision + 1,
    'providerCallMayHaveOccurred', true
  );
end;
$$;

create or replace function public.record_edit_reference_study_chat_provider_observation_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  request_uuid uuid := (p_request->>'providerRequestId')::uuid;
  request_row public.preference_study_reasoning_provider_requests%rowtype;
  observation_id uuid := extensions.gen_random_uuid();
begin
  select * into request_row from public.preference_study_reasoning_provider_requests provider_request
    where provider_request.id = request_uuid for share;
  if not found
    or coalesce(p_request->>'observationIdDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'observationDigest', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'EDIT_REFERENCE_STUDY_CHAT_OBSERVATION_INVALID';
  end if;
  insert into public.preference_study_reasoning_provider_observations (
    id, workspace_id, edit_reference_id, study_session_id, reasoning_run_id,
    route_attempt_id, provider_request_id, observation_id_digest,
    observation_digest, status, provider_usage_digest, result_digest, observed_at
  ) values (
    observation_id, request_row.workspace_id, request_row.edit_reference_id,
    request_row.study_session_id, request_row.reasoning_run_id,
    request_row.route_attempt_id, request_uuid,
    p_request->>'observationIdDigest', p_request->>'observationDigest',
    p_request->>'status', nullif(p_request->>'providerUsageDigest', ''),
    nullif(p_request->>'resultDigest', ''),
    (p_request->>'observedAt')::timestamptz
  ) on conflict (provider_request_id, observation_id_digest) do nothing;
  select id into observation_id from public.preference_study_reasoning_provider_observations
    where provider_request_id = request_uuid
      and observation_id_digest = p_request->>'observationIdDigest';
  return next jsonb_build_object('observationId', observation_id::text, 'persisted', true);
end;
$$;

create or replace function public.schedule_edit_reference_study_chat_checkback_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  request_uuid uuid := (p_request->>'providerRequestId')::uuid;
  request_row public.preference_study_reasoning_provider_requests%rowtype;
  checkback_id uuid := extensions.gen_random_uuid();
begin
  select * into request_row from public.preference_study_reasoning_provider_requests provider_request
    where provider_request.id = request_uuid for update;
  if not found or request_row.status <> 'submitted'
    or (p_request->>'deadlineAt')::timestamptz <= (p_request->>'nextCheckAt')::timestamptz then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_CHECKBACK_INVALID';
  end if;
  insert into public.preference_study_reasoning_checkbacks (
    id, workspace_id, edit_reference_id, study_session_id, reasoning_run_id,
    route_attempt_id, provider_request_id, workflow_id, revision, status,
    next_check_at, deadline_at
  ) values (
    checkback_id, request_row.workspace_id, request_row.edit_reference_id,
    request_row.study_session_id, request_row.reasoning_run_id,
    request_row.route_attempt_id, request_uuid, p_request->>'workflowId',
    1, 'scheduled', (p_request->>'nextCheckAt')::timestamptz,
    (p_request->>'deadlineAt')::timestamptz
  );
  update public.preference_study_reasoning_runs
    set status = 'waiting', revision = revision + 1, updated_at = clock_timestamp()
    where id = request_row.reasoning_run_id;
  return next jsonb_build_object('checkbackId', checkback_id::text, 'status', 'scheduled', 'revision', 1);
end;
$$;

create or replace function public.claim_edit_reference_study_chat_checkback_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  checkback_uuid uuid := (p_request->>'checkbackId')::uuid;
  checkback_row public.preference_study_reasoning_checkbacks%rowtype;
begin
  select * into checkback_row from public.preference_study_reasoning_checkbacks checkback
    where checkback.id = checkback_uuid for update;
  if not found or checkback_row.status not in ('scheduled', 'waiting', 'expired')
    or checkback_row.revision <> (p_request->>'expectedRevision')::bigint
    or coalesce(p_request->>'leaseOwnerDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'leaseTokenDigest', '') !~ '^[a-f0-9]{64}$'
    or (p_request->>'leaseExpiresAt')::timestamptz <= clock_timestamp() then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_CHECKBACK_CLAIM_CHANGED';
  end if;
  update public.preference_study_reasoning_checkbacks
    set status = 'leased', lease_owner_digest = p_request->>'leaseOwnerDigest',
        lease_token_digest = p_request->>'leaseTokenDigest',
        lease_expires_at = (p_request->>'leaseExpiresAt')::timestamptz,
        revision = revision + 1, lookup_attempt_count = lookup_attempt_count + 1,
        updated_at = clock_timestamp()
    where id = checkback_uuid;
  return next jsonb_build_object('checkbackId', checkback_uuid::text, 'status', 'leased', 'revision', checkback_row.revision + 1);
end;
$$;

create or replace function public.heartbeat_edit_reference_study_chat_checkback_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  checkback_uuid uuid := (p_request->>'checkbackId')::uuid;
  checkback_row public.preference_study_reasoning_checkbacks%rowtype;
begin
  select * into checkback_row from public.preference_study_reasoning_checkbacks checkback
    where checkback.id = checkback_uuid for update;
  if not found or checkback_row.status <> 'leased'
    or checkback_row.lease_token_digest <> p_request->>'leaseTokenDigest'
    or checkback_row.lease_expires_at <= clock_timestamp()
    or (p_request->>'leaseExpiresAt')::timestamptz <= checkback_row.lease_expires_at then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_CHECKBACK_LEASE_CHANGED';
  end if;
  update public.preference_study_reasoning_checkbacks
    set lease_expires_at = (p_request->>'leaseExpiresAt')::timestamptz,
        next_check_at = (p_request->>'nextCheckAt')::timestamptz,
        revision = revision + 1, updated_at = clock_timestamp()
    where id = checkback_uuid;
  return next jsonb_build_object('checkbackId', checkback_uuid::text, 'status', 'leased', 'revision', checkback_row.revision + 1);
end;
$$;

create or replace function public.settle_edit_reference_study_chat_route_attempt_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  attempt_uuid uuid := (p_request->>'routeAttemptId')::uuid;
  attempt_row public.preference_study_reasoning_route_attempts%rowtype;
  run_row public.preference_study_reasoning_runs%rowtype;
  terminal_status text := p_request->>'status';
  provider_cost bigint := (p_request->>'providerCostMicros')::bigint;
  infrastructure_cost bigint := (p_request->>'infrastructureCostMicros')::bigint;
  total_cost bigint;
  aggregate_cost bigint;
begin
  select * into attempt_row from public.preference_study_reasoning_route_attempts attempt_source
    where attempt_source.id = attempt_uuid for update;
  if not found or attempt_row.status not in ('submitted', 'waiting', 'unknown')
    or terminal_status not in ('completed', 'failed', 'unknown', 'cancelled')
    or provider_cost < 0 or infrastructure_cost < 0
    or coalesce(p_request->>'usageDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'providerCostDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'infrastructureCostDigest', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_SETTLEMENT_INVALID';
  end if;
  if attempt_row.status = 'unknown' and terminal_status = 'unknown' then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_UNKNOWN_RECONCILIATION_REQUIRED';
  end if;
  if (attempt_row.status = 'unknown' or terminal_status = 'unknown')
    and not exists (
      select 1
      from public.preference_study_reasoning_checkbacks checkback
      where checkback.route_attempt_id = attempt_uuid
        and checkback.provider_request_id = (
          select provider_request.id
          from public.preference_study_reasoning_provider_requests provider_request
          where provider_request.route_attempt_id = attempt_uuid
        )
    ) then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_UNKNOWN_CHECKBACK_REQUIRED';
  end if;
  if attempt_row.route_id = 'qwen_3_7_fallback'
    and coalesce(p_request->>'fxSnapshotDigest', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_QWEN_FX_REQUIRED';
  end if;
  if terminal_status = 'failed' and length(coalesce(p_request->>'terminalFallbackTrigger', '')) < 1 then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_FAILURE_TRIGGER_REQUIRED';
  end if;
  total_cost := provider_cost + infrastructure_cost;
  if attempt_row.status = 'unknown'
    and total_cost < coalesce(attempt_row.internal_cost_micros, 0) then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_RECONCILED_COST_REGRESSED';
  end if;
  select * into run_row from public.preference_study_reasoning_runs run_source
    where run_source.id = attempt_row.reasoning_run_id for update;
  select coalesce(sum(internal_cost_micros), 0) + total_cost into aggregate_cost
    from public.preference_study_reasoning_route_attempts
    where reasoning_run_id = attempt_row.reasoning_run_id
      and id <> attempt_uuid
      and internal_cost_micros is not null;
  if aggregate_cost > run_row.maximum_authorized_internal_cost_micros then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_CEILING_EXCEEDED';
  end if;
  update public.preference_study_reasoning_route_attempts
    set status = terminal_status, revision = revision + 1,
        terminal_outcome = p_request->>'terminalOutcome',
        terminal_fallback_trigger = nullif(p_request->>'terminalFallbackTrigger', ''),
        usage_digest = p_request->>'usageDigest',
        provider_cost_digest = p_request->>'providerCostDigest',
        infrastructure_cost_digest = p_request->>'infrastructureCostDigest',
        fx_snapshot_digest = nullif(p_request->>'fxSnapshotDigest', ''),
        internal_cost_micros = total_cost,
        failure_code = nullif(p_request->>'failureCode', ''),
        terminal_at = clock_timestamp()
    where id = attempt_uuid;
  update public.preference_study_reasoning_provider_requests
    set status = case when terminal_status = 'unknown' then 'unknown' else 'terminal' end,
        revision = revision + 1, updated_at = clock_timestamp()
    where route_attempt_id = attempt_uuid;
  if terminal_status <> 'unknown' then
    update public.preference_study_reasoning_checkbacks
      set status = case when terminal_status = 'cancelled' then 'cancelled' else 'completed' end,
          lease_owner_digest = null,
          lease_token_digest = null,
          lease_expires_at = null,
          revision = revision + 1,
          updated_at = clock_timestamp()
      where route_attempt_id = attempt_uuid
        and status not in ('completed', 'cancelled');
  end if;
  update public.preference_study_reasoning_runs
    set status = case when terminal_status = 'unknown' then 'waiting' else 'running' end,
        revision = revision + 1, updated_at = clock_timestamp()
    where id = attempt_row.reasoning_run_id;
  return next jsonb_build_object(
    'routeAttemptId', attempt_uuid::text,
    'status', terminal_status,
    'internalCostMicros', total_cost,
    'aggregateInternalCostMicros', aggregate_cost,
    'failedAttemptCostRetained', terminal_status = 'failed'
  );
end;
$$;

create or replace function public.authorize_edit_reference_study_chat_next_fallback_v1(p_request jsonb)
returns setof jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select * from public.authorize_edit_reference_study_chat_route_attempt_v1(p_request);
$$;

create or replace function public.settle_edit_reference_study_chat_run_v1(p_request jsonb)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  run_uuid uuid := (p_request->>'reasoningRunId')::uuid;
  run_row public.preference_study_reasoning_runs%rowtype;
  assistant_id uuid := extensions.gen_random_uuid();
  receipt_id uuid := extensions.gen_random_uuid();
  message_sequence bigint;
  attempt_count integer;
  failed_count integer;
  aggregate_cost bigint;
  unverified_exposure bigint;
  final_attempt_status text;
  receipt_without_digest jsonb;
  receipt_digest text;
begin
  select * into run_row from public.preference_study_reasoning_runs run_source
    where run_source.id = run_uuid for update;
  if not found or run_row.status in ('completed', 'failed', 'cancelled')
    or p_request->>'terminalState' not in ('completed', 'failed')
    or coalesce(p_request->>'finalResultDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'routeAttemptSetDigest', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'costAggregateDigest', '') !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_RUN_SETTLEMENT_INVALID';
  end if;
  select count(*), count(*) filter (where status = 'failed'),
         coalesce(sum(internal_cost_micros), 0),
         coalesce(sum(case when status = 'unknown' then internal_cost_micros else 0 end), 0)
    into attempt_count, failed_count, aggregate_cost, unverified_exposure
    from public.preference_study_reasoning_route_attempts where reasoning_run_id = run_uuid;
  select status into final_attempt_status from public.preference_study_reasoning_route_attempts
    where reasoning_run_id = run_uuid order by attempt_ordinal desc limit 1;
  if attempt_count < 1
    or exists (select 1 from public.preference_study_reasoning_route_attempts where reasoning_run_id = run_uuid and status not in ('completed', 'failed', 'cancelled'))
    or (p_request->>'terminalState' = 'completed' and final_attempt_status <> 'completed') then
    raise exception using errcode = '23514', message = 'EDIT_REFERENCE_STUDY_CHAT_ATTEMPT_SET_NOT_TERMINAL';
  end if;
  select coalesce(max(sequence), 0) + 1 into message_sequence
    from public.preference_study_messages where study_session_id = run_row.study_session_id;
  insert into public.preference_study_messages (
    id, workspace_id, edit_reference_id, study_session_id, sequence, role,
    content, content_digest, reasoning_attempt_id, runtime_source
  ) values (
    assistant_id, run_row.workspace_id, run_row.edit_reference_id,
    run_row.study_session_id, message_sequence, 'assistant',
    p_request->>'assistantMessageContent', p_request->>'assistantMessageDigest',
    (select id from public.preference_study_reasoning_route_attempts where reasoning_run_id = run_uuid order by attempt_ordinal desc limit 1),
    'model_reasoning'
  );
  receipt_without_digest := jsonb_build_object(
    'reasoningRunId', run_uuid::text,
    'assistantMessageId', assistant_id::text,
    'requestDigest', run_row.canonical_request_hash,
    'routeAttemptSetDigest', p_request->>'routeAttemptSetDigest',
    'costAggregateDigest', p_request->>'costAggregateDigest',
    'failedAttemptCount', failed_count,
    'normalizedInternalCostMicros', aggregate_cost,
    'maximumUnverifiedExposureMicros', unverified_exposure,
    'terminalState', p_request->>'terminalState',
    'finalResultDigest', p_request->>'finalResultDigest'
  );
  receipt_digest := public.reeditpro_sha256_json(receipt_without_digest);
  insert into public.preference_study_reasoning_run_receipts (
    id, workspace_id, edit_reference_id, study_session_id, reasoning_run_id,
    assistant_message_id, request_digest, route_attempt_set_digest,
    cost_aggregate_digest, failed_attempt_count, normalized_internal_cost_micros,
    maximum_unverified_exposure_micros, terminal_state, final_result_digest,
    receipt_digest, settled_at
  ) values (
    receipt_id, run_row.workspace_id, run_row.edit_reference_id,
    run_row.study_session_id, run_uuid, assistant_id, run_row.canonical_request_hash,
    p_request->>'routeAttemptSetDigest', p_request->>'costAggregateDigest',
    failed_count, aggregate_cost, unverified_exposure,
    p_request->>'terminalState', p_request->>'finalResultDigest',
    receipt_digest, clock_timestamp()
  );
  update public.preference_study_reasoning_runs
    set status = p_request->>'terminalState', revision = revision + 1,
        durable_response_digest = receipt_digest, updated_at = clock_timestamp()
    where id = run_uuid;
  return next receipt_without_digest || jsonb_build_object(
    'receiptId', receipt_id::text,
    'receiptDigest', receipt_digest,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false
  );
end;
$$;

create or replace function public.cancel_edit_reference_study_chat_run_v1(p_reasoning_run_id uuid, p_expected_revision bigint)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  affected integer;
begin
  update public.preference_study_reasoning_runs
    set status = 'cancelled', revision = revision + 1, updated_at = clock_timestamp()
    where id = p_reasoning_run_id and revision = p_expected_revision
      and status not in ('completed', 'failed', 'cancelled');
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_CANCEL_CHANGED';
  end if;
  update public.preference_study_reasoning_checkbacks
    set status = 'cancelled', lease_owner_digest = null, lease_token_digest = null,
        lease_expires_at = null, revision = revision + 1, updated_at = clock_timestamp()
    where reasoning_run_id = p_reasoning_run_id and status not in ('completed', 'cancelled');
  return next jsonb_build_object('reasoningRunId', p_reasoning_run_id::text, 'status', 'cancelled');
end;
$$;

create or replace function public.recover_expired_edit_reference_study_chat_checkback_lease_v1(p_checkback_id uuid)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  affected integer;
begin
  update public.preference_study_reasoning_checkbacks
    set status = 'expired', lease_owner_digest = null, lease_token_digest = null,
        lease_expires_at = null, revision = revision + 1, updated_at = clock_timestamp()
    where id = p_checkback_id and status = 'leased' and lease_expires_at <= clock_timestamp();
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception using errcode = '40001', message = 'EDIT_REFERENCE_STUDY_CHAT_CHECKBACK_NOT_EXPIRED';
  end if;
  return next jsonb_build_object('checkbackId', p_checkback_id::text, 'status', 'expired');
end;
$$;

revoke all on function public.reserve_edit_reference_study_chat_run_v1(jsonb) from public, anon;
grant execute on function public.reserve_edit_reference_study_chat_run_v1(jsonb) to authenticated, service_role;
do $$
declare
  signature text;
begin
  foreach signature in array array[
    'authorize_edit_reference_study_chat_route_attempt_v1(jsonb)',
    'reserve_edit_reference_study_chat_provider_request_v1(jsonb)',
    'consume_edit_reference_study_chat_submission_v1(jsonb)',
    'record_edit_reference_study_chat_provider_observation_v1(jsonb)',
    'schedule_edit_reference_study_chat_checkback_v1(jsonb)',
    'claim_edit_reference_study_chat_checkback_v1(jsonb)',
    'heartbeat_edit_reference_study_chat_checkback_v1(jsonb)',
    'settle_edit_reference_study_chat_route_attempt_v1(jsonb)',
    'authorize_edit_reference_study_chat_next_fallback_v1(jsonb)',
    'settle_edit_reference_study_chat_run_v1(jsonb)',
    'cancel_edit_reference_study_chat_run_v1(uuid,bigint)',
    'recover_expired_edit_reference_study_chat_checkback_lease_v1(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', signature);
    execute format('grant execute on function public.%s to service_role', signature);
  end loop;
end;
$$;
