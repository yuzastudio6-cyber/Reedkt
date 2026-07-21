\set ON_ERROR_STOP on
\echo 'canonical-v3-local: server-owned Edit Reference application preparation, replay, and RLS'

begin;
\ir _fixture.sql

create temporary table application_preparation_requests (
  name text primary key,
  payload jsonb not null
) on commit drop;
create temporary table application_preparation_results (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select on application_preparation_requests to authenticated, service_role;
grant select on application_preparation_results to authenticated, service_role;
grant insert on application_preparation_results to service_role;

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
    'schemaVersion', 'edit-reference-application-preparation-rpc-request-v1',
    'rpcName', 'prepare_edit_reference_application_v1',
    'actorUserId', '11111111-1111-4111-8111-111111111111',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'intent', preparation.value,
    'idempotencyKeyHashSha256', repeat('3', 64),
    'preparationRequestDigestSha256', preparation.digest,
    'requestedAt', '2026-07-21T18:00:00.000Z',
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
select 'canonical', value || jsonb_build_object(
  'rpcRequestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

with changed_intent as (
  select (payload->'intent') || jsonb_build_object('applicationSource', 'chat_tag') as value
  from application_preparation_requests where name = 'canonical'
), preparation as (
  select changed_intent.value,
    public.reeditpro_sha256_json(jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'intent', changed_intent.value
    )) as digest
  from changed_intent
), request_without_digest as (
  select (canonical.payload - 'intent' - 'preparationRequestDigestSha256'
      - 'requestedAt' - 'rpcRequestDigestSha256')
    || jsonb_build_object(
      'intent', preparation.value,
      'preparationRequestDigestSha256', preparation.digest,
      'requestedAt', '2026-07-21T18:00:01.000Z'
    ) as value
  from application_preparation_requests canonical cross join preparation
  where canonical.name = 'canonical'
)
insert into application_preparation_requests (name, payload)
select 'idempotency_conflict', value || jsonb_build_object(
  'rpcRequestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

with cross_intent as (
  select payload->'intent' as value
  from application_preparation_requests where name = 'canonical'
), preparation as (
  select cross_intent.value,
    public.reeditpro_sha256_json(jsonb_build_object(
      'actorUserId', '22222222-2222-4222-8222-222222222222',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'intent', cross_intent.value
    )) as digest
  from cross_intent
), request_without_digest as (
  select (payload - 'actorUserId' - 'idempotencyKeyHashSha256'
      - 'preparationRequestDigestSha256' - 'requestedAt' - 'rpcRequestDigestSha256')
    || jsonb_build_object(
      'actorUserId', '22222222-2222-4222-8222-222222222222',
      'idempotencyKeyHashSha256', repeat('4', 64),
      'preparationRequestDigestSha256', preparation.digest,
      'requestedAt', '2026-07-21T18:00:02.000Z'
    ) as value
  from application_preparation_requests cross join preparation
  where name = 'canonical'
)
insert into application_preparation_requests (name, payload)
select 'cross_workspace', value || jsonb_build_object(
  'rpcRequestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

set local role service_role;
select set_config(
  'request.jwt.claims',
  '{"role":"service_role"}',
  true
);

do $$
declare
  prepared jsonb;
  replayed jsonb;
begin
  select * into prepared
  from public.prepare_edit_reference_application_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from application_preparation_requests where name = 'canonical')
  );
  if prepared->>'sourceAuthority' <> 'canonical_preference_application_preparation'
    or prepared->>'runtimeSource' <> 'controlled_local'
    or prepared->'applicationAuthority'->>'sourceAuthority'
      <> 'canonical_preference_application_repository'
    or prepared->'applicationAuthority'->>'runtimeSource' <> 'verified_live'
    or prepared->'applicationAuthority'->>'workspaceId'
      <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    or prepared->'applicationAuthority'->>'projectId'
      <> 'aaaaaaaa-1000-4000-8000-000000000001'
    or prepared->'applicationAuthority'->>'editSessionId'
      <> 'aaaaaaaa-2000-4000-8000-000000000001'
    or prepared->'applicationAuthority'->>'editReferenceId'
      <> 'aaaaaaaa-3000-4000-8000-000000000001'
    or prepared->'applicationAuthority'->>'connectionState' <> 'not_connected'
    or (prepared->>'applicationConnectedToEdit')::boolean is not false
    or (prepared->>'planOrEstimateInvalidated')::boolean is not false
    or (prepared->>'approvedSnapshotMutated')::boolean is not false
    or (prepared->>'customerPriceCalculated')::boolean is not false
    or (prepared->>'customerCreditsMutated')::boolean is not false
    or (prepared->>'serviceFeeIncluded')::boolean is not false
    or (prepared->>'providerOrWorkerExecutionStarted')::boolean is not false
    or prepared->>'receiptDigestSha256'
      <> public.reeditpro_sha256_json(prepared - 'receiptDigestSha256') then
    raise exception 'EDIT_REFERENCE_PREPARATION_RECEIPT_INVALID_%', prepared;
  end if;
  insert into application_preparation_results values ('canonical', prepared);

  select * into replayed
  from public.prepare_edit_reference_application_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from application_preparation_requests where name = 'canonical')
  );
  if replayed <> prepared then
    raise exception 'EDIT_REFERENCE_PREPARATION_REPLAY_CHANGED';
  end if;

  begin
    perform * from public.prepare_edit_reference_application_v1(
      'edit-reference-production-persistence-contract-v6',
      (select payload from application_preparation_requests where name = 'idempotency_conflict')
    );
    raise exception 'EDIT_REFERENCE_PREPARATION_CONFLICT_NOT_REJECTED';
  exception when unique_violation then null;
  end;

  begin
    perform * from public.prepare_edit_reference_application_v1(
      'edit-reference-production-persistence-contract-v6',
      (select payload from application_preparation_requests where name = 'cross_workspace')
    );
    raise exception 'EDIT_REFERENCE_PREPARATION_CROSS_WORKSPACE_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

