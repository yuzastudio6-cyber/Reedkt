begin;

do $$
declare
  entry public.professional_gpu_fair_queue_entries%rowtype;
  dispatched_value jsonb;
  terminal_value jsonb;
  finalize_request jsonb;
  finalize_result jsonb;
  terminal_at timestamptz;
begin
  select queue_entry.* into entry
  from public.professional_gpu_fair_queue_entries queue_entry
  join public.professional_gpu_cloud_task_outbox outbox
    on outbox.queue_id = queue_entry.queue_id
    and outbox.runtime_region = queue_entry.runtime_region
    and outbox.queue_entry_id = queue_entry.queue_entry_id
    and outbox.claim_id = queue_entry.claim_id
  where queue_entry.queue_id =
      'weeditpro-professional-gpu-production-v1'
    and queue_entry.runtime_region = 'us-central1'
    and queue_entry.status = 'dispatched'
    and outbox.status = 'created'
  order by queue_entry.claim_id
  limit 1;
  if not found then
    raise exception 'GPU_QUEUE_DELIVERY_CREATED_FIXTURE_MISSING';
  end if;

  dispatched_value :=
    public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(
      'canonical-professional-gpu-queue-runtime-read-v1',
      entry.queue_id,
      entry.runtime_region,
      entry.claim_id
    );
  if dispatched_value->>'schemaVersion' <>
      'canonical-professional-gpu-queue-delivery-consumption-v2'
    or dispatched_value->>'queueEntryStatus' <> 'dispatched'
    or dispatched_value->'claim'->>'claimId' <> entry.claim_id
    or dispatched_value->'outboxRecord'->>'status' <> 'created'
    or dispatched_value->'terminal' <> 'null'::jsonb
    or (dispatched_value->>
      'exactClaimCreatedTaskAndTerminalReread')::boolean is not true
    or (dispatched_value->>
      'browserOrCallerExecutionMaterialAccepted')::boolean
    or (dispatched_value->>'customerCreditsMutated')::boolean
    or (dispatched_value->>'productionAuthorityGranted')::boolean
    or dispatched_value->>'consumptionHash' <>
      public.reeditpro_sha256_json(
        dispatched_value - 'consumptionHash'
      ) then
    raise exception 'GPU_QUEUE_DISPATCHED_DELIVERY_READ_INVALID';
  end if;

  terminal_at := entry.dispatched_at + interval '1 second';
  finalize_request := jsonb_build_object(
    'schemaVersion',
      'canonical-professional-gpu-fair-queue-transaction-port-v1',
    'requestId', 'gpu-delivery-consumption-terminal-v1',
    'queueId', entry.queue_id,
    'runtimeRegion', entry.runtime_region,
    'operation', 'finalize',
    'queueEntryId', entry.queue_entry_id,
    'executionAttemptRef', entry.entry_json->'executionAttemptRef',
    'claimRef', jsonb_build_object(
      'id', entry.claim_id,
      'version', 1,
      'contentHash', 'sha256:' || entry.claim_hash
    ),
    'terminalEvidenceRef', jsonb_build_object(
      'id', 'gpu-delivery-consumption-terminal-evidence-v1',
      'version', 1,
      'contentHash', 'sha256:' || repeat('9', 64)
    ),
    'disposition', 'completed',
    'terminalAt', public.reeditpro_iso_timestamp(terminal_at)
  );
  finalize_request := finalize_request || jsonb_build_object(
    'requestDigestSha256', public.reeditpro_sha256_json(
      jsonb_build_object(
        'domain',
          'canonical_professional_gpu_fair_queue_transaction_request_v1',
        'operation', 'finalize',
        'request', finalize_request
      )
    )
  );
  finalize_result := public.weeditpro_finalize_professional_gpu_fair_queue_v1(
    'canonical-professional-gpu-fair-queue-transaction-port-v1',
    finalize_request
  );
  if finalize_result->>'disposition' <> 'finalized'
    or finalize_result->'terminal'->>'disposition' <> 'completed'
    or (finalize_result->'terminal'->>'customerCreditsMutated')::boolean
    or (finalize_result->'terminal'->>'productionAuthorityGranted')::boolean then
    raise exception 'GPU_QUEUE_DELIVERY_TERMINAL_FINALIZE_INVALID';
  end if;

  terminal_value :=
    public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(
      'canonical-professional-gpu-queue-runtime-read-v1',
      entry.queue_id,
      entry.runtime_region,
      entry.claim_id
    );
  if terminal_value->>'queueEntryStatus' <> 'completed'
    or terminal_value->'terminal'->>'disposition' <> 'completed'
    or terminal_value->'terminal'->'claimRef' <>
      finalize_request->'claimRef'
    or terminal_value->'terminal'->'executionAttemptRef' <>
      finalize_request->'executionAttemptRef'
    or terminal_value->'terminal'->'terminalEvidenceRef' <>
      finalize_request->'terminalEvidenceRef'
    or terminal_value->'terminal'->>'terminalHash' <>
      public.reeditpro_sha256_json(
        (terminal_value->'terminal') - 'terminalHash'
      )
    or terminal_value->>'consumptionHash' <>
      public.reeditpro_sha256_json(
        terminal_value - 'consumptionHash'
      ) then
    raise exception 'GPU_QUEUE_TERMINAL_DELIVERY_READ_INVALID';
  end if;

  if public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(
      'canonical-professional-gpu-queue-runtime-read-v1',
      entry.queue_id,
      entry.runtime_region,
      'missing-delivery-consumption-claim'
    ) is not null then
    raise exception 'GPU_QUEUE_MISSING_DELIVERY_NOT_CLOSED';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege(
      'anon',
      'public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(text,text,text,text)',
      'execute'
    ) or has_function_privilege(
      'authenticated',
      'public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(text,text,text,text)',
      'execute'
    ) or not has_function_privilege(
      'service_role',
      'public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(text,text,text,text)',
      'execute'
    ) then
    raise exception 'GPU_QUEUE_DELIVERY_READ_GRANTS_INVALID';
  end if;
end;
$$;

rollback;
