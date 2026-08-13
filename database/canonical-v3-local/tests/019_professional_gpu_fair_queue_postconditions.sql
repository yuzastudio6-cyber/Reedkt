begin;

do $$
declare
  owner_id uuid := '11111111-1111-4111-8111-111111111111';
  current_workspace_id uuid;
  current_project_id uuid;
  current_workspace_index integer;
  request_value jsonb;
  claim_response jsonb;
  active_max integer;
begin
  for current_workspace_index in 1..16 loop
    current_workspace_id := format(
      '10000000-0000-4000-8000-%s',
      lpad(current_workspace_index::text, 12, '0')
    )::uuid;
    current_project_id := format(
      '20000000-0000-4000-8000-%s',
      lpad(current_workspace_index::text, 12, '0')
    )::uuid;
    insert into public.workspaces(id, owner_user_id, name)
    values (
      current_workspace_id,
      owner_id,
      'GPU stress workspace ' || current_workspace_index
    );
    insert into public.workspace_members(workspace_id, user_id, role)
    values (current_workspace_id, owner_id, 'owner');
    insert into public.projects(
      id, workspace_id, owner_user_id, title, editing_category
    ) values (
      current_project_id, current_workspace_id, owner_id,
      'GPU stress project ' || current_workspace_index, 'documentary'
    );
  end loop;

  insert into public.professional_gpu_fair_queue_controls(
    queue_id, runtime_region, revision, created_at, updated_at
  ) values (
    'weeditpro-gpu-10000-stress-v1', 'us-central1', 10000,
    '2026-08-12T19:00:00.000Z', '2026-08-12T19:00:00.000Z'
  );

  with generated as (
    select
      entry_index,
      ((entry_index - 1) % 16) + 1 as workspace_index
    from generate_series(1, 10000) entry_index
  ), scoped as (
    select
      entry_index,
      format(
        '10000000-0000-4000-8000-%s',
        lpad(workspace_index::text, 12, '0')
      )::uuid as workspace_id,
      format(
        '20000000-0000-4000-8000-%s',
        lpad(workspace_index::text, 12, '0')
      )::uuid as project_id
    from generated
  ), entries as (
    select
      entry_index,
      workspace_id,
      project_id,
      jsonb_build_object(
        'queueEntryId', 'stress-entry-' || lpad(entry_index::text, 5, '0'),
        'ownerUserId', owner_id::text,
        'workspaceId', workspace_id::text,
        'projectId', project_id::text,
        'routeId', case when entry_index % 2 = 0
          then 'a100_80gb_heavy_primary' else 'l4_standard_primary' end,
        'approvedSnapshotRef', jsonb_build_object(
          'id', 'stress-snapshot-' || entry_index, 'version', 1,
          'contentHash', 'sha256:' || repeat('a', 64)
        ),
        'approvedWorkItemRef', jsonb_build_object(
          'id', 'stress-work-' || entry_index, 'version', 1,
          'contentHash', 'sha256:' || repeat('b', 64)
        ),
        'fundedDispatchAdmissionRef', jsonb_build_object(
          'id', 'stress-funded-' || entry_index, 'version', 1,
          'contentHash', 'sha256:' || repeat('c', 64)
        ),
        'executionAttemptRef', jsonb_build_object(
          'id', 'stress-attempt-' || entry_index, 'version', 1,
          'contentHash', 'sha256:' || lpad(to_hex(entry_index), 64, '0')
        ),
        'userTriggerRecordRef', jsonb_build_object(
          'id', 'stress-trigger-' || entry_index, 'version', 1,
          'contentHash', 'sha256:' || repeat('d', 64)
        ),
        'enqueuedAt', public.reeditpro_iso_timestamp(
          '2026-08-12T19:00:00.000Z'::timestamptz
            + make_interval(secs => entry_index)
        ),
        'enqueueOrdinal', entry_index,
        'userTriggeredAfterApprovalAndFunding', true,
        'callerSelectedPriorityCapacityOrRoute', false
      ) as entry_value
    from scoped
  )
  insert into public.professional_gpu_fair_queue_entries(
    queue_id, runtime_region, queue_entry_id, owner_user_id, workspace_id,
    project_id, route_id, execution_attempt_identity, entry_json,
    entry_hash, enqueued_at, enqueue_ordinal, status, updated_at
  )
  select
    'weeditpro-gpu-10000-stress-v1', 'us-central1',
    entry_value->>'queueEntryId', owner_id, workspace_id, project_id,
    entry_value->>'routeId',
    public.reeditpro_canonical_json(entry_value->'executionAttemptRef'),
    entry_value, public.reeditpro_sha256_json(entry_value),
    (entry_value->>'enqueuedAt')::timestamptz, entry_index, 'queued',
    '2026-08-12T19:00:00.000Z'
  from entries;

  request_value := jsonb_build_object(
    'schemaVersion',
      'canonical-professional-gpu-fair-queue-transaction-port-v1',
    'requestId', 'stress-claim-10000-v1',
    'queueId', 'weeditpro-gpu-10000-stress-v1',
    'runtimeRegion', 'us-central1',
    'operation', 'claim',
    'scheduleId', 'stress-schedule-10000-v1',
    'capacities', jsonb_build_array(
      jsonb_build_object(
        'routeId', 'a100_80gb_heavy_primary',
        'capacityObservationRef', jsonb_build_object(
          'id', 'stress-a100-capacity', 'version', 1,
          'contentHash', 'sha256:' || repeat('e', 64)
        ),
        'maximumConcurrentAttempts', 16,
        'currentActiveAttempts', 0,
        'minimumIdleGpuInstances', 0,
        'exactCurrentQuotaAndRuntimeCapacityReread', true
      ),
      jsonb_build_object(
        'routeId', 'l4_standard_primary',
        'capacityObservationRef', jsonb_build_object(
          'id', 'stress-l4-capacity', 'version', 1,
          'contentHash', 'sha256:' || repeat('f', 64)
        ),
        'maximumConcurrentAttempts', 16,
        'currentActiveAttempts', 0,
        'minimumIdleGpuInstances', 0,
        'exactCurrentQuotaAndRuntimeCapacityReread', true
      )
    ),
    'claimedAt', '2026-08-12T23:00:00.000Z',
    'dispatchLeaseDurationSeconds', 120
  );
  request_value := request_value || jsonb_build_object(
    'requestDigestSha256', public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_professional_gpu_fair_queue_transaction_request_v1',
      'operation', 'claim',
      'request', request_value
    ))
  );
  claim_response := public.weeditpro_claim_professional_gpu_fair_queue_v1(
    'canonical-professional-gpu-fair-queue-transaction-port-v1',
    request_value
  );
  if claim_response->>'disposition' <> 'claims_created'
    or (claim_response->>'activeCount')::integer <> 32
    or (claim_response->>'queuedCount')::integer <> 9968
    or jsonb_array_length(claim_response->'claims') <> 32
    or (claim_response->>'cpuSubstantiveFallbackAllowed')::boolean
    or (claim_response->>'automaticQualityReductionAllowed')::boolean
    or (claim_response->>'productionAuthorityGranted')::boolean then
    raise exception 'GPU_QUEUE_10000_STRESS_RESULT_INVALID';
  end if;
  select max(active_count) into active_max from (
    select entries.workspace_id, count(*) active_count
    from public.professional_gpu_fair_queue_entries entries
    where entries.queue_id = 'weeditpro-gpu-10000-stress-v1'
      and entries.runtime_region = 'us-central1'
      and entries.status = 'claimed'
    group by entries.workspace_id
  ) counts;
  if active_max <> 2 then
    raise exception 'GPU_QUEUE_WORKSPACE_FAIRNESS_INVALID';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege(
      'anon',
      'public.weeditpro_enqueue_professional_gpu_fair_queue_v1(text,jsonb)',
      'execute'
    ) or has_function_privilege(
      'authenticated',
      'public.weeditpro_enqueue_professional_gpu_fair_queue_v1(text,jsonb)',
      'execute'
    ) or not has_function_privilege(
      'service_role',
      'public.weeditpro_enqueue_professional_gpu_fair_queue_v1(text,jsonb)',
      'execute'
    ) then
    raise exception 'GPU_QUEUE_RPC_GRANTS_INVALID';
  end if;
end;
$$;

rollback;