do $$
declare
  prepared jsonb := (select payload from application_preparation_results where name = 'canonical');
  application_uuid uuid := (prepared->'applicationAuthority'->>'applicationId')::uuid;
begin
  if (select count(*) from public.preference_application_preparation_events) <> 1 then
    raise exception 'EDIT_REFERENCE_PREPARATION_EVENT_COUNT_INVALID';
  end if;
  if not exists (
    select 1 from public.preference_applications application
    where application.id = application_uuid
      and application.workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and application.project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and application.edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
      and application.status = 'prepared'
      and application.connection_state = 'not_connected'
      and application.runtime_source = 'verified_live'
      and application.content_digest
        = prepared->'applicationAuthority'->>'applicationContentDigestSha256'
      and application.context_hash
        = prepared->'applicationAuthority'->>'applicationContextHashSha256'
      and application.target_understanding_package_digest = repeat('d', 64)
  ) then raise exception 'EDIT_REFERENCE_PREPARED_APPLICATION_INVALID'; end if;
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
  ) then raise exception 'EDIT_REFERENCE_PREPARATION_MUTATED_EXACT_EDIT'; end if;
  if (select count(*) from public.preference_application_lifecycle_events) <> 0
    or (select count(*) from public.exact_edit_preference_apply_events) <> 0
    or (select count(*) from public.preference_application_plan_invalidations) <> 0 then
    raise exception 'EDIT_REFERENCE_PREPARATION_MUTATED_LIFECYCLE_OR_PLAN';
  end if;
  begin
    update public.preference_application_preparation_events
      set receipt_json = '{"tampered":true}'::jsonb;
    raise exception 'EDIT_REFERENCE_PREPARATION_EVENT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
  begin
    update public.edit_reference_target_understanding_packages
      set record_json = '{"tampered":true}'::jsonb;
    raise exception 'EDIT_REFERENCE_TARGET_PACKAGE_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
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
    perform * from public.prepare_edit_reference_application_v1(
      'edit-reference-production-persistence-contract-v6',
      (select payload from application_preparation_requests where name = 'canonical')
    );
    raise exception 'EDIT_REFERENCE_PREPARATION_AUTHENTICATED_DIRECT_CALL_ALLOWED';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.preference_application_preparation_events) <> 1 then
    raise exception 'EDIT_REFERENCE_PREPARATION_TENANT_A_EVENT_NOT_VISIBLE';
  end if;
  if (select count(*) from public.edit_reference_target_understanding_packages) <> 1 then
    raise exception 'EDIT_REFERENCE_PREPARATION_TENANT_A_TARGET_SCOPE_INVALID';
  end if;
  begin
    insert into public.preference_application_preparation_events (
      transaction_id, workspace_id, project_id, edit_session_id,
      edit_reference_id, application_id, actor_user_id,
      preparation_request_digest_sha256, idempotency_key_hash_sha256,
      receipt_digest_sha256, request_json, receipt_json, prepared_at
    ) values (
      extensions.gen_random_uuid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'aaaaaaaa-1000-4000-8000-000000000001',
      'aaaaaaaa-2000-4000-8000-000000000001',
      'aaaaaaaa-3000-4000-8000-000000000001',
      'aaaaaaaa-7000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      repeat('1', 64), repeat('2', 64), repeat('3', 64),
      '{}'::jsonb, '{}'::jsonb, clock_timestamp()
    );
    raise exception 'EDIT_REFERENCE_PREPARATION_DIRECT_TABLE_WRITE_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

do $$
begin
  if (select count(*) from public.preference_application_preparation_events) <> 0 then
    raise exception 'EDIT_REFERENCE_PREPARATION_CROSS_TENANT_EVENT_VISIBLE';
  end if;
  if exists (
    select 1 from public.preference_applications
    where id = (
      select (payload->'applicationAuthority'->>'applicationId')::uuid
      from application_preparation_results where name = 'canonical'
    )
  ) then raise exception 'EDIT_REFERENCE_PREPARATION_CROSS_TENANT_APPLICATION_VISIBLE'; end if;
  if (select count(*) from public.edit_reference_target_understanding_packages) <> 1 then
    raise exception 'EDIT_REFERENCE_PREPARATION_TENANT_B_TARGET_SCOPE_INVALID';
  end if;
end;
$$;

rollback;
