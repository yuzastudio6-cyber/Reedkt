-- WeEditPro canonical V3 local-only professional GPU fair queue.
-- This is a server-only transactional proof. It does not grant remote,
-- Cloud Tasks, GPU dispatch, customer-credit, QA, delivery, or production
-- authority.

create table public.professional_gpu_fair_queue_controls (
  queue_id text not null,
  runtime_region text not null check (
    runtime_region in ('us-central1', 'us-east1', 'europe-west1')
  ),
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (queue_id, runtime_region),
  check (queue_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'),
  check (queue_id not like '%..%'),
  check (updated_at >= created_at)
);

create table public.professional_gpu_fair_queue_entries (
  queue_id text not null,
  runtime_region text not null,
  queue_entry_id text not null,
  owner_user_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  route_id text not null check (route_id in (
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
    'l4_standard_primary'
  )),
  execution_attempt_identity text not null,
  entry_json jsonb not null,
  entry_hash text not null check (entry_hash ~ '^[a-f0-9]{64}$'),
  enqueued_at timestamptz not null,
  enqueue_ordinal bigint not null check (enqueue_ordinal > 0),
  status text not null check (status in (
    'queued', 'claimed', 'dispatched', 'reconciliation_required',
    'completed', 'failed_reconciled'
  )),
  schedule_ref jsonb,
  claim_id text,
  claim_json jsonb,
  claim_hash text check (claim_hash is null or claim_hash ~ '^[a-f0-9]{64}$'),
  claimed_at timestamptz,
  dispatch_lease_expires_at timestamptz,
  cloud_task_dispatch_receipt_ref jsonb,
  dispatched_at timestamptz,
  terminal_json jsonb,
  terminal_hash text check (
    terminal_hash is null or terminal_hash ~ '^[a-f0-9]{64}$'
  ),
  terminal_at timestamptz,
  updated_at timestamptz not null,
  primary key (queue_id, runtime_region, queue_entry_id),
  unique (queue_id, runtime_region, execution_attempt_identity),
  foreign key (queue_id, runtime_region)
    references public.professional_gpu_fair_queue_controls(
      queue_id, runtime_region
    ) on delete restrict,
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete restrict,
  check (queue_entry_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'),
  check (queue_entry_id not like '%..%'),
  check (jsonb_typeof(entry_json) = 'object'),
  check ((status = 'queued') = (claim_json is null)),
  check (
    status = 'queued'
    or (
      schedule_ref is not null and claim_id is not null
      and claim_json is not null and claim_hash is not null
      and claimed_at is not null and dispatch_lease_expires_at is not null
      and claimed_at >= enqueued_at
      and dispatch_lease_expires_at > claimed_at
    )
  ),
  check (
    status not in ('dispatched', 'reconciliation_required', 'completed',
      'failed_reconciled')
    or (
      cloud_task_dispatch_receipt_ref is not null and dispatched_at is not null
      and dispatched_at >= claimed_at
      and dispatched_at <= dispatch_lease_expires_at
    )
  ),
  check (
    status not in ('completed', 'failed_reconciled')
    or (terminal_json is not null and terminal_hash is not null
      and terminal_at is not null and terminal_at >= claimed_at
      and (dispatched_at is null or terminal_at >= dispatched_at))
  )
);

create index professional_gpu_fair_queue_order
  on public.professional_gpu_fair_queue_entries(
    queue_id, runtime_region, status, enqueued_at, enqueue_ordinal,
    queue_entry_id
  );
create index professional_gpu_fair_queue_workspace_active
  on public.professional_gpu_fair_queue_entries(
    queue_id, runtime_region, workspace_id, status
  );
create index professional_gpu_fair_queue_expired_claim
  on public.professional_gpu_fair_queue_entries(
    queue_id, runtime_region, status, dispatch_lease_expires_at
  );

create table public.professional_gpu_fair_queue_receipts (
  queue_id text not null,
  runtime_region text not null,
  request_id text not null,
  operation text not null check (operation in (
    'enqueue', 'claim', 'mark_dispatched', 'finalize',
    'recover_expired_dispatch_leases'
  )),
  request_digest_sha256 text not null check (
    request_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  response_json jsonb not null,
  created_at timestamptz not null,
  primary key (queue_id, runtime_region, request_id),
  foreign key (queue_id, runtime_region)
    references public.professional_gpu_fair_queue_controls(
      queue_id, runtime_region
    ) on delete restrict,
  check (request_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'),
  check (request_id not like '%..%'),
  check (jsonb_typeof(response_json) = 'object')
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'professional_gpu_fair_queue_controls',
    'professional_gpu_fair_queue_entries',
    'professional_gpu_fair_queue_receipts'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format(
      'revoke all on table public.%I from public, anon, authenticated, service_role',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.weeditpro_gpu_queue_exact_keys(
  p_value jsonb,
  p_keys text[]
)
returns boolean
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select jsonb_typeof(p_value) = 'object'
    and coalesce(
      (select array_agg(key order by key) from jsonb_object_keys(p_value) key),
      '{}'::text[]
    ) = (select array_agg(key order by key) from unnest(p_keys) key);
$$;

create or replace function public.weeditpro_gpu_queue_ref_valid(p_value jsonb)
returns boolean
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.weeditpro_gpu_queue_exact_keys(
      p_value, array['id', 'version', 'contentHash']
    )
    and coalesce(p_value->>'id', '')
      ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'
    and p_value->>'id' not like '%..%'
    and coalesce(p_value->>'version', '') ~ '^[1-9][0-9]*$'
    and (p_value->>'version')::numeric <= 9007199254740991
    and coalesce(p_value->>'contentHash', '') ~ '^sha256:[a-f0-9]{64}$';
$$;

create or replace function public.weeditpro_gpu_queue_safe_id(p_value text)
returns boolean
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select p_value ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'
    and p_value not like '%..%';
$$;

create or replace function public.weeditpro_gpu_queue_timestamp_valid(
  p_value text
)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
begin
  perform p_value::timestamptz;
  return p_value ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
    and (p_value like '%Z' or p_value ~ '[+-][0-9]{2}:[0-9]{2}$');
exception when others then
  return false;
end;
$$;

create or replace function public.weeditpro_gpu_queue_entry_valid(p_value jsonb)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
begin
  return public.weeditpro_gpu_queue_exact_keys(p_value, array[
      'queueEntryId', 'ownerUserId', 'workspaceId', 'projectId', 'routeId',
      'approvedSnapshotRef', 'approvedWorkItemRef',
      'fundedDispatchAdmissionRef', 'executionAttemptRef',
      'userTriggerRecordRef', 'enqueuedAt', 'enqueueOrdinal',
      'userTriggeredAfterApprovalAndFunding',
      'callerSelectedPriorityCapacityOrRoute'
    ])
    and coalesce(p_value->>'queueEntryId', '')
      ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'
    and p_value->>'queueEntryId' not like '%..%'
    and coalesce(p_value->>'ownerUserId', '')
      ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    and coalesce(p_value->>'workspaceId', '')
      ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    and coalesce(p_value->>'projectId', '')
      ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    and p_value->>'routeId' in (
      'a100_80gb_heavy_primary', 'l4_heavy_fallback', 'l4_standard_primary'
    )
    and public.weeditpro_gpu_queue_ref_valid(p_value->'approvedSnapshotRef')
    and public.weeditpro_gpu_queue_ref_valid(p_value->'approvedWorkItemRef')
    and public.weeditpro_gpu_queue_ref_valid(
      p_value->'fundedDispatchAdmissionRef'
    )
    and public.weeditpro_gpu_queue_ref_valid(p_value->'executionAttemptRef')
    and public.weeditpro_gpu_queue_ref_valid(p_value->'userTriggerRecordRef')
    and public.weeditpro_gpu_queue_timestamp_valid(p_value->>'enqueuedAt')
    and coalesce(p_value->>'enqueueOrdinal', '') ~ '^[1-9][0-9]*$'
    and (p_value->>'enqueueOrdinal')::numeric <= 9007199254740991
    and jsonb_typeof(p_value->'userTriggeredAfterApprovalAndFunding') = 'boolean'
    and (p_value->>'userTriggeredAfterApprovalAndFunding')::boolean
    and jsonb_typeof(p_value->'callerSelectedPriorityCapacityOrRoute') = 'boolean'
    and not (p_value->>'callerSelectedPriorityCapacityOrRoute')::boolean;
exception when others then
  return false;
end;
$$;

create or replace function public.weeditpro_gpu_queue_request_valid(
  p_contract_version text,
  p_operation text,
  p_request jsonb
)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare request_without_digest jsonb;
begin
  if p_contract_version <>
      'canonical-professional-gpu-fair-queue-transaction-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or p_request->>'schemaVersion' <> p_contract_version
    or p_request->>'operation' <> p_operation
    or coalesce(p_request->>'requestId', '') = ''
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'requestId')
    or coalesce(p_request->>'requestDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or coalesce(p_request->>'queueId', '') = ''
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'queueId')
    or p_request->>'runtimeRegion' not in (
      'us-central1', 'us-east1', 'europe-west1'
    ) then
    return false;
  end if;
  request_without_digest := p_request - 'requestDigestSha256';
  return p_request->>'requestDigestSha256' = public.reeditpro_sha256_json(
    jsonb_build_object(
      'domain', 'canonical_professional_gpu_fair_queue_transaction_request_v1',
      'operation', p_operation,
      'request', request_without_digest
    )
  );
exception when others then
  return false;
end;
$$;

create or replace function public.weeditpro_gpu_queue_capacity_valid(
  p_value jsonb
)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
begin
  return public.weeditpro_gpu_queue_exact_keys(p_value, array[
      'routeId', 'capacityObservationRef', 'maximumConcurrentAttempts',
      'currentActiveAttempts', 'minimumIdleGpuInstances',
      'exactCurrentQuotaAndRuntimeCapacityReread'
    ])
    and p_value->>'routeId' in (
      'a100_80gb_heavy_primary', 'l4_heavy_fallback', 'l4_standard_primary'
    )
    and public.weeditpro_gpu_queue_ref_valid(p_value->'capacityObservationRef')
    and coalesce(p_value->>'maximumConcurrentAttempts', '') ~ '^[1-9][0-9]*$'
    and (p_value->>'maximumConcurrentAttempts')::integer between 1 and 64
    and coalesce(p_value->>'currentActiveAttempts', '') ~ '^[0-9]+$'
    and (p_value->>'currentActiveAttempts')::integer between 0 and 64
    and (p_value->>'currentActiveAttempts')::integer <=
      (p_value->>'maximumConcurrentAttempts')::integer
    and p_value->>'minimumIdleGpuInstances' = '0'
    and (p_value->>'exactCurrentQuotaAndRuntimeCapacityReread')::boolean;
exception when others then
  return false;
end;
$$;

create or replace function public.weeditpro_gpu_queue_counts(
  p_queue_id text,
  p_runtime_region text
)
returns jsonb
language sql
stable
strict
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'queuedCount', count(*) filter (where status = 'queued'),
    'activeCount', count(*) filter (where status in (
      'claimed', 'dispatched', 'reconciliation_required'
    ))
  )
  from public.professional_gpu_fair_queue_entries
  where queue_id = p_queue_id and runtime_region = p_runtime_region;
$$;

create or replace function public.weeditpro_gpu_queue_result(
  p_operation text,
  p_request jsonb,
  p_disposition text,
  p_queue_entry_ref jsonb,
  p_claims jsonb,
  p_terminal jsonb,
  p_requeued_count integer,
  p_reconciliation_count integer,
  p_revision bigint,
  p_committed_at timestamptz
)
returns jsonb
language plpgsql
volatile
set search_path = pg_catalog, public
as $$
declare counts_value jsonb;
declare result_value jsonb;
begin
  counts_value := public.weeditpro_gpu_queue_counts(
    p_request->>'queueId', p_request->>'runtimeRegion'
  );
  result_value := jsonb_build_object(
    'schemaVersion', 'canonical-professional-gpu-fair-queue-transaction-result-v1',
    'source', 'canonical_postgres_professional_gpu_fair_queue_owner',
    'operation', p_operation,
    'requestId', p_request->>'requestId',
    'requestDigestSha256', p_request->>'requestDigestSha256',
    'queueId', p_request->>'queueId',
    'runtimeRegion', p_request->>'runtimeRegion',
    'disposition', p_disposition,
    'queueEntryRef', p_queue_entry_ref,
    'claims', p_claims,
    'terminal', p_terminal,
    'queuedCount', (counts_value->>'queuedCount')::integer,
    'activeCount', (counts_value->>'activeCount')::integer,
    'requeuedBeforeDispatchCount', p_requeued_count,
    'reconciliationRequiredCount', p_reconciliation_count,
    'transactionRevision', p_revision,
    'transactionCommittedAt', public.reeditpro_iso_timestamp(p_committed_at),
    'sharedDurablePostgresTransactionPerformed', true,
    'workspaceRoundRobinFairnessApplied', true,
    'maximumActiveAttemptsPerWorkspace', 2,
    'cloudTasksDispatchStartedByQueueTransaction', false,
    'cpuSubstantiveFallbackAllowed', false,
    'automaticQualityReductionAllowed', false,
    'silentAdditionalCreditApprovalAllowed', false,
    'customerCreditsMutated', false,
    'qaApproved', false,
    'publicDeliveryAuthorized', false,
    'productionAuthorityGranted', false
  );
  return result_value || jsonb_build_object(
    'resultDigestSha256', public.reeditpro_sha256_json(result_value)
  );
end;
$$;

create or replace function public.weeditpro_gpu_queue_lock_and_replay(
  p_operation text,
  p_request jsonb
)
returns jsonb
language plpgsql
volatile
strict
set search_path = pg_catalog, public
as $$
declare receipt_row public.professional_gpu_fair_queue_receipts%rowtype;
declare committed_at timestamptz := clock_timestamp();
begin
  insert into public.professional_gpu_fair_queue_controls(
    queue_id, runtime_region, revision, created_at, updated_at
  ) values (
    p_request->>'queueId', p_request->>'runtimeRegion', 0,
    committed_at, committed_at
  ) on conflict (queue_id, runtime_region) do nothing;
  perform 1 from public.professional_gpu_fair_queue_controls
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  for update;
  select * into receipt_row
  from public.professional_gpu_fair_queue_receipts
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and request_id = p_request->>'requestId';
  if found then
    if receipt_row.operation <> p_operation
      or receipt_row.request_digest_sha256 <>
        p_request->>'requestDigestSha256' then
      raise exception using errcode = '23505',
        message = 'GPU_QUEUE_IDEMPOTENCY_CONFLICT';
    end if;
    return receipt_row.response_json;
  end if;
  return null;
end;
$$;

create or replace function public.weeditpro_gpu_queue_commit(
  p_operation text,
  p_request jsonb,
  p_response jsonb
)
returns jsonb
language plpgsql
volatile
strict
set search_path = pg_catalog, public
as $$
begin
  insert into public.professional_gpu_fair_queue_receipts(
    queue_id, runtime_region, request_id, operation,
    request_digest_sha256, response_json, created_at
  ) values (
    p_request->>'queueId', p_request->>'runtimeRegion',
    p_request->>'requestId', p_operation,
    p_request->>'requestDigestSha256', p_response, clock_timestamp()
  );
  return p_response;
end;
$$;

create or replace function public.weeditpro_enqueue_professional_gpu_fair_queue_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare entry_value jsonb;
declare existing public.professional_gpu_fair_queue_entries%rowtype;
declare entry_hash_value text;
declare disposition_value text := 'queued';
declare revision_value bigint;
declare committed_at timestamptz := clock_timestamp();
declare queue_entry_ref jsonb;
begin
  if not public.weeditpro_gpu_queue_request_valid(
      p_contract_version, 'enqueue', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'entry', 'requestedAt'
    ]) or not public.weeditpro_gpu_queue_entry_valid(p_request->'entry') then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_queue_lock_and_replay('enqueue', p_request);
  if replay is not null then return replay; end if;
  committed_at := clock_timestamp();
  entry_value := p_request->'entry';
  if not exists (
    select 1 from public.workspace_members member
    join public.projects project
      on project.workspace_id = member.workspace_id
    where member.workspace_id = (entry_value->>'workspaceId')::uuid
      and member.user_id = (entry_value->>'ownerUserId')::uuid
      and project.id = (entry_value->>'projectId')::uuid
  ) then
    raise exception using errcode = '42501', message = 'GPU_QUEUE_TENANT_DENIED';
  end if;
  if entry_value->>'enqueuedAt' <> p_request->>'requestedAt' then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_TIME_CHANGED';
  end if;
  entry_hash_value := public.reeditpro_sha256_json(entry_value);
  queue_entry_ref := jsonb_build_object(
    'id', entry_value->>'queueEntryId', 'version', 1,
    'contentHash', 'sha256:' || entry_hash_value
  );
  select * into existing
  from public.professional_gpu_fair_queue_entries
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and (
      queue_entry_id = entry_value->>'queueEntryId'
      or execution_attempt_identity =
        public.reeditpro_canonical_json(entry_value->'executionAttemptRef')
    );
  if found then
    if existing.entry_hash <> entry_hash_value then
      raise exception using errcode = '23505', message = 'GPU_QUEUE_ENTRY_CONFLICT';
    end if;
    disposition_value := case
      when existing.status = 'queued' then 'queued_replay'
      when existing.status in ('claimed', 'dispatched', 'reconciliation_required')
        then 'active_replay'
      else 'terminal_replay'
    end;
  else
    if (
      select count(*) from public.professional_gpu_fair_queue_entries
      where queue_id = p_request->>'queueId'
        and runtime_region = p_request->>'runtimeRegion'
        and status = 'queued'
    ) >= 10000 then
      raise exception using errcode = '54000', message = 'GPU_QUEUE_FULL';
    end if;
    insert into public.professional_gpu_fair_queue_entries(
      queue_id, runtime_region, queue_entry_id, owner_user_id, workspace_id,
      project_id, route_id, execution_attempt_identity, entry_json,
      entry_hash, enqueued_at, enqueue_ordinal, status, updated_at
    ) values (
      p_request->>'queueId', p_request->>'runtimeRegion',
      entry_value->>'queueEntryId', (entry_value->>'ownerUserId')::uuid,
      (entry_value->>'workspaceId')::uuid, (entry_value->>'projectId')::uuid,
      entry_value->>'routeId',
      public.reeditpro_canonical_json(entry_value->'executionAttemptRef'),
      entry_value, entry_hash_value, (entry_value->>'enqueuedAt')::timestamptz,
      (entry_value->>'enqueueOrdinal')::bigint, 'queued', committed_at
    );
  end if;
  update public.professional_gpu_fair_queue_controls
  set revision = revision + 1, updated_at = committed_at
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  returning revision into revision_value;
  return public.weeditpro_gpu_queue_commit(
    'enqueue', p_request, public.weeditpro_gpu_queue_result(
      'enqueue', p_request, disposition_value, queue_entry_ref, '[]'::jsonb,
      null, 0, 0, revision_value, committed_at
    )
  );
end;
$$;

create or replace function public.weeditpro_claim_professional_gpu_fair_queue_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare capacity_value jsonb;
declare available_by_route jsonb := '{}'::jsonb;
declare claimed_values jsonb := '[]'::jsonb;
declare selected_workspaces uuid[] := '{}'::uuid[];
declare candidate public.professional_gpu_fair_queue_entries%rowtype;
declare committed_at timestamptz := clock_timestamp();
declare lease_expires_at timestamptz;
declare schedule_ref_value jsonb;
declare claim_value jsonb;
declare claim_hash_value text;
declare claim_id_value text;
declare revision_value bigint;
declare selected_count integer := 0;
declare route_available integer;
declare duplicate_route_count integer;
begin
  if not public.weeditpro_gpu_queue_request_valid(
      p_contract_version, 'claim', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'scheduleId', 'capacities', 'claimedAt',
      'dispatchLeaseDurationSeconds'
    ]) or jsonb_typeof(p_request->'capacities') <> 'array'
    or jsonb_array_length(p_request->'capacities') not between 1 and 3
    or coalesce(p_request->>'dispatchLeaseDurationSeconds', '') !~ '^[0-9]+$'
    or (p_request->>'dispatchLeaseDurationSeconds')::integer not between 30 and 600
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'scheduleId')
    or not public.weeditpro_gpu_queue_timestamp_valid(p_request->>'claimedAt') then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_queue_lock_and_replay('claim', p_request);
  if replay is not null then return replay; end if;
  committed_at := clock_timestamp();
  select count(*) - count(distinct value->>'routeId') into duplicate_route_count
  from jsonb_array_elements(p_request->'capacities');
  if duplicate_route_count <> 0 then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_CAPACITY_DUPLICATED';
  end if;
  for capacity_value in
    select value from jsonb_array_elements(p_request->'capacities')
  loop
    if not public.weeditpro_gpu_queue_capacity_valid(capacity_value) then
      raise exception using errcode = '22023', message = 'GPU_QUEUE_CAPACITY_INVALID';
    end if;
    if (capacity_value->>'currentActiveAttempts')::integer <>
      (select count(*) from public.professional_gpu_fair_queue_entries
       where queue_id = p_request->>'queueId'
         and runtime_region = p_request->>'runtimeRegion'
         and route_id = capacity_value->>'routeId'
         and status in ('claimed', 'dispatched', 'reconciliation_required')) then
      raise exception using errcode = '40001',
        message = 'GPU_QUEUE_CAPACITY_ACTIVE_COUNT_CHANGED';
    end if;
    available_by_route := available_by_route || jsonb_build_object(
      capacity_value->>'routeId',
      (capacity_value->>'maximumConcurrentAttempts')::integer
        - (capacity_value->>'currentActiveAttempts')::integer
    );
  end loop;
  if exists (
    select 1 from public.professional_gpu_fair_queue_entries
    where queue_id = p_request->>'queueId'
      and runtime_region = p_request->>'runtimeRegion'
      and status in ('queued', 'claimed', 'dispatched', 'reconciliation_required')
      and not (available_by_route ? route_id)
  ) then
    raise exception using errcode = '22023',
      message = 'GPU_QUEUE_CAPACITY_ROUTE_MISSING';
  end if;
  lease_expires_at := (p_request->>'claimedAt')::timestamptz
    + make_interval(secs => (p_request->>'dispatchLeaseDurationSeconds')::integer);
  schedule_ref_value := jsonb_build_object(
    'id', p_request->>'scheduleId', 'version', 1,
    'contentHash', 'sha256:' || public.reeditpro_sha256_json(jsonb_build_object(
      'queueId', p_request->>'queueId',
      'runtimeRegion', p_request->>'runtimeRegion',
      'scheduleId', p_request->>'scheduleId',
      'capacities', p_request->'capacities',
      'claimedAt', p_request->>'claimedAt'
    ))
  );
  while selected_count < 192 loop
    select entry.* into candidate
    from public.professional_gpu_fair_queue_entries entry
    where entry.queue_id = p_request->>'queueId'
      and entry.runtime_region = p_request->>'runtimeRegion'
      and entry.status = 'queued'
      and entry.enqueued_at <= (p_request->>'claimedAt')::timestamptz
      and coalesce((available_by_route->>entry.route_id)::integer, 0) > 0
      and not (entry.workspace_id = any(selected_workspaces))
      and (
        select count(*) from public.professional_gpu_fair_queue_entries active
        where active.queue_id = entry.queue_id
          and active.runtime_region = entry.runtime_region
          and active.workspace_id = entry.workspace_id
          and active.status in ('claimed', 'dispatched', 'reconciliation_required')
      ) < 2
    order by
      (select min(lane.enqueued_at)
       from public.professional_gpu_fair_queue_entries lane
       where lane.queue_id = entry.queue_id
         and lane.runtime_region = entry.runtime_region
         and lane.workspace_id = entry.workspace_id
         and lane.status = 'queued'),
      entry.enqueued_at, entry.enqueue_ordinal, entry.queue_entry_id
    limit 1
    for update of entry skip locked;
    if not found then
      if cardinality(selected_workspaces) > 0 then
        selected_workspaces := '{}'::uuid[];
        continue;
      end if;
      exit;
    end if;
    claim_id_value := 'gpu-claim:' || public.reeditpro_sha256_json(
      jsonb_build_object(
        'queueId', candidate.queue_id,
        'queueEntryId', candidate.queue_entry_id,
        'executionAttemptRef', candidate.entry_json->'executionAttemptRef',
        'scheduleRef', schedule_ref_value
      )
    );
    claim_value := jsonb_build_object(
      'schemaVersion', 'canonical-professional-gpu-fair-queue-durable-claim-v1',
      'source', 'canonical_postgres_professional_gpu_fair_queue_owner',
      'queueId', candidate.queue_id,
      'runtimeRegion', candidate.runtime_region,
      'queueEntry', candidate.entry_json,
      'scheduleRef', schedule_ref_value,
      'claimId', claim_id_value,
      'claimedAt', p_request->>'claimedAt',
      'dispatchLeaseExpiresAt', public.reeditpro_iso_timestamp(lease_expires_at),
      'externalDispatchOutcome', 'not_started',
      'cloudGpuDispatchStarted', false,
      'customerCreditsMutated', false,
      'automaticRetryAllowed', false
    );
    claim_hash_value := public.reeditpro_sha256_json(claim_value);
    claim_value := claim_value || jsonb_build_object('claimHash', claim_hash_value);
    update public.professional_gpu_fair_queue_entries
    set status = 'claimed', schedule_ref = schedule_ref_value,
      claim_id = claim_id_value, claim_json = claim_value,
      claim_hash = claim_hash_value,
      claimed_at = (p_request->>'claimedAt')::timestamptz,
      dispatch_lease_expires_at = lease_expires_at,
      updated_at = committed_at
    where queue_id = candidate.queue_id
      and runtime_region = candidate.runtime_region
      and queue_entry_id = candidate.queue_entry_id;
    claimed_values := claimed_values || jsonb_build_array(claim_value);
    selected_workspaces := array_append(
      selected_workspaces, candidate.workspace_id
    );
    route_available := (available_by_route->>candidate.route_id)::integer - 1;
    available_by_route := jsonb_set(
      available_by_route, array[candidate.route_id], to_jsonb(route_available)
    );
    selected_count := selected_count + 1;
  end loop;
  update public.professional_gpu_fair_queue_controls
  set revision = revision + 1, updated_at = committed_at
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  returning revision into revision_value;
  return public.weeditpro_gpu_queue_commit(
    'claim', p_request, public.weeditpro_gpu_queue_result(
      'claim', p_request,
      case when selected_count > 0 then 'claims_created'
        else 'no_capacity_available' end,
      null, claimed_values, null, 0, 0, revision_value, committed_at
    )
  );
end;
$$;

create or replace function public.weeditpro_mark_professional_gpu_fair_queue_dispatched_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare entry_row public.professional_gpu_fair_queue_entries%rowtype;
declare revision_value bigint;
declare committed_at timestamptz := clock_timestamp();
declare disposition_value text := 'dispatch_recorded';
begin
  if not public.weeditpro_gpu_queue_request_valid(
      p_contract_version, 'mark_dispatched', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'queueEntryId', 'executionAttemptRef',
      'claimRef', 'cloudTaskDispatchReceiptRef', 'dispatchedAt'
    ]) or not public.weeditpro_gpu_queue_ref_valid(
      p_request->'executionAttemptRef'
    ) or not public.weeditpro_gpu_queue_ref_valid(p_request->'claimRef')
    or not public.weeditpro_gpu_queue_ref_valid(
      p_request->'cloudTaskDispatchReceiptRef'
    ) or not public.weeditpro_gpu_queue_safe_id(p_request->>'queueEntryId')
    or not public.weeditpro_gpu_queue_timestamp_valid(p_request->>'dispatchedAt') then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_queue_lock_and_replay(
    'mark_dispatched', p_request
  );
  if replay is not null then return replay; end if;
  committed_at := clock_timestamp();
  select * into strict entry_row
  from public.professional_gpu_fair_queue_entries
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and queue_entry_id = p_request->>'queueEntryId'
  for update;
  if entry_row.entry_json->'executionAttemptRef' <>
      p_request->'executionAttemptRef'
    or p_request->'claimRef' <> jsonb_build_object(
      'id', entry_row.claim_id, 'version', 1,
      'contentHash', 'sha256:' || entry_row.claim_hash
    ) then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_CLAIM_CHANGED';
  end if;
  if entry_row.status = 'dispatched' then
    if entry_row.cloud_task_dispatch_receipt_ref <>
      p_request->'cloudTaskDispatchReceiptRef'
      or entry_row.dispatched_at <> (p_request->>'dispatchedAt')::timestamptz then
      raise exception using errcode = '23505', message = 'GPU_QUEUE_DISPATCH_CONFLICT';
    end if;
    disposition_value := 'dispatch_replay';
  elsif entry_row.status <> 'claimed'
    or (p_request->>'dispatchedAt')::timestamptz < entry_row.claimed_at
    or (p_request->>'dispatchedAt')::timestamptz >
      entry_row.dispatch_lease_expires_at then
    raise exception using errcode = '55000', message = 'GPU_QUEUE_DISPATCH_NOT_ADMISSIBLE';
  else
    update public.professional_gpu_fair_queue_entries
    set status = 'dispatched',
      cloud_task_dispatch_receipt_ref = p_request->'cloudTaskDispatchReceiptRef',
      dispatched_at = (p_request->>'dispatchedAt')::timestamptz,
      updated_at = committed_at
    where queue_id = entry_row.queue_id
      and runtime_region = entry_row.runtime_region
      and queue_entry_id = entry_row.queue_entry_id;
  end if;
  update public.professional_gpu_fair_queue_controls
  set revision = revision + 1, updated_at = committed_at
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  returning revision into revision_value;
  return public.weeditpro_gpu_queue_commit(
    'mark_dispatched', p_request, public.weeditpro_gpu_queue_result(
      'mark_dispatched', p_request, disposition_value,
      jsonb_build_object(
        'id', entry_row.queue_entry_id, 'version', 1,
        'contentHash', 'sha256:' || entry_row.entry_hash
      ), '[]'::jsonb, null, 0, 0, revision_value, committed_at
    )
  );
