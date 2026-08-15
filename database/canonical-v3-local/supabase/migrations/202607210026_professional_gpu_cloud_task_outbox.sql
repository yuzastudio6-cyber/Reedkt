-- WeEditPro canonical durable Cloud Tasks outbox for professional GPU work.
-- The outbox records the external create boundary before any Cloud Tasks API
-- call. It grants no GPU, credit, QA, delivery, or production authority.

create table public.professional_gpu_cloud_task_outbox (
  queue_id text not null,
  runtime_region text not null,
  claim_id text not null,
  queue_entry_id text not null,
  claim_hash text not null check (claim_hash ~ '^[a-f0-9]{64}$'),
  task_name text not null,
  task_spec_hash text not null check (task_spec_hash ~ '^[a-f0-9]{64}$'),
  status text not null check (status in (
    'create_leased', 'created', 'not_created', 'outcome_unknown'
  )),
  create_lease_id text not null,
  create_lease_expires_at timestamptz not null,
  record_json jsonb not null,
  record_hash text not null check (record_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (queue_id, runtime_region, claim_id),
  unique (task_name),
  foreign key (queue_id, runtime_region, queue_entry_id)
    references public.professional_gpu_fair_queue_entries(
      queue_id, runtime_region, queue_entry_id
    ) on delete restrict,
  check (jsonb_typeof(record_json) = 'object'),
  check (updated_at >= created_at),
  check (create_lease_expires_at > created_at)
);

create index professional_gpu_cloud_task_outbox_status
  on public.professional_gpu_cloud_task_outbox(
    queue_id, runtime_region, status, create_lease_expires_at, claim_id
  );

create table public.professional_gpu_cloud_task_outbox_receipts (
  queue_id text not null,
  runtime_region text not null,
  request_id text not null,
  operation text not null check (operation in (
    'begin_create', 'record_create_outcome', 'reread'
  )),
  request_digest_sha256 text not null check (
    request_digest_sha256 ~ '^[a-f0-9]{64}$'
  ),
  response_json jsonb not null,
  created_at timestamptz not null,
  primary key (queue_id, runtime_region, request_id),
  check (jsonb_typeof(response_json) = 'object')
);

alter table public.professional_gpu_cloud_task_outbox enable row level security;
alter table public.professional_gpu_cloud_task_outbox force row level security;
alter table public.professional_gpu_cloud_task_outbox_receipts
  enable row level security;
alter table public.professional_gpu_cloud_task_outbox_receipts
  force row level security;
revoke all on table public.professional_gpu_cloud_task_outbox
  from public, anon, authenticated, service_role;
revoke all on table public.professional_gpu_cloud_task_outbox_receipts
  from public, anon, authenticated, service_role;

-- A claim whose external create outcome is unknown has not earned a Cloud
-- Task receipt or dispatch timestamp. Keep it active and non-requeueable under
-- reconciliation_required without fabricating either field. Completed and
-- failed terminal rows still require the exact dispatched-task lineage.
alter table public.professional_gpu_fair_queue_entries
  drop constraint professional_gpu_fair_queue_entries_check2;
alter table public.professional_gpu_fair_queue_entries
  add constraint professional_gpu_fair_queue_dispatch_lineage_check check (
    status not in ('dispatched', 'completed', 'failed_reconciled')
    or (
      cloud_task_dispatch_receipt_ref is not null
      and dispatched_at is not null
      and dispatched_at >= claimed_at
      and dispatched_at <= dispatch_lease_expires_at
    )
  );

create or replace function public.weeditpro_gpu_cloud_task_outbox_request_valid(
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
      'canonical-professional-gpu-cloud-task-outbox-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or p_request->>'schemaVersion' <> p_contract_version
    or p_request->>'operation' <> p_operation
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'requestId')
    or coalesce(p_request->>'requestDigestSha256', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'queueId' <>
      'weeditpro-professional-gpu-production-v1'
    or p_request->>'runtimeRegion' <> 'us-central1' then
    return false;
  end if;
  request_without_digest := p_request - 'requestDigestSha256';
  return p_request->>'requestDigestSha256' = public.reeditpro_sha256_json(
    jsonb_build_object(
      'domain', 'canonical_professional_gpu_cloud_task_outbox_request_v1',
      'operation', p_operation,
      'request', request_without_digest
    )
  );
exception when others then
  return false;
end;
$$;

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
begin
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
    or p_value->>'schemaVersion' <>
      'canonical-professional-gpu-cloud-task-spec-v1'
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
    or p_value->>'dispatchDeadline' <> '60s'
    or coalesce(p_value->>'targetUrl', '') !~ (
      '^https://[A-Za-z0-9.-]+[.]run[.]app/internal/v1/' ||
      'professional-gpu-queue/claims/consume$'
    )
    or p_value->>'oidcAudience' <>
      regexp_replace(p_value->>'targetUrl',
        '/internal/v1/professional-gpu-queue/claims/consume$', '')
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
    or p_value->'body'->>'schemaVersion' <>
      'canonical-professional-gpu-cloud-task-body-v1'
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
      'domain', 'canonical_professional_gpu_cloud_task_name_v1',
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

create or replace function public.weeditpro_gpu_cloud_task_result_valid(
  p_value jsonb,
  p_task_spec jsonb
)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare payload jsonb;
declare outcome text;
declare disposition text;
begin
  if not public.weeditpro_gpu_queue_exact_keys(p_value, array[
      'schemaVersion', 'source', 'cloudTaskSpecRef', 'cloudTaskRef',
      'disposition', 'providerOutcome',
      'exactTaskRereadAfterAlreadyExists', 'automaticCreateRetryStarted',
      'automaticNewExecutionAttemptAllowed', 'cloudGpuDispatchStarted',
      'customerCreditsMutated', 'qaApproved', 'publicDeliveryAuthorized',
      'productionAuthorityGranted', 'observedAt', 'resultDigestSha256'
    ])
    or p_value->>'schemaVersion' <>
      'canonical-professional-gpu-cloud-task-dispatch-result-v1'
    or p_value->>'source' <> 'canonical_google_cloud_tasks_dispatch_port'
    or not public.weeditpro_gpu_queue_ref_valid(p_value->'cloudTaskSpecRef')
    or p_value->'cloudTaskSpecRef' <> jsonb_build_object(
      'id', p_task_spec->>'cloudTaskName', 'version', 1,
      'contentHash', 'sha256:' || (p_task_spec->>'specDigestSha256')
    )
    or not public.weeditpro_gpu_queue_timestamp_valid(p_value->>'observedAt')
    or (p_value->>'automaticCreateRetryStarted')::boolean
    or (p_value->>'automaticNewExecutionAttemptAllowed')::boolean
    or (p_value->>'cloudGpuDispatchStarted')::boolean
    or (p_value->>'customerCreditsMutated')::boolean
    or (p_value->>'qaApproved')::boolean
    or (p_value->>'publicDeliveryAuthorized')::boolean
    or (p_value->>'productionAuthorityGranted')::boolean then
    return false;
  end if;
  outcome := p_value->>'providerOutcome';
  disposition := p_value->>'disposition';
  if outcome = 'created' then
    if disposition not in ('task_created', 'existing_task_exactly_reconciled')
      or not public.weeditpro_gpu_queue_ref_valid(p_value->'cloudTaskRef')
      or p_value->'cloudTaskRef'->>'id' <> p_task_spec->>'cloudTaskName'
      or ((disposition = 'existing_task_exactly_reconciled') <>
        (p_value->>'exactTaskRereadAfterAlreadyExists')::boolean) then
      return false;
    end if;
  elsif outcome = 'not_created' then
    if disposition <> 'task_rejected_before_creation'
      or p_value->'cloudTaskRef' <> 'null'::jsonb
      or (p_value->>'exactTaskRereadAfterAlreadyExists')::boolean then
      return false;
    end if;
  elsif outcome = 'unknown' then
    if disposition <>
        'task_create_outcome_unknown_requires_reconciliation'
      or p_value->'cloudTaskRef' <> 'null'::jsonb
      or (p_value->>'exactTaskRereadAfterAlreadyExists')::boolean then
      return false;
    end if;
  else
    return false;
  end if;
  payload := p_value - 'resultDigestSha256';
  return p_value->>'resultDigestSha256' =
    public.reeditpro_sha256_json(payload);
exception when others then
  return false;
end;
$$;

create or replace function public.weeditpro_gpu_cloud_task_outbox_record(
  p_queue_id text,
  p_runtime_region text,
  p_queue_entry_id text,
  p_claim_id text,
  p_claim_hash text,
  p_task_spec jsonb,
  p_status text,
  p_create_lease_id text,
  p_create_lease_expires_at timestamptz,
  p_dispatch_result jsonb,
  p_created_at timestamptz,
  p_updated_at timestamptz
)
returns jsonb
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare payload jsonb;
begin
  payload := jsonb_build_object(
    'schemaVersion', 'canonical-professional-gpu-cloud-task-outbox-record-v1',
    'source', 'canonical_postgres_professional_gpu_cloud_task_outbox_owner',
    'outboxId', 'gpu-task-outbox:' || p_claim_hash,
    'queueId', p_queue_id,
    'runtimeRegion', p_runtime_region,
    'queueEntryId', p_queue_entry_id,
    'claimRef', jsonb_build_object(
      'id', p_claim_id, 'version', 1,
      'contentHash', 'sha256:' || p_claim_hash
    ),
    'cloudTaskSpec', p_task_spec,
    'status', p_status,
    'createLeaseId', p_create_lease_id,
    'createLeaseExpiresAt', public.reeditpro_iso_timestamp(
      p_create_lease_expires_at
    ),
    'dispatchResult', p_dispatch_result,
    'externalCreateOutcome', case p_status
      when 'created' then 'created'
      when 'not_created' then 'not_created'
      when 'outcome_unknown' then 'unknown'
      else 'not_started' end,
    'databaseRecordPersistedBeforeCloudTasksCreate', true,
    'automaticCreateRetryAllowed', false,
    'automaticNewExecutionAttemptAllowed', false,
    'cloudGpuDispatchStarted', false,
    'customerCreditsMutated', false,
    'qaApproved', false,
    'publicDeliveryAuthorized', false,
    'productionAuthorityGranted', false,
    'createdAt', public.reeditpro_iso_timestamp(p_created_at),
    'updatedAt', public.reeditpro_iso_timestamp(p_updated_at)
  );
  return payload || jsonb_build_object(
    'recordHash', public.reeditpro_sha256_json(payload)
  );
end;
$$;

create or replace function public.weeditpro_gpu_cloud_task_outbox_result(
  p_operation text,
  p_request jsonb,
  p_disposition text,
  p_record jsonb,
  p_committed_at timestamptz
)
returns jsonb
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare payload jsonb;
begin
  payload := jsonb_build_object(
    'schemaVersion', 'canonical-professional-gpu-cloud-task-outbox-result-v1',
    'source', 'canonical_postgres_professional_gpu_cloud_task_outbox_owner',
    'operation', p_operation,
    'requestId', p_request->>'requestId',
    'requestDigestSha256', p_request->>'requestDigestSha256',
    'queueId', p_request->>'queueId',
    'runtimeRegion', p_request->>'runtimeRegion',
    'disposition', p_disposition,
    'record', p_record,
    'sharedDurablePostgresTransactionPerformed', true,
    'browserOrFrontendClientAllowed', false,
    'automaticCreateRetryStarted', false,
    'automaticNewExecutionAttemptAllowed', false,
    'cloudGpuDispatchStarted', false,
    'customerCreditsMutated', false,
    'qaApproved', false,
    'publicDeliveryAuthorized', false,
    'productionAuthorityGranted', false,
    'transactionCommittedAt', public.reeditpro_iso_timestamp(p_committed_at)
  );
  return payload || jsonb_build_object(
    'resultDigestSha256', public.reeditpro_sha256_json(payload)
  );
end;
$$;

create or replace function public.weeditpro_gpu_cloud_task_outbox_replay(
  p_operation text,
  p_request jsonb
)
returns jsonb
language plpgsql
volatile
strict
set search_path = pg_catalog, public
as $$
declare receipt public.professional_gpu_cloud_task_outbox_receipts%rowtype;
begin
  perform 1 from public.professional_gpu_fair_queue_controls
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  for update;
  if not found then
    raise exception using errcode = 'P0002',
      message = 'GPU_QUEUE_CONTROL_NOT_FOUND';
  end if;
  select * into receipt
  from public.professional_gpu_cloud_task_outbox_receipts
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and request_id = p_request->>'requestId';
  if found then
    if receipt.operation <> p_operation
      or receipt.request_digest_sha256 <>
        p_request->>'requestDigestSha256' then
      raise exception using errcode = '23505',
        message = 'GPU_TASK_OUTBOX_IDEMPOTENCY_CONFLICT';
    end if;
    return receipt.response_json;
  end if;
  return null;
end;
$$;

create or replace function public.weeditpro_gpu_cloud_task_outbox_commit(
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
  insert into public.professional_gpu_cloud_task_outbox_receipts(
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

create or replace function public.weeditpro_begin_professional_gpu_cloud_task_create_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare queue_entry public.professional_gpu_fair_queue_entries%rowtype;
declare existing public.professional_gpu_cloud_task_outbox%rowtype;
declare task_spec jsonb;
declare lease_id text;
declare requested_at timestamptz;
declare lease_expires_at timestamptz;
declare created_at timestamptz;
declare record_value jsonb;
declare disposition_value text := 'create_admitted';
begin
  if not public.weeditpro_gpu_cloud_task_outbox_request_valid(
      p_contract_version, 'begin_create', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'queueEntryId', 'claimRef',
      'cloudTaskSpec', 'dispatcherInstanceId', 'requestedAt',
      'leaseDurationSeconds'
    ])
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'queueEntryId')
    or not public.weeditpro_gpu_queue_ref_valid(p_request->'claimRef')
    or not public.weeditpro_gpu_cloud_task_spec_valid(
      p_request->'cloudTaskSpec'
    )
    or not public.weeditpro_gpu_queue_safe_id(
      p_request->>'dispatcherInstanceId'
    )
    or not public.weeditpro_gpu_queue_timestamp_valid(p_request->>'requestedAt')
    or coalesce(p_request->>'leaseDurationSeconds', '') !~ '^[0-9]+$'
    or (p_request->>'leaseDurationSeconds')::integer not between 30 and 300 then
    raise exception using errcode = '22023',
      message = 'GPU_TASK_OUTBOX_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_cloud_task_outbox_replay(
    'begin_create', p_request
  );
  if replay is not null then return replay; end if;
  requested_at := (p_request->>'requestedAt')::timestamptz;
  task_spec := p_request->'cloudTaskSpec';
  select * into strict queue_entry
  from public.professional_gpu_fair_queue_entries
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and queue_entry_id = p_request->>'queueEntryId'
  for update;
  if queue_entry.status <> 'claimed'
    or p_request->'claimRef' <> jsonb_build_object(
      'id', queue_entry.claim_id, 'version', 1,
      'contentHash', 'sha256:' || queue_entry.claim_hash
    )
    or task_spec->'claimRef' <> p_request->'claimRef'
    or task_spec->'body'->>'queueEntryId' <> queue_entry.queue_entry_id
    or task_spec->'body'->'executionAttemptRef' <>
      queue_entry.entry_json->'executionAttemptRef'
    or requested_at < queue_entry.claimed_at
    or requested_at > queue_entry.dispatch_lease_expires_at then
    raise exception using errcode = '55000',
      message = 'GPU_TASK_OUTBOX_CREATE_NOT_ADMISSIBLE';
  end if;
  select * into existing
  from public.professional_gpu_cloud_task_outbox
  where queue_id = queue_entry.queue_id
    and runtime_region = queue_entry.runtime_region
    and claim_id = queue_entry.claim_id
  for update;
  if found then
    if existing.task_spec_hash <> task_spec->>'specDigestSha256'
      or existing.task_name <> task_spec->>'cloudTaskName'
      or existing.claim_hash <> queue_entry.claim_hash then
      raise exception using errcode = '23505',
        message = 'GPU_TASK_OUTBOX_SPEC_CONFLICT';
    end if;
    record_value := existing.record_json;
    disposition_value := case existing.status
      when 'created' then 'created_replay'
      when 'not_created' then 'not_created_replay'
      else 'reconciliation_required' end;
  else
    lease_id := 'gpu-task-create-lease:' || public.reeditpro_sha256_json(
      jsonb_build_object(
        'claimRef', p_request->'claimRef',
        'taskSpecDigestSha256', task_spec->>'specDigestSha256',
        'dispatcherInstanceId', p_request->>'dispatcherInstanceId',
        'requestDigestSha256', p_request->>'requestDigestSha256'
      )
    );
    lease_expires_at := requested_at + make_interval(
      secs => (p_request->>'leaseDurationSeconds')::integer
    );
    created_at := clock_timestamp();
    record_value := public.weeditpro_gpu_cloud_task_outbox_record(
      queue_entry.queue_id, queue_entry.runtime_region,
      queue_entry.queue_entry_id, queue_entry.claim_id,
      queue_entry.claim_hash, task_spec, 'create_leased', lease_id,
      lease_expires_at, 'null'::jsonb, created_at, created_at
    );
    insert into public.professional_gpu_cloud_task_outbox(
      queue_id, runtime_region, claim_id, queue_entry_id, claim_hash,
      task_name, task_spec_hash, status, create_lease_id,
      create_lease_expires_at, record_json, record_hash,
      created_at, updated_at
    ) values (
      queue_entry.queue_id, queue_entry.runtime_region, queue_entry.claim_id,
      queue_entry.queue_entry_id, queue_entry.claim_hash,
      task_spec->>'cloudTaskName', task_spec->>'specDigestSha256',
      'create_leased', lease_id, lease_expires_at, record_value,
      record_value->>'recordHash', created_at, created_at
    );
  end if;
  return public.weeditpro_gpu_cloud_task_outbox_commit(
    'begin_create', p_request,
    public.weeditpro_gpu_cloud_task_outbox_result(
      'begin_create', p_request, disposition_value, record_value,
      clock_timestamp()
    )
  );
exception when no_data_found then
  raise exception using errcode = 'P0002',
    message = 'GPU_QUEUE_ENTRY_NOT_FOUND';
end;
$$;

create or replace function public.weeditpro_record_professional_gpu_cloud_task_outcome_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare replay jsonb;
declare existing public.professional_gpu_cloud_task_outbox%rowtype;
declare dispatch_result jsonb;
declare status_value text;
declare record_value jsonb;
declare committed_at timestamptz := clock_timestamp();
declare disposition_value text := 'outcome_recorded';
begin
  if not public.weeditpro_gpu_cloud_task_outbox_request_valid(
      p_contract_version, 'record_create_outcome', p_request
    ) or not public.weeditpro_gpu_queue_exact_keys(p_request, array[
      'schemaVersion', 'requestId', 'requestDigestSha256', 'queueId',
      'runtimeRegion', 'operation', 'queueEntryId', 'claimRef',
      'createLeaseId', 'cloudTaskSpecRef', 'dispatchResult', 'observedAt'
    ])
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'queueEntryId')
    or not public.weeditpro_gpu_queue_ref_valid(p_request->'claimRef')
    or not public.weeditpro_gpu_queue_safe_id(p_request->>'createLeaseId')
    or not public.weeditpro_gpu_queue_ref_valid(p_request->'cloudTaskSpecRef')
    or not public.weeditpro_gpu_queue_timestamp_valid(p_request->>'observedAt') then
    raise exception using errcode = '22023',
      message = 'GPU_TASK_OUTBOX_REQUEST_INVALID';
  end if;
  replay := public.weeditpro_gpu_cloud_task_outbox_replay(
    'record_create_outcome', p_request
  );
  if replay is not null then return replay; end if;
  select * into strict existing
  from public.professional_gpu_cloud_task_outbox
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
    and claim_id = p_request->'claimRef'->>'id'
  for update;
  dispatch_result := p_request->'dispatchResult';
  if existing.queue_entry_id <> p_request->>'queueEntryId'
    or existing.claim_hash <>
      substr(p_request->'claimRef'->>'contentHash', 8)
    or existing.create_lease_id <> p_request->>'createLeaseId'
    or p_request->'cloudTaskSpecRef' <> jsonb_build_object(
      'id', existing.record_json->'cloudTaskSpec'->>'cloudTaskName',
      'version', 1,
      'contentHash', 'sha256:' || existing.task_spec_hash
    )
    or not public.weeditpro_gpu_cloud_task_result_valid(
      dispatch_result, existing.record_json->'cloudTaskSpec'
    ) then
    raise exception using errcode = '22023',
      message = 'GPU_TASK_OUTBOX_OUTCOME_CHANGED';
  end if;
  status_value := case dispatch_result->>'providerOutcome'
    when 'created' then 'created'
    when 'not_created' then 'not_created'
    else 'outcome_unknown' end;
  if existing.status <> 'create_leased' then
    if existing.status <> status_value
      or existing.record_json->'dispatchResult' <> dispatch_result then
      raise exception using errcode = '23505',
        message = 'GPU_TASK_OUTBOX_OUTCOME_CONFLICT';
    end if;
    disposition_value := 'outcome_replay';
    record_value := existing.record_json;
  else
    committed_at := clock_timestamp();
    record_value := public.weeditpro_gpu_cloud_task_outbox_record(
      existing.queue_id, existing.runtime_region, existing.queue_entry_id,
      existing.claim_id, existing.claim_hash,
      existing.record_json->'cloudTaskSpec', status_value,
      existing.create_lease_id, existing.create_lease_expires_at,
      dispatch_result, existing.created_at, committed_at
    );
    update public.professional_gpu_cloud_task_outbox
    set status = status_value, record_json = record_value,
      record_hash = record_value->>'recordHash', updated_at = committed_at
    where queue_id = existing.queue_id
      and runtime_region = existing.runtime_region
      and claim_id = existing.claim_id;
  end if;
  return public.weeditpro_gpu_cloud_task_outbox_commit(
    'record_create_outcome', p_request,
    public.weeditpro_gpu_cloud_task_outbox_result(
      'record_create_outcome', p_request, disposition_value,
      record_value, committed_at
    )
  );
