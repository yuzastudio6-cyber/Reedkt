begin;

do $$
declare
  state_value jsonb;
  created_claim_id text;
  consumption_value jsonb;
  missing_consumption jsonb;
begin
  state_value := public.weeditpro_read_professional_gpu_queue_runtime_state_v1(
    'canonical-professional-gpu-queue-runtime-read-v1',
    'weeditpro-professional-gpu-production-v1',
    'us-central1'
  );
  if state_value->>'schemaVersion' <>
      'canonical-professional-gpu-queue-runtime-state-v1'
    or state_value->>'source' <>
      'canonical_postgres_professional_gpu_queue_read_owner'
    or state_value->>'queueId' <>
      'weeditpro-professional-gpu-production-v1'
    or state_value->>'runtimeRegion' <> 'us-central1'
    or jsonb_array_length(state_value->'routeStates') <> 3
    or state_value->'routeStates'->0->>'routeId' <>
      'a100_80gb_heavy_primary'
    or state_value->'routeStates'->1->>'routeId' <>
      'l4_heavy_fallback'
    or state_value->'routeStates'->2->>'routeId' <>
      'l4_standard_primary'
    or (state_value->>'exactSharedPostgresStateReread')::boolean is not true
    or (state_value->>'callerCapacityAccepted')::boolean
    or (state_value->>'customerCreditsMutated')::boolean
    or (state_value->>'productionAuthorityGranted')::boolean
    or state_value->>'stateHash' <>
      public.reeditpro_sha256_json(state_value - 'stateHash') then
    raise exception 'GPU_QUEUE_RUNTIME_STATE_INVALID';
  end if;

  missing_consumption :=
    public.weeditpro_read_professional_gpu_queue_consumption_v1(
      'canonical-professional-gpu-queue-runtime-read-v1',
      'weeditpro-professional-gpu-production-v1',
      'us-central1',
      'missing-claim-for-fail-closed-read'
    );
  if missing_consumption is not null then
    raise exception 'GPU_QUEUE_MISSING_CONSUMPTION_NOT_CLOSED';
  end if;

  select claim_id into created_claim_id
  from public.professional_gpu_cloud_task_outbox
  where queue_id = 'weeditpro-professional-gpu-production-v1'
    and runtime_region = 'us-central1'
    and status = 'created'
  order by claim_id
  limit 1;
  if created_claim_id is null then
    raise exception 'GPU_QUEUE_CREATED_CONSUMPTION_FIXTURE_MISSING';
  end if;
  consumption_value :=
    public.weeditpro_read_professional_gpu_queue_consumption_v1(
      'canonical-professional-gpu-queue-runtime-read-v1',
      'weeditpro-professional-gpu-production-v1',
      'us-central1',
      created_claim_id
    );
  if consumption_value->>'schemaVersion' <>
      'canonical-professional-gpu-queue-consumption-bootstrap-v1'
    or consumption_value->>'queueEntryStatus' <> 'dispatched'
    or consumption_value->'claim'->>'claimId' <> created_claim_id
    or consumption_value->'outboxRecord'->>'status' <> 'created'
    or (consumption_value->>'exactDispatchedClaimAndCreatedTaskReread')::boolean
      is not true
    or (consumption_value->>'browserOrCallerExecutionMaterialAccepted')::boolean
    or (consumption_value->>'customerCreditsMutated')::boolean
    or (consumption_value->>'productionAuthorityGranted')::boolean
    or consumption_value->>'consumptionHash' <>
      public.reeditpro_sha256_json(
        consumption_value - 'consumptionHash'
      ) then
    raise exception 'GPU_QUEUE_CONSUMPTION_READ_INVALID';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege(
      'anon',
      'public.weeditpro_read_professional_gpu_queue_runtime_state_v1(text,text,text)',
      'execute'
    ) or has_function_privilege(
      'authenticated',
      'public.weeditpro_read_professional_gpu_queue_runtime_state_v1(text,text,text)',
      'execute'
    ) or not has_function_privilege(
      'service_role',
      'public.weeditpro_read_professional_gpu_queue_runtime_state_v1(text,text,text)',
      'execute'
    ) or has_function_privilege(
      'anon',
      'public.weeditpro_read_professional_gpu_queue_consumption_v1(text,text,text,text)',
      'execute'
    ) or has_function_privilege(
      'authenticated',
      'public.weeditpro_read_professional_gpu_queue_consumption_v1(text,text,text,text)',
      'execute'
    ) or not has_function_privilege(
      'service_role',
      'public.weeditpro_read_professional_gpu_queue_consumption_v1(text,text,text,text)',
      'execute'
    ) then
    raise exception 'GPU_QUEUE_RUNTIME_READ_GRANTS_INVALID';
  end if;
end;
$$;

rollback;