exception when no_data_found then
  raise exception using errcode = 'P0002', message = 'GPU_QUEUE_ENTRY_NOT_FOUND';
end;
$$;

create or replace function public.weeditpro_finalize_professional_gpu_fair_queue_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare entry_row public.professional_gpu_fair_queue_entries%rowtype;
declare terminal_value jsonb;
declare terminal_hash_value text;
declare revision_value bigint;
declare committed_at timestamptz := clock_timestamp();
declare disposition_value text := 'finalized';
begin
  if not public.weeditpro_gpu_queue_request_valid(
      p_contract_version, 'finalize', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'queueEntryId', 'executionAttemptRef',
      'claimRef', 'terminalEvidenceRef', 'disposition', 'terminalAt'
    ]) or p_request->>'disposition' not in ('completed', 'failed_reconciled')
    or not public.weeditpro_gpu_queue_ref_valid(
      p_request->'executionAttemptRef'
    ) or not public.weeditpro_gpu_queue_ref_valid(p_request->'claimRef')
    or not public.weeditpro_gpu_queue_ref_valid(p_request->'terminalEvidenceRef')
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'queueEntryId')
    or not public.weeditpro_gpu_queue_timestamp_valid(p_request->>'terminalAt') then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_queue_lock_and_replay('finalize', p_request);
  if replay is not null then return replay; end if;
  committed_at := clock_timestamp();
  select * into strict entry_row
  from public.professional_gpu_fair_queue_entries
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and queue_entry_id = p_request->>'queueEntryId'
  for update;
  if entry_row.entry_json->'executionAttemptRef' <>
      p_request->'executionAttemptRef'
    or p_request->'claimRef' <> jsonb_build_object(
      'id', entry_row.claim_id, 'version', 1,
      'contentHash', 'sha256:' || entry_row.claim_hash
    ) then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_CLAIM_CHANGED';
  end if;
  if (p_request->>'terminalAt')::timestamptz < entry_row.claimed_at
    or (entry_row.dispatched_at is not null
      and (p_request->>'terminalAt')::timestamptz < entry_row.dispatched_at) then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_TIME_CHANGED';
  end if;
  terminal_value := jsonb_build_object(
    'schemaVersion', 'canonical-professional-gpu-fair-queue-durable-terminal-v1',
    'source', 'canonical_postgres_professional_gpu_fair_queue_owner',
    'queueId', entry_row.queue_id,
    'runtimeRegion', entry_row.runtime_region,
    'queueEntryRef', jsonb_build_object(
      'id', entry_row.queue_entry_id, 'version', 1,
      'contentHash', 'sha256:' || entry_row.entry_hash
    ),
    'executionAttemptRef', entry_row.entry_json->'executionAttemptRef',
    'claimRef', p_request->'claimRef',
    'terminalEvidenceRef', p_request->'terminalEvidenceRef',
    'disposition', p_request->>'disposition',
    'terminalAt', p_request->>'terminalAt',
    'automaticRetryStarted', false,
    'customerCreditsMutated', false,
    'qaApproved', false,
    'publicDeliveryAuthorized', false,
    'productionAuthorityGranted', false
  );
  terminal_hash_value := public.reeditpro_sha256_json(terminal_value);
  terminal_value := terminal_value || jsonb_build_object(
    'terminalHash', terminal_hash_value
  );
  if entry_row.status in ('completed', 'failed_reconciled') then
    if entry_row.terminal_hash <> terminal_hash_value then
      raise exception using errcode = '23505', message = 'GPU_QUEUE_TERMINAL_CONFLICT';
    end if;
    disposition_value := 'terminal_replay';
    terminal_value := entry_row.terminal_json;
  elsif entry_row.status not in ('claimed', 'dispatched', 'reconciliation_required')
    or (entry_row.status = 'claimed' and p_request->>'disposition' = 'completed') then
    raise exception using errcode = '55000', message = 'GPU_QUEUE_TERMINAL_NOT_ADMISSIBLE';
  else
    update public.professional_gpu_fair_queue_entries
    set status = p_request->>'disposition', terminal_json = terminal_value,
      terminal_hash = terminal_hash_value,
      terminal_at = (p_request->>'terminalAt')::timestamptz,
      updated_at = committed_at
    where queue_id = entry_row.queue_id
      and runtime_region = entry_row.runtime_region
      and queue_entry_id = entry_row.queue_entry_id;
  end if;
  update public.professional_gpu_fair_queue_controls
  set revision = revision + 1, updated_at = committed_at
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  returning revision into revision_value;
  return public.weeditpro_gpu_queue_commit(
    'finalize', p_request, public.weeditpro_gpu_queue_result(
      'finalize', p_request, disposition_value,
      jsonb_build_object(
        'id', entry_row.queue_entry_id, 'version', 1,
        'contentHash', 'sha256:' || entry_row.entry_hash
      ), '[]'::jsonb, terminal_value, 0, 0, revision_value, committed_at
    )
  );
