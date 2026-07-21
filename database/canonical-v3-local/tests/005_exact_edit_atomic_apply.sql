\set ON_ERROR_STOP on
\echo 'canonical-v3-local: one atomic exact-edit Apply for preferences and Edit Reference'

-- Generic preference changes use the same revision and invalidation boundary.
begin;
\ir _fixture.sql

create temporary table exact_apply_requests (
  name text primary key,
  payload jsonb not null
) on commit drop;
create temporary table exact_apply_results (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select on exact_apply_requests to authenticated;
grant select, insert on exact_apply_results to authenticated;

with request_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-production-exact-edit-apply-boundary-v1',
    'rpcName', 'apply_exact_edit_preferences_and_reference_v1',
    'actorUserId', '11111111-1111-4111-8111-111111111111',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'accessCheckReceiptId', 'access-check-generic-a',
    'exactEditPreferenceAuthorityReadReceiptId', 'preference-read-generic-a',
    'expectedPreferenceRecordRevision', 0,
    'expectedPreferenceRevision', 0,
    'expectedPlanningInputRevision', 0,
    'expectedPreferenceFingerprintSha256', preference_fingerprint_sha256,
    'preferencePatch', jsonb_build_object(
      'cleanupPreference', 'light_cleanup',
      'targetPlatform', 'website'
    ),
    'changedPreferenceFields', jsonb_build_array('cleanupPreference', 'targetPlatform'),
    'referenceLifecycleRequest', null,
    'referenceLifecycleExecutionPolicy', 'nested_same_transaction_never_called_separately',
    'planningInputRevisionIncrement', 1,
    'sourcePreparationDisposition', 'requires_repreparation',
    'outputFrameDisposition', 'requires_reconfirmation',
    'freshPlanAndEstimateRequired', true,
    'approvedSnapshotPreserved', true,
    'historicalPrivatePreviewPreserved', true,
    'idempotencyKeyHashSha256', repeat('1', 64),
    'requestedAt', '2026-07-21T13:00:00.000Z',
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false,
    'providerOrWorkerExecutionStarted', false
  ) as value
  from public.exact_edit_preference_states
  where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
    and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
)
insert into exact_apply_requests (name, payload)
select 'generic', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

with changed as (
  select (payload - 'requestDigestSha256') || jsonb_build_object(
    'requestedAt', '2026-07-21T13:00:01.000Z'
  ) as value
  from exact_apply_requests where name = 'generic'
)
insert into exact_apply_requests (name, payload)
select 'generic_conflict', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from changed;

with cross_workspace as (
  select (payload - 'requestDigestSha256' - 'actorUserId' - 'idempotencyKeyHashSha256')
    || jsonb_build_object(
      'actorUserId', '22222222-2222-4222-8222-222222222222',
      'idempotencyKeyHashSha256', repeat('2', 64)
    ) as value
  from exact_apply_requests where name = 'generic'
)
insert into exact_apply_requests (name, payload)
select 'generic_cross_workspace', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from cross_workspace;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  applied jsonb;
  replayed jsonb;
begin
  select * into applied
  from public.apply_exact_edit_preferences_and_reference_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from exact_apply_requests where name = 'generic')
  );
  if applied->>'sourceAuthority' <> 'canonical_exact_edit_apply_rpc'
    or applied->'changedPreferenceFields' <> jsonb_build_array('cleanupPreference', 'targetPlatform')
    or applied->'referenceMutation' <> 'null'::jsonb
    or (applied->>'committedPreferenceRecordRevision')::bigint <> 1
    or (applied->>'committedPreferenceRevision')::bigint <> 1
    or (applied->>'committedPlanningInputRevision')::bigint <> 1
    or applied->>'sourcePreparationDisposition' <> 'requires_repreparation'
    or applied->>'outputFrameDisposition' <> 'requires_reconfirmation'
    or (applied->>'customerPriceCalculated')::boolean is not false
    or (applied->>'customerCreditsMutated')::boolean is not false
    or (applied->>'serviceFeeIncluded')::boolean is not false
    or (applied->>'providerOrWorkerExecutionStarted')::boolean is not false then
    raise exception 'EXACT_EDIT_GENERIC_RECEIPT_INVALID_%', applied;
  end if;
  insert into exact_apply_results values ('generic', applied);

  select * into replayed
  from public.apply_exact_edit_preferences_and_reference_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from exact_apply_requests where name = 'generic')
  );
  if replayed->>'transactionId' <> applied->>'transactionId'
    or replayed->>'transactionReceiptDigestSha256'
      <> applied->>'transactionReceiptDigestSha256' then
    raise exception 'EXACT_EDIT_GENERIC_REPLAY_CHANGED';
  end if;

  begin
    perform * from public.apply_exact_edit_preferences_and_reference_v1(
      'edit-reference-production-persistence-contract-v6',
      (select payload from exact_apply_requests where name = 'generic_conflict')
    );
    raise exception 'EXACT_EDIT_GENERIC_IDEMPOTENCY_CONFLICT_NOT_REJECTED';
  exception when unique_violation then null;
  end;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from public.exact_edit_preference_states
    where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
      and record_revision = 1
      and preference_revision = 1
      and planning_input_revision = 1
      and preference_values->>'cleanupPreference' = 'light_cleanup'
      and preference_values->>'targetPlatform' = 'website'
      and preference_fingerprint_sha256 = public.reeditpro_sha256_json(preference_values)
      and not output_frame_confirmed
      and output_frame_confirmation_id is null
      and current_draft_plan_version_id is null
      and current_draft_estimate_id is null
  ) then raise exception 'EXACT_EDIT_GENERIC_STATE_INVALID'; end if;
  if (select status from public.edit_plan_versions where id = 'aaaaaaaa-9000-4000-8000-000000000001') <> 'stale' then
    raise exception 'EXACT_EDIT_GENERIC_PLAN_NOT_STALE';
  end if;
  if (select status from public.edit_credit_estimates where id = 'aaaaaaaa-a000-4000-8000-000000000001') <> 'stale' then
    raise exception 'EXACT_EDIT_GENERIC_ESTIMATE_NOT_STALE';
  end if;
  if (select count(*) from public.exact_edit_preference_apply_events) <> 1
    or (select count(*) from public.preference_application_lifecycle_events) <> 0 then
    raise exception 'EXACT_EDIT_GENERIC_EVENT_COUNT_INVALID';
  end if;
  begin
    update public.exact_edit_preference_apply_events
      set receipt_json = '{"tampered":true}'::jsonb;
    raise exception 'EXACT_EDIT_APPLY_EVENT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