exception when no_data_found then
  raise exception using errcode = 'P0002',
    message = 'GPU_TASK_OUTBOX_NOT_FOUND';
end;
$$;

-- Harden the existing recovery operation. A claim is requeued only when no
-- external task creation began, or when Cloud Tasks returned a known
-- pre-creation rejection. Every uncertain/created outcome requires exact
-- reconciliation and can never create a second execution attempt.
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
declare reconciliation_count integer := 0;
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
    select entry.queue_id, entry.runtime_region, entry.queue_entry_id,
      outbox.status as outbox_status
    from public.professional_gpu_fair_queue_entries entry
    left join public.professional_gpu_cloud_task_outbox outbox
      on outbox.queue_id = entry.queue_id
      and outbox.runtime_region = entry.runtime_region
      and outbox.claim_id = entry.claim_id
    where entry.queue_id = p_request->>'queueId'
      and entry.runtime_region = p_request->>'runtimeRegion'
      and entry.status = 'claimed'
      and entry.cloud_task_dispatch_receipt_ref is null
      and entry.dispatch_lease_expires_at <=
        (p_request->>'observedAt')::timestamptz
    order by entry.dispatch_lease_expires_at, entry.queue_entry_id
    limit (p_request->>'maximumEntries')::integer
    for update of entry skip locked
  ), requeue as (
    update public.professional_gpu_fair_queue_entries entry
    set status = 'queued', schedule_ref = null, claim_id = null,
      claim_json = null, claim_hash = null, claimed_at = null,
      dispatch_lease_expires_at = null, updated_at = committed_at
    from expired
    where entry.queue_id = expired.queue_id
      and entry.runtime_region = expired.runtime_region
      and entry.queue_entry_id = expired.queue_entry_id
      and (expired.outbox_status is null
        or expired.outbox_status = 'not_created')
    returning 1
  ), reconcile as (
    update public.professional_gpu_fair_queue_entries entry
    set status = 'reconciliation_required', updated_at = committed_at
    from expired
    where entry.queue_id = expired.queue_id
      and entry.runtime_region = expired.runtime_region
      and entry.queue_entry_id = expired.queue_entry_id
      and expired.outbox_status in (
        'create_leased', 'created', 'outcome_unknown'
      )
    returning 1
  )
  select
    (select count(*) from requeue),
    (select count(*) from reconcile)
  into recovered_count, reconciliation_count;
  update public.professional_gpu_fair_queue_controls
  set revision = revision + 1, updated_at = committed_at
  where queue_id = p_request->>'queueId'
    and runtime_region = p_request->>'runtimeRegion'
  returning revision into revision_value;
  return public.weeditpro_gpu_queue_commit(
    'recover_expired_dispatch_leases', p_request,
    public.weeditpro_gpu_queue_result(
      'recover_expired_dispatch_leases', p_request, 'recovery_completed',
      null, '[]'::jsonb, null, recovered_count, reconciliation_count,
      revision_value, committed_at
    )
  );