exception when no_data_found then
  raise exception using errcode = 'P0002', message = 'GPU_QUEUE_ENTRY_NOT_FOUND';
end;
$$;

create or replace function public.weeditpro_recover_professional_gpu_fair_queue_leases_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare recovered_count integer := 0;
declare revision_value bigint;
declare committed_at timestamptz := clock_timestamp();
begin
  if not public.weeditpro_gpu_queue_request_valid(
      p_contract_version, 'recover_expired_dispatch_leases', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'observedAt', 'maximumEntries'
    ]) or coalesce(p_request->>'maximumEntries', '') !~ '^[0-9]+$'
    or (p_request->>'maximumEntries')::integer not between 1 and 192
    or not public.weeditpro_gpu_queue_timestamp_valid(p_request->>'observedAt') then
    raise exception using errcode = '22023', message = 'GPU_QUEUE_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_queue_lock_and_replay(
    'recover_expired_dispatch_leases', p_request
  );
  if replay is not null then return replay; end if;
  committed_at := clock_timestamp();
  with expired as (
    select queue_id, runtime_region, queue_entry_id
    from public.professional_gpu_fair_queue_entries
    where queue_id = p_request->>'queueId'
      and runtime_region = p_request->>'runtimeRegion'
      and status = 'claimed'
      and cloud_task_dispatch_receipt_ref is null
      and dispatch_lease_expires_at <= (p_request->>'observedAt')::timestamptz
    order by dispatch_lease_expires_at, queue_entry_id
    limit (p_request->>'maximumEntries')::integer
    for update skip locked
  )
  update public.professional_gpu_fair_queue_entries entry
  set status = 'queued', schedule_ref = null, claim_id = null,
    claim_json = null, claim_hash = null, claimed_at = null,
    dispatch_lease_expires_at = null, updated_at = committed_at
  from expired
  where entry.queue_id = expired.queue_id
    and entry.runtime_region = expired.runtime_region
    and entry.queue_entry_id = expired.queue_entry_id;
  get diagnostics recovered_count = row_count;
  update public.professional_gpu_fair_queue_controls
  set revision = revision + 1, updated_at = committed_at
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  returning revision into revision_value;
  return public.weeditpro_gpu_queue_commit(
    'recover_expired_dispatch_leases', p_request,
    public.weeditpro_gpu_queue_result(
      'recover_expired_dispatch_leases', p_request, 'recovery_completed',
      null, '[]'::jsonb, null, recovered_count, 0,
      revision_value, committed_at
    )
  );
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'weeditpro_enqueue_professional_gpu_fair_queue_v1(text,jsonb)',
    'weeditpro_claim_professional_gpu_fair_queue_v1(text,jsonb)',
    'weeditpro_mark_professional_gpu_fair_queue_dispatched_v1(text,jsonb)',
    'weeditpro_finalize_professional_gpu_fair_queue_v1(text,jsonb)',
    'weeditpro_recover_professional_gpu_fair_queue_leases_v1(text,jsonb)'
  ] loop
    execute format(
      'revoke all on function public.%s from public, anon, authenticated, service_role',
      signature
    );
    execute format('grant execute on function public.%s to service_role', signature);
  end loop;
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'weeditpro_gpu_queue_exact_keys(jsonb,text[])',
    'weeditpro_gpu_queue_ref_valid(jsonb)',
    'weeditpro_gpu_queue_safe_id(text)',
    'weeditpro_gpu_queue_timestamp_valid(text)',
    'weeditpro_gpu_queue_entry_valid(jsonb)',
    'weeditpro_gpu_queue_request_valid(text,text,jsonb)',
    'weeditpro_gpu_queue_capacity_valid(jsonb)',
    'weeditpro_gpu_queue_counts(text,text)',
    'weeditpro_gpu_queue_result(text,jsonb,text,jsonb,jsonb,jsonb,integer,integer,bigint,timestamptz)',
    'weeditpro_gpu_queue_lock_and_replay(text,jsonb)',
    'weeditpro_gpu_queue_commit(text,jsonb,jsonb)'
  ] loop
    execute format(
      'revoke all on function public.%s from public, anon, authenticated, service_role',
      signature
    );
  end loop;
end;
$$;