do $$
declare
  cross_request jsonb;
begin
  select payload into cross_request
  from exact_apply_requests where name = 'generic_cross_workspace';
  begin
    perform * from public.apply_exact_edit_preferences_and_reference_v1(
      'edit-reference-production-persistence-contract-v6', cross_request
    );
    raise exception 'EXACT_EDIT_CROSS_WORKSPACE_MUTATION_ALLOWED';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.exact_edit_preference_apply_events) <> 0 then
    raise exception 'EXACT_EDIT_CROSS_WORKSPACE_EVENT_VISIBLE';
  end if;
end;
$$;

rollback;

-- A reference decision and field change commit inside one outer transaction.
begin;
\ir _fixture.sql

create temporary table exact_combined_requests (
  name text primary key,
  payload jsonb not null
) on commit drop;
create temporary table exact_combined_results (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select on exact_combined_requests to authenticated;
grant select, insert on exact_combined_results to authenticated;

with frame_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-production-output-frame-authority-v1',
    'repositoryAuthority', 'supabase_rls_transactional',
    'sourceAuthority', 'canonical_exact_edit_preference_frame_confirmation',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'planningInputRevision', 0,
    'exactEditPreferenceRecordRevision', 0,
    'confirmationId', 'aaaaaaaa-8000-4000-8000-000000000001',
    'aspectRatio', '16:9',
    'confirmedAt', '2026-07-21T12:00:00.000Z',
    'browserSuppliedAuthorityAccepted', false
  ) as value
), lifecycle_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-production-application-lifecycle-request-v2',
    'rpcName', 'mutate_edit_reference_application_lifecycle_v3',
    'actorUserId', '11111111-1111-4111-8111-111111111111',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'editReferenceId', 'aaaaaaaa-3000-4000-8000-000000000001',
    'studySessionId', 'aaaaaaaa-4000-4000-8000-000000000001',
    'dnaVersionId', 'aaaaaaaa-5000-4000-8000-000000000001',
    'applicationId', 'aaaaaaaa-7000-4000-8000-000000000001',
    'expectedCurrentApplicationId', null,
    'mutation', 'apply',
    'expectedReferenceRevision', 1,
    'expectedPlanningInputRevision', 0,
    'applicationContentDigestSha256', repeat('7', 64),
    'applicationContextHashSha256', repeat('8', 64),
    'targetUnderstandingPackageDigestSha256', repeat('9', 64),
    'outputFrameConfirmation', value || jsonb_build_object(
      'authorityDigestSha256', public.reeditpro_sha256_json(value)
    ),
    'idempotencyKeyHashSha256', repeat('3', 64),
    'requestedAt', '2026-07-21T13:10:00.000Z'
  ) as value
  from frame_without_digest
), lifecycle_request as (
  select value || jsonb_build_object(
    'requestDigestSha256', public.reeditpro_sha256_json(value)
  ) as value
  from lifecycle_without_digest
), outer_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-production-exact-edit-apply-boundary-v1',
    'rpcName', 'apply_exact_edit_preferences_and_reference_v1',
    'actorUserId', '11111111-1111-4111-8111-111111111111',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'accessCheckReceiptId', 'access-check-combined-a',
    'exactEditPreferenceAuthorityReadReceiptId', 'preference-read-combined-a',
    'expectedPreferenceRecordRevision', 0,
    'expectedPreferenceRevision', 0,
    'expectedPlanningInputRevision', 0,
    'expectedPreferenceFingerprintSha256', state_row.preference_fingerprint_sha256,
    'preferencePatch', jsonb_build_object('visualPreference', 'keep_visuals_minimal'),
    'changedPreferenceFields', jsonb_build_array('visualPreference'),
    'referenceLifecycleRequest', lifecycle_request.value,
    'referenceLifecycleExecutionPolicy', 'nested_same_transaction_never_called_separately',
    'planningInputRevisionIncrement', 1,
    'sourcePreparationDisposition', 'unchanged',
    'outputFrameDisposition', 'unchanged',
    'freshPlanAndEstimateRequired', true,
    'approvedSnapshotPreserved', true,
    'historicalPrivatePreviewPreserved', true,
    'idempotencyKeyHashSha256', repeat('3', 64),
    'requestedAt', '2026-07-21T13:10:00.000Z',
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false,
    'providerOrWorkerExecutionStarted', false
  ) as value
  from lifecycle_request
  cross join public.exact_edit_preference_states state_row
  where state_row.workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and state_row.project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
    and state_row.edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
)
insert into exact_combined_requests (name, payload)
select 'combined', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from outer_without_digest;

