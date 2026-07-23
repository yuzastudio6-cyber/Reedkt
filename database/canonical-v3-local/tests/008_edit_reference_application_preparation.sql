\set ON_ERROR_STOP on
\echo 'canonical-v3-local: retired synthetic application preparation fails closed'

begin;
\ir _fixture.sql

create temporary table application_preparation_requests (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select on application_preparation_requests to authenticated, service_role;

with intent as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-application-preparation-intent-v1',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'editReferenceId', 'aaaaaaaa-3000-4000-8000-000000000001',
    'studySessionId', 'aaaaaaaa-4000-4000-8000-000000000001',
    'dnaVersionId', 'aaaaaaaa-5000-4000-8000-000000000001',
    'expectedReferenceRevision', 1,
    'expectedDNAContentDigestSha256', repeat('5', 64),
    'applicationSource', 'setup_selector',
    'targetUnderstandingPackageId', 'aaaaaaaa-6500-4000-8000-000000000001',
    'targetUnderstandingPackageDigestSha256', repeat('d', 64),
    'targetUnderstandingSourceStorageObjectRecordId',
      'aaaaaaaa-6100-4000-8000-000000000001',
    'targetUnderstandingSourceMediaAssetId',
      'aaaaaaaa-6200-4000-8000-000000000001',
    'targetUnderstandingEditBriefDigestSha256', repeat('c', 64)
  ) as value
), preparation as (
  select intent.value,
    public.reeditpro_sha256_json(jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'intent', intent.value
    )) as digest
  from intent
), request_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-application-preparation-rpc-request-v2',
    'rpcName', 'prepare_edit_reference_application_v2',
    'actorUserId', '11111111-1111-4111-8111-111111111111',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'intent', preparation.value,
    'idempotencyKeyHashSha256', repeat('3', 64),
    'preparationRequestDigestSha256', preparation.digest,
    -- Only the ID is required to reach the raw-target authority re-read. The
    -- retired synthetic package must be rejected before this record could be
    -- interpreted or persisted.
    'preparedApplication', jsonb_build_object(
      'id', 'aaaaaaaa-7100-4000-8000-000000000001'
    ),
    'requestedAt', public.reeditpro_iso_timestamp(clock_timestamp()),
    'authenticatedScopeReboundServerSide', true,
    'browserApplicationRecordAccepted', false,
    'applicationLifecycleMutationAllowed', false,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false,
    'providerOrWorkerExecutionStarted', false
  ) as value
  from preparation
)
insert into application_preparation_requests (name, payload)
select 'retired_synthetic_target', value || jsonb_build_object(
  'rpcRequestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
begin
  begin
    perform * from public.prepare_edit_reference_application_v1(
      'edit-reference-production-persistence-contract-v6',
      (select payload from application_preparation_requests
       where name = 'retired_synthetic_target')
    );
    raise exception 'RETIRED_PREPARATION_V1_STILL_EXECUTABLE';
  exception when insufficient_privilege then null;
  end;

  begin
    perform * from public.prepare_edit_reference_application_v2(
      'edit-reference-production-persistence-contract-v6',
      (select payload from application_preparation_requests
       where name = 'retired_synthetic_target')
    );
    raise exception 'SYNTHETIC_TARGET_ACCEPTED_BY_PREPARATION_V2';
  exception when serialization_failure then null;
  end;
end;
$$;

reset role;

do $$
begin
  if has_function_privilege(
    'service_role',
    'public.reeditpro_edit_reference_idempotency_fence(uuid,uuid,text,text)',
    'EXECUTE'
  ) or position(
    'prepare_edit_reference_application_v2'', idempotency_key_digest' in
    pg_get_functiondef(
      'public.prepare_edit_reference_application_v2(text,jsonb)'::regprocedure
    )
  ) = 0 then
    raise exception 'EDIT_REFERENCE_PREPARATION_IDEMPOTENCY_CONCURRENCY_FENCE_INVALID';
  end if;
  if (select count(*) from public.preference_application_preparation_events) <> 0
    or exists (
      select 1 from public.preference_applications
      where id = 'aaaaaaaa-7100-4000-8000-000000000001'
    )
    or exists (
      select 1 from public.edit_reference_idempotency_receipts receipt
      where receipt.operation = 'prepare_edit_reference_application_v2'
    )
  then
    raise exception 'FAILED_PREPARATION_LEFT_DURABLE_MUTATION';
  end if;
  if not exists (
    select 1 from public.exact_edit_preference_states state
    where state.workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and state.project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and state.edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
      and state.record_revision = 0
      and state.preference_revision = 0
      and state.planning_input_revision = 0
      and state.current_application_state = 'not_selected'
      and state.current_application_id is null
  ) then
    raise exception 'FAILED_PREPARATION_MUTATED_EXACT_EDIT';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
begin
  begin
    perform * from public.prepare_edit_reference_application_v2(
      'edit-reference-production-persistence-contract-v6',
      (select payload from application_preparation_requests
       where name = 'retired_synthetic_target')
    );
    raise exception 'PREPARATION_V2_BROWSER_EXECUTION_ALLOWED';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.preference_application_preparation_events) <> 0 then
    raise exception 'FAILED_PREPARATION_EVENT_VISIBLE_OR_PERSISTED';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

do $$
begin
  if (select count(*) from public.preference_application_preparation_events) <> 0
    or (select count(*) from public.edit_reference_target_understanding_packages) <> 1
  then
    raise exception 'PREPARATION_V2_CROSS_TENANT_SCOPE_INVALID';
  end if;
end;
$$;

rollback;
