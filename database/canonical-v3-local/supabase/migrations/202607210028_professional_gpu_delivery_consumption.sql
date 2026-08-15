-- WeEditPro canonical V3 local-only professional GPU delivery consumption.
-- This additive migration keeps the already-published v1 task envelope
-- readable, admits the current 900-second v2 envelope, and exposes one exact
-- dispatched-or-terminal reread for duplicate Cloud Tasks delivery. It does
-- not grant remote, GPU, credit, QA, delivery, or production authority.

create or replace function public.weeditpro_gpu_cloud_task_spec_valid(
  p_value jsonb
)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare payload jsonb;
declare body_payload jsonb;
declare expected_task_id text;
declare expected_path text;
declare expected_deadline text;
declare expected_body_version text;
declare expected_name_domain text;
begin
  if p_value->>'schemaVersion' =
      'canonical-professional-gpu-cloud-task-spec-v1' then
    expected_path := '/internal/v1/professional-gpu-queue/claims/consume';
    expected_deadline := '60s';
    expected_body_version :=
      'canonical-professional-gpu-cloud-task-body-v1';
    expected_name_domain :=
      'canonical_professional_gpu_cloud_task_name_v1';
  elsif p_value->>'schemaVersion' =
      'canonical-professional-gpu-cloud-task-spec-v2' then
    expected_path := '/internal/v2/professional-gpu-queue/claims/consume';
    expected_deadline := '900s';
    expected_body_version :=
      'canonical-professional-gpu-cloud-task-body-v2';
    expected_name_domain :=
      'canonical_professional_gpu_cloud_task_name_v2';
  else
    return false;
  end if;
  if not public.weeditpro_gpu_queue_exact_keys(p_value, array[
      'schemaVersion', 'source', 'evidenceClass', 'cloudTaskId',
      'cloudTaskName', 'queueResourceName', 'targetUrl',
      'oidcServiceAccountEmail', 'oidcAudience', 'httpMethod',
      'contentType', 'dispatchDeadline', 'body', 'bodyBase64', 'claimRef',
      'compiledAt', 'deterministicTaskNameAndBody',
      'namedTaskDeduplicationRequired',
      'cloudTasksDeliveryMayRepeatSameAttempt',
      'automaticNewExecutionAttemptAllowed',
      'callerSelectedQueueTargetServiceAccountOrDeadlineAccepted',
      'mediaPromptModelImageCommandPriceOrCredentialPresent',
      'cloudGpuDispatchStarted', 'customerCreditsMutated',
      'productionAuthorityGranted', 'specDigestSha256'
    ])
    or p_value->>'source' <>
      'canonical_server_professional_gpu_queue_dispatch'
    or p_value->>'evidenceClass' <>
      'deterministic_cloud_task_create_request'
    or p_value->>'queueResourceName' <>
      'projects/reeditpro/locations/us-central1/queues/' ||
      'weeditpro-professional-gpu-dispatch-v1'
    or p_value->>'oidcServiceAccountEmail' <>
      'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
    or p_value->>'httpMethod' <> 'POST'
    or p_value->>'contentType' <> 'application/json'
    or p_value->>'dispatchDeadline' <> expected_deadline
    or coalesce(p_value->>'targetUrl', '') !~ (
      '^https://[A-Za-z0-9.-]+[.]run[.]app' || expected_path || '$'
    )
    or p_value->>'oidcAudience' <>
      regexp_replace(p_value->>'targetUrl', expected_path || '$', '')
    or not public.weeditpro_gpu_queue_ref_valid(p_value->'claimRef')
    or not public.weeditpro_gpu_queue_timestamp_valid(p_value->>'compiledAt')
    or coalesce(p_value->>'specDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or not (p_value->>'deterministicTaskNameAndBody')::boolean
    or not (p_value->>'namedTaskDeduplicationRequired')::boolean
    or not (p_value->>'cloudTasksDeliveryMayRepeatSameAttempt')::boolean
    or (p_value->>'automaticNewExecutionAttemptAllowed')::boolean
    or (p_value->>'callerSelectedQueueTargetServiceAccountOrDeadlineAccepted')::boolean
    or (p_value->>'mediaPromptModelImageCommandPriceOrCredentialPresent')::boolean
    or (p_value->>'cloudGpuDispatchStarted')::boolean
    or (p_value->>'customerCreditsMutated')::boolean
    or (p_value->>'productionAuthorityGranted')::boolean then
    return false;
  end if;
  if not public.weeditpro_gpu_queue_exact_keys(p_value->'body', array[
      'schemaVersion', 'source', 'queueId', 'runtimeRegion',
      'queueEntryId', 'claimId', 'claimHash', 'executionAttemptRef',
      'databaseRereadRequiredBeforeGpuDispatch',
      'browserOrCallerExecutionMaterialAccepted',
      'automaticNewExecutionAttemptAllowed', 'bodyDigestSha256'
    ])
    or p_value->'body'->>'schemaVersion' <> expected_body_version
    or p_value->'body'->>'source' <>
      'canonical_server_professional_gpu_queue_dispatch'
    or p_value->'body'->>'queueId' <>
      'weeditpro-professional-gpu-production-v1'
    or p_value->'body'->>'runtimeRegion' <> 'us-central1'
    or not public.weeditpro_gpu_queue_safe_id(
      p_value->'body'->>'queueEntryId'
    )
    or not public.weeditpro_gpu_queue_safe_id(p_value->'body'->>'claimId')
    or coalesce(p_value->'body'->>'claimHash', '') !~ '^[a-f0-9]{64}$'
    or not public.weeditpro_gpu_queue_ref_valid(
      p_value->'body'->'executionAttemptRef'
    )
    or not (p_value->'body'->>'databaseRereadRequiredBeforeGpuDispatch')::boolean
    or (p_value->'body'->>'browserOrCallerExecutionMaterialAccepted')::boolean
    or (p_value->'body'->>'automaticNewExecutionAttemptAllowed')::boolean
    or p_value->'claimRef' <> jsonb_build_object(
      'id', p_value->'body'->>'claimId', 'version', 1,
      'contentHash', 'sha256:' || (p_value->'body'->>'claimHash')
    ) then
    return false;
  end if;
  body_payload := (p_value->'body') - 'bodyDigestSha256';
  if p_value->'body'->>'bodyDigestSha256' <>
      public.reeditpro_sha256_json(body_payload)
    or convert_from(decode(p_value->>'bodyBase64', 'base64'), 'UTF8')::jsonb <>
      p_value->'body' then
    return false;
  end if;
  expected_task_id := 'weeditpro-gpu-' || substr(
    public.reeditpro_sha256_json(jsonb_build_object(
      'domain', expected_name_domain,
      'queueId', p_value->'body'->>'queueId',
      'runtimeRegion', p_value->'body'->>'runtimeRegion',
      'queueEntryId', p_value->'body'->>'queueEntryId',
      'claimId', p_value->'body'->>'claimId',
      'claimHash', p_value->'body'->>'claimHash',
      'executionAttemptRef', p_value->'body'->'executionAttemptRef'
    )), 1, 48
  );
  if p_value->>'cloudTaskId' <> expected_task_id
    or p_value->>'cloudTaskName' <>
      (p_value->>'queueResourceName') || '/tasks/' || expected_task_id then
    return false;
  end if;
  payload := p_value - 'specDigestSha256';
  return p_value->>'specDigestSha256' =
    public.reeditpro_sha256_json(payload);
exception when others then
  return false;
end;
$$;

create or replace function public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(
  p_contract_version text,
  p_queue_id text,
  p_runtime_region text,
  p_claim_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare entry public.professional_gpu_fair_queue_entries%rowtype;
declare outbox public.professional_gpu_cloud_task_outbox%rowtype;
declare payload jsonb;
declare observed_at timestamptz := clock_timestamp();
begin
  if p_contract_version <>
      'canonical-professional-gpu-queue-runtime-read-v1'
    or p_queue_id <> 'weeditpro-professional-gpu-production-v1'
    or p_runtime_region <> 'us-central1'
    or not public.weeditpro_gpu_queue_safe_id(p_claim_id) then
    raise exception using errcode = '22023',
      message = 'GPU_QUEUE_DELIVERY_CONSUMPTION_READ_SCOPE_INVALID';
  end if;
  select queue_entry.* into entry
  from public.professional_gpu_fair_queue_entries queue_entry
  where queue_entry.queue_id = p_queue_id
    and queue_entry.runtime_region = p_runtime_region
    and queue_entry.claim_id = p_claim_id
    and queue_entry.status in ('dispatched', 'completed', 'failed_reconciled');
  if not found then return null; end if;
  select task_outbox.* into outbox
  from public.professional_gpu_cloud_task_outbox task_outbox
  where task_outbox.queue_id = p_queue_id
    and task_outbox.runtime_region = p_runtime_region
    and task_outbox.claim_id = p_claim_id
    and task_outbox.status = 'created';
  if not found then return null; end if;
  if entry.claim_hash <> outbox.claim_hash
    or entry.queue_entry_id <> outbox.queue_entry_id
    or entry.cloud_task_dispatch_receipt_ref <>
      outbox.record_json->'dispatchResult'->'cloudTaskRef'
    or entry.entry_json->'executionAttemptRef' <>
      outbox.record_json->'cloudTaskSpec'->'body'->'executionAttemptRef'
    or ((entry.status in ('completed', 'failed_reconciled')) <>
      (entry.terminal_json is not null))
    or (entry.terminal_json is not null and (
      entry.terminal_json->>'disposition' <> entry.status
      or entry.terminal_json->'claimRef' <> jsonb_build_object(
        'id', entry.claim_id, 'version', 1,
        'contentHash', 'sha256:' || entry.claim_hash
      )
      or entry.terminal_json->'executionAttemptRef' <>
        entry.entry_json->'executionAttemptRef'
    )) then
    raise exception using errcode = '22023',
      message = 'GPU_QUEUE_DELIVERY_CONSUMPTION_LINEAGE_CHANGED';
  end if;
  payload := jsonb_build_object(
    'schemaVersion',
      'canonical-professional-gpu-queue-delivery-consumption-v2',
    'source', 'canonical_postgres_professional_gpu_queue_read_owner',
    'queueId', p_queue_id,
    'runtimeRegion', p_runtime_region,
    'queueEntryStatus', entry.status,
    'claim', entry.claim_json,
    'outboxRecord', outbox.record_json,
    'terminal', entry.terminal_json,
    'exactClaimCreatedTaskAndTerminalReread', true,
    'browserOrCallerExecutionMaterialAccepted', false,
    'customerCreditsMutated', false,
    'productionAuthorityGranted', false,
    'observedAt', public.reeditpro_iso_timestamp(observed_at)
  );
  return payload || jsonb_build_object(
    'consumptionHash', public.reeditpro_sha256_json(payload)
  );
end;
$$;

revoke all on function
  public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(
    text, text, text, text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.weeditpro_read_professional_gpu_queue_delivery_consumption_v2(
    text, text, text, text
  ) to service_role;