with stale as (
  select (payload - 'requestDigestSha256' - 'idempotencyKeyHashSha256')
    || jsonb_build_object('idempotencyKeyHashSha256', repeat('4', 64)) as value
  from exact_combined_requests where name = 'combined'
)
insert into exact_combined_requests (name, payload)
select 'combined_stale', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from stale;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  applied jsonb;
  replayed jsonb;
  stale_request jsonb;
begin
  select * into applied
  from public.apply_exact_edit_preferences_and_reference_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from exact_combined_requests where name = 'combined')
  );
  if applied->>'referenceMutation' <> 'apply'
    or applied->'changedPreferenceFields' <> jsonb_build_array('visualPreference')
    or (applied->>'committedPreferenceRecordRevision')::bigint <> 1
    or (applied->>'committedPreferenceRevision')::bigint <> 1
    or (applied->>'committedPlanningInputRevision')::bigint <> 1 then
    raise exception 'EXACT_EDIT_COMBINED_RECEIPT_INVALID_%', applied;
  end if;
  insert into exact_combined_results values ('combined', applied);

  select * into replayed
  from public.apply_exact_edit_preferences_and_reference_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from exact_combined_requests where name = 'combined')
  );
  if replayed->>'transactionId' <> applied->>'transactionId' then
    raise exception 'EXACT_EDIT_COMBINED_REPLAY_CHANGED';
  end if;

  select payload into stale_request
  from exact_combined_requests where name = 'combined_stale';
  begin
    perform * from public.apply_exact_edit_preferences_and_reference_v1(
      'edit-reference-production-persistence-contract-v6', stale_request
    );
    raise exception 'EXACT_EDIT_COMBINED_STALE_CAS_NOT_REJECTED';
  exception when serialization_failure then null;
  end;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from public.exact_edit_preference_states
    where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
      and record_revision = 1
      and preference_revision = 1
      and planning_input_revision = 1
      and preference_values->>'visualPreference' = 'keep_visuals_minimal'
      and current_application_state = 'connected'
      and current_application_id = 'aaaaaaaa-7000-4000-8000-000000000001'
      and output_frame_confirmed
  ) then raise exception 'EXACT_EDIT_COMBINED_STATE_INVALID'; end if;
  if not exists (
    select 1 from public.preference_applications
    where id = 'aaaaaaaa-7000-4000-8000-000000000001'
      and connection_state = 'connected'
  ) then raise exception 'EXACT_EDIT_COMBINED_APPLICATION_NOT_CONNECTED'; end if;
  if (select count(*) from public.exact_edit_preference_apply_events) <> 1
    or (select count(*) from public.preference_application_lifecycle_events) <> 1 then
    raise exception 'EXACT_EDIT_COMBINED_EVENT_COUNT_INVALID';
  end if;
  if (select count(*) from public.edit_reference_idempotency_receipts
      where idempotency_key_hash = repeat('3', 64)) <> 2 then
    raise exception 'EXACT_EDIT_COMBINED_NESTED_IDEMPOTENCY_LINEAGE_INVALID';
  end if;
  if not exists (
    select 1 from public.exact_edit_preference_apply_events
    where reference_mutation = 'apply'
      and reference_lifecycle_receipt->>'mutation' = 'apply'
      and committed_preference_record_revision = 1
      and committed_planning_input_revision = 1
  ) then raise exception 'EXACT_EDIT_COMBINED_EVENT_LINEAGE_INVALID'; end if;
end;
$$;

rollback;

\echo 'PASS 005_exact_edit_atomic_apply'