end;
$$;

-- Production queue dispatch marking must be backed by an exact durable outbox
-- result. Local legacy proof queues remain readable under the v1 function.
create or replace function public.weeditpro_gpu_cloud_task_dispatch_admissible(
  p_queue_id text,
  p_runtime_region text,
  p_claim_id text,
  p_receipt_ref jsonb
)
returns boolean
language plpgsql
stable
strict
set search_path = pg_catalog, public
as $$
declare outbox public.professional_gpu_cloud_task_outbox%rowtype;
begin
  select * into outbox
  from public.professional_gpu_cloud_task_outbox
  where queue_id = p_queue_id and runtime_region = p_runtime_region
    and claim_id = p_claim_id;
  if not found then
    return p_queue_id <> 'weeditpro-professional-gpu-production-v1';
  end if;
  return outbox.status = 'created'
    and outbox.record_json->'dispatchResult'->'cloudTaskRef' = p_receipt_ref;
end;
$$;

-- Reinstall the mark-dispatched function with the additional outbox gate.
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
    )
    or not public.weeditpro_gpu_cloud_task_dispatch_admissible(
      entry_row.queue_id, entry_row.runtime_region, entry_row.claim_id,
      p_request->'cloudTaskDispatchReceiptRef'
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

do $$
declare signature text;
begin
  foreach signature in array array[
    'weeditpro_begin_professional_gpu_cloud_task_create_v1(text,jsonb)',
    'weeditpro_record_professional_gpu_cloud_task_outcome_v1(text,jsonb)'
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
    'weeditpro_gpu_cloud_task_outbox_request_valid(text,text,jsonb)',
    'weeditpro_gpu_cloud_task_spec_valid(jsonb)',
    'weeditpro_gpu_cloud_task_result_valid(jsonb,jsonb)',
    'weeditpro_gpu_cloud_task_outbox_record(text,text,text,text,text,jsonb,text,text,timestamptz,jsonb,timestamptz,timestamptz)',
    'weeditpro_gpu_cloud_task_outbox_result(text,jsonb,text,jsonb,timestamptz)',
    'weeditpro_gpu_cloud_task_outbox_replay(text,jsonb)',
    'weeditpro_gpu_cloud_task_outbox_commit(text,jsonb,jsonb)',
    'weeditpro_gpu_cloud_task_dispatch_admissible(text,text,text,jsonb)'
  ] loop
    execute format(
      'revoke all on function public.%s from public, anon, authenticated, service_role',
      signature
    );
  end loop;
end;
$$;
