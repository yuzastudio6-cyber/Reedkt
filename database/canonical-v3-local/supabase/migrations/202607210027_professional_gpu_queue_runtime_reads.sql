-- WeEditPro server-only production GPU scheduler/consumer rereads.
-- These functions expose no media, prompt, model, command, credential,
-- pricing, wallet, QA, delivery, or public-production authority.

create or replace function public.weeditpro_read_professional_gpu_queue_runtime_state_v1(
  p_contract_version text,
  p_queue_id text,
  p_runtime_region text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare observed_at timestamptz := clock_timestamp();
declare revision_value bigint := 0;
declare route_states jsonb;
declare payload jsonb;
begin
  if p_contract_version <>
      'canonical-professional-gpu-queue-runtime-read-v1'
    or p_queue_id <> 'weeditpro-professional-gpu-production-v1'
    or p_runtime_region <> 'us-central1' then
    raise exception using errcode = '22023',
      message = 'GPU_QUEUE_RUNTIME_READ_SCOPE_INVALID';
  end if;
  select coalesce(control.revision, 0) into revision_value
  from (select 1) singleton
  left join public.professional_gpu_fair_queue_controls control
    on control.queue_id = p_queue_id
      and control.runtime_region = p_runtime_region;
  route_states := jsonb_build_array(
    jsonb_build_object(
      'routeId', 'a100_80gb_heavy_primary',
      'queuedCount', (
        select count(*) from public.professional_gpu_fair_queue_entries
        where queue_id = p_queue_id and runtime_region = p_runtime_region
          and route_id = 'a100_80gb_heavy_primary' and status = 'queued'
      ),
      'activeCount', (
        select count(*) from public.professional_gpu_fair_queue_entries
        where queue_id = p_queue_id and runtime_region = p_runtime_region
          and route_id = 'a100_80gb_heavy_primary'
          and status in ('claimed', 'dispatched', 'reconciliation_required')
      )
    ),
    jsonb_build_object(
      'routeId', 'l4_heavy_fallback',
      'queuedCount', (
        select count(*) from public.professional_gpu_fair_queue_entries
        where queue_id = p_queue_id and runtime_region = p_runtime_region
          and route_id = 'l4_heavy_fallback' and status = 'queued'
      ),
      'activeCount', (
        select count(*) from public.professional_gpu_fair_queue_entries
        where queue_id = p_queue_id and runtime_region = p_runtime_region
          and route_id = 'l4_heavy_fallback'
          and status in ('claimed', 'dispatched', 'reconciliation_required')
      )
    ),
    jsonb_build_object(
      'routeId', 'l4_standard_primary',
      'queuedCount', (
        select count(*) from public.professional_gpu_fair_queue_entries
        where queue_id = p_queue_id and runtime_region = p_runtime_region
          and route_id = 'l4_standard_primary' and status = 'queued'
      ),
      'activeCount', (
        select count(*) from public.professional_gpu_fair_queue_entries
        where queue_id = p_queue_id and runtime_region = p_runtime_region
          and route_id = 'l4_standard_primary'
          and status in ('claimed', 'dispatched', 'reconciliation_required')
      )
    )
  );
  payload := jsonb_build_object(
    'schemaVersion', 'canonical-professional-gpu-queue-runtime-state-v1',
    'source', 'canonical_postgres_professional_gpu_queue_read_owner',
    'queueId', p_queue_id,
    'runtimeRegion', p_runtime_region,
    'controlRevision', revision_value,
    'routeStates', route_states,
    'queuedCount', (
      select count(*) from public.professional_gpu_fair_queue_entries
      where queue_id = p_queue_id and runtime_region = p_runtime_region
        and status = 'queued'
    ),
    'activeCount', (
      select count(*) from public.professional_gpu_fair_queue_entries
      where queue_id = p_queue_id and runtime_region = p_runtime_region
        and status in ('claimed', 'dispatched', 'reconciliation_required')
    ),
    'exactSharedPostgresStateReread', true,
    'callerCapacityAccepted', false,
    'customerCreditsMutated', false,
    'productionAuthorityGranted', false,
    'observedAt', public.reeditpro_iso_timestamp(observed_at)
  );
  return payload || jsonb_build_object(
    'stateHash', public.reeditpro_sha256_json(payload)
  );
end;
$$;

create or replace function public.weeditpro_read_professional_gpu_queue_consumption_v1(
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
      message = 'GPU_QUEUE_CONSUMPTION_READ_SCOPE_INVALID';
  end if;
  select queue_entry.* into entry
  from public.professional_gpu_fair_queue_entries queue_entry
  where queue_entry.queue_id = p_queue_id
    and queue_entry.runtime_region = p_runtime_region
    and queue_entry.claim_id = p_claim_id
    and queue_entry.status = 'dispatched';
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
      outbox.record_json->'cloudTaskSpec'->'body'->'executionAttemptRef' then
    raise exception using errcode = '22023',
      message = 'GPU_QUEUE_CONSUMPTION_LINEAGE_CHANGED';
  end if;
  payload := jsonb_build_object(
    'schemaVersion',
      'canonical-professional-gpu-queue-consumption-bootstrap-v1',
    'source', 'canonical_postgres_professional_gpu_queue_read_owner',
    'queueId', p_queue_id,
    'runtimeRegion', p_runtime_region,
    'queueEntryStatus', 'dispatched',
    'claim', entry.claim_json,
    'outboxRecord', outbox.record_json,
    'exactDispatchedClaimAndCreatedTaskReread', true,
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

do $$
declare signature text;
begin
  foreach signature in array array[
    'weeditpro_read_professional_gpu_queue_runtime_state_v1(text,text,text)',
    'weeditpro_read_professional_gpu_queue_consumption_v1(text,text,text,text)'
  ] loop
    execute format(
      'revoke all on function public.%s from public, anon, authenticated, service_role',
      signature
    );
    execute format('grant execute on function public.%s to service_role', signature);
  end loop;
end;
$$;
