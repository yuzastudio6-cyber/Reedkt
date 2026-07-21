\set ON_ERROR_STOP on
\echo 'canonical-v3-local: Edit Reference V6 lifecycle, CAS, idempotency, and immutable approvals'

begin;
\ir _fixture.sql

create temporary table lifecycle_test_requests (
  name text primary key,
  payload jsonb not null
) on commit drop;
create temporary table lifecycle_test_results (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select on lifecycle_test_requests to authenticated;
grant select, insert, update on lifecycle_test_results to authenticated;

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
), request_without_digest as (
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
    'idempotencyKeyHashSha256', repeat('a', 64),
    'requestedAt', '2026-07-21T12:01:00.000Z'
  ) as value
  from frame_without_digest
)
insert into lifecycle_test_requests (name, payload)
select 'apply', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

with changed as (
  select (payload - 'requestDigestSha256') || jsonb_build_object(
    'requestedAt', '2026-07-21T12:01:01.000Z'
  ) as value
  from lifecycle_test_requests where name = 'apply'
)
insert into lifecycle_test_requests (name, payload)
select 'apply_conflict', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from changed;

with stale as (
  select (payload - 'requestDigestSha256') || jsonb_build_object(
    'idempotencyKeyHashSha256', repeat('b', 64),
    'requestedAt', '2026-07-21T12:01:02.000Z'
  ) as value
  from lifecycle_test_requests where name = 'apply'
)
insert into lifecycle_test_requests (name, payload)
select 'apply_stale', value || jsonb_build_object(
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
  state_read jsonb;
begin
  select * into applied
  from public.mutate_edit_reference_application_lifecycle_v3(
    'edit-reference-production-persistence-contract-v6',
    (select payload from lifecycle_test_requests where name = 'apply')
  );
  if applied->>'mutation' <> 'apply'
    or applied->>'applicationStatusAfter' <> 'connected'
    or (applied->>'freshPlanAndEstimateRequired')::boolean is not true
    or (applied->>'approvedSnapshotPreserved')::boolean is not true
    or (applied->>'customerPriceCalculated')::boolean is not false
    or (applied->>'customerCreditsMutated')::boolean is not false
    or (applied->>'serviceFeeIncluded')::boolean is not false
    or (applied->>'providerOrWorkerExecutionStarted')::boolean is not false then
    raise exception 'LIFECYCLE_APPLY_RECEIPT_INVALID_%', applied;
  end if;
  insert into lifecycle_test_results values ('apply', applied);

  select * into replayed
  from public.mutate_edit_reference_application_lifecycle_v3(
    'edit-reference-production-persistence-contract-v6',
    (select payload from lifecycle_test_requests where name = 'apply')
  );
  if replayed->>'transactionId' <> applied->>'transactionId'
    or replayed->>'receiptDigestSha256' <> applied->>'receiptDigestSha256' then
    raise exception 'LIFECYCLE_IDEMPOTENT_REPLAY_CHANGED';
  end if;

  begin
    perform * from public.mutate_edit_reference_application_lifecycle_v3(
      'edit-reference-production-persistence-contract-v6',
      (select payload from lifecycle_test_requests where name = 'apply_conflict')
    );
    raise exception 'LIFECYCLE_IDEMPOTENCY_CONFLICT_NOT_REJECTED';
  exception when unique_violation then null;
  end;

  begin
    perform * from public.mutate_edit_reference_application_lifecycle_v3(
      'edit-reference-production-persistence-contract-v6',
      (select payload from lifecycle_test_requests where name = 'apply_stale')
    );
    raise exception 'LIFECYCLE_STALE_CAS_NOT_REJECTED';
  exception when serialization_failure then null;
  end;

  select * into state_read
  from public.read_exact_edit_reference_application_state_v2(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-planning-authority-read-v2',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    )
  );
  if state_read->>'currentState' <> 'connected'
    or state_read->'application'->>'id' <> 'aaaaaaaa-7000-4000-8000-000000000001'
    or state_read->'lifecycleReceipt'->>'mutation' <> 'apply' then
    raise exception 'LIFECYCLE_CONNECTED_READ_INVALID_%', state_read;
  end if;
end;
$$;

reset role;

do $$
begin
  if (select revision from public.edit_references where id = 'aaaaaaaa-3000-4000-8000-000000000001') <> 2 then
    raise exception 'LIFECYCLE_REFERENCE_REVISION_NOT_INCREMENTED';
  end if;
  if not exists (
    select 1 from public.exact_edit_preference_states
    where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001'
      and current_application_state = 'connected'
      and current_application_id = 'aaaaaaaa-7000-4000-8000-000000000001'
      and record_revision = 1
      and planning_input_revision = 1
      and current_draft_plan_version_id is null
      and current_draft_estimate_id is null
  ) then raise exception 'LIFECYCLE_EXACT_STATE_NOT_CONNECTED'; end if;
  if (select status from public.edit_plan_versions where id = 'aaaaaaaa-9000-4000-8000-000000000001') <> 'stale' then
    raise exception 'LIFECYCLE_DRAFT_PLAN_NOT_STALE';
  end if;
  if (select status from public.edit_credit_estimates where id = 'aaaaaaaa-a000-4000-8000-000000000001') <> 'stale' then
    raise exception 'LIFECYCLE_DRAFT_ESTIMATE_NOT_STALE';
  end if;
  if (select count(*) from public.preference_application_lifecycle_events) <> 1 then
    raise exception 'LIFECYCLE_REPLAY_CREATED_DUPLICATE_EVENT';
  end if;
end;
$$;

insert into public.edit_plan_versions (
  id, workspace_id, project_id, edit_session_id, version, status,
  plan_digest_sha256, preference_application_id
) values (
  'aaaaaaaa-9000-4000-8000-000000000002',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  2, 'approved', repeat('1', 64),
  'aaaaaaaa-7000-4000-8000-000000000001'
);
insert into public.approved_plan_snapshots (
  id, workspace_id, project_id, edit_session_id, edit_plan_version_id,
  preference_application_id, preference_application_content_digest_sha256,
  preference_application_context_hash_sha256, snapshot_digest_sha256,
  snapshot_json, approved_by_user_id, approved_at
) values (
  'aaaaaaaa-b000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  'aaaaaaaa-9000-4000-8000-000000000002',
  'aaaaaaaa-7000-4000-8000-000000000001',
  repeat('7', 64), repeat('8', 64), repeat('2', 64),
  '{"immutable":true,"version":1}'::jsonb,
  '11111111-1111-4111-8111-111111111111', clock_timestamp()
);
insert into public.edit_execution_authorizations (
  id, workspace_id, project_id, edit_session_id, approved_plan_snapshot_id,
  edit_plan_version_id, preference_application_id,
  preference_application_content_digest_sha256,
  preference_application_context_hash_sha256, status
) values (
  'aaaaaaaa-c000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  'aaaaaaaa-b000-4000-8000-000000000001',
  'aaaaaaaa-9000-4000-8000-000000000002',
  'aaaaaaaa-7000-4000-8000-000000000001',
  repeat('7', 64), repeat('8', 64), 'active'
);

insert into public.edit_plan_versions (
  id, workspace_id, project_id, edit_session_id, version, status,
  plan_digest_sha256, preference_application_id
) values (
  'aaaaaaaa-9000-4000-8000-000000000003',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  3, 'draft', repeat('3', 64),
  'aaaaaaaa-7000-4000-8000-000000000001'
);
insert into public.edit_credit_estimates (
  id, workspace_id, project_id, edit_session_id, edit_plan_version_id,
  version, status, estimate_digest_sha256, estimate_json
) values (
  'aaaaaaaa-a000-4000-8000-000000000003',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  'aaaaaaaa-9000-4000-8000-000000000003',
  3, 'draft', repeat('4', 64), '{"internalCostOnly":true}'::jsonb
);

with frame_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-production-output-frame-authority-v1',
    'repositoryAuthority', 'supabase_rls_transactional',
    'sourceAuthority', 'canonical_exact_edit_preference_frame_confirmation',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'planningInputRevision', 1,
    'exactEditPreferenceRecordRevision', 1,
    'confirmationId', 'aaaaaaaa-8000-4000-8000-000000000002',
    'aspectRatio', '16:9',
    'confirmedAt', '2026-07-21T12:02:00.000Z',
    'browserSuppliedAuthorityAccepted', false
  ) as value
)
update public.exact_edit_preference_states state_row
set current_draft_plan_version_id = 'aaaaaaaa-9000-4000-8000-000000000003',
    current_draft_estimate_id = 'aaaaaaaa-a000-4000-8000-000000000003',
    output_frame_confirmation_id = 'aaaaaaaa-8000-4000-8000-000000000002',
    output_frame_confirmed_at = '2026-07-21T12:02:00.000Z'::timestamptz,
    output_frame_authority_digest_sha256 = public.reeditpro_sha256_json(frame_without_digest.value)
from frame_without_digest
where state_row.workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and state_row.project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
  and state_row.edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001';

with frame_without_digest as (
  select jsonb_build_object(
    'schemaVersion', 'edit-reference-production-output-frame-authority-v1',
    'repositoryAuthority', 'supabase_rls_transactional',
    'sourceAuthority', 'canonical_exact_edit_preference_frame_confirmation',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
    'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
    'planningInputRevision', 1,
    'exactEditPreferenceRecordRevision', 1,
    'confirmationId', 'aaaaaaaa-8000-4000-8000-000000000002',
    'aspectRatio', '16:9',
    'confirmedAt', '2026-07-21T12:02:00.000Z',
    'browserSuppliedAuthorityAccepted', false
  ) as value
), request_without_digest as (
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
    'applicationId', 'aaaaaaaa-7000-4000-8000-000000000002',
    'expectedCurrentApplicationId', 'aaaaaaaa-7000-4000-8000-000000000001',
    'mutation', 'replace',
    'expectedReferenceRevision', 2,
    'expectedPlanningInputRevision', 1,
    'applicationContentDigestSha256', repeat('c', 64),
    'applicationContextHashSha256', repeat('d', 64),
    'targetUnderstandingPackageDigestSha256', repeat('e', 64),
    'outputFrameConfirmation', value || jsonb_build_object(
      'authorityDigestSha256', public.reeditpro_sha256_json(value)
    ),
    'idempotencyKeyHashSha256', repeat('c', 64),
    'requestedAt', '2026-07-21T12:03:00.000Z'
  ) as value
  from frame_without_digest
)
insert into lifecycle_test_requests (name, payload)
select 'replace', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  current_check jsonb;
  replaced jsonb;
  state_read jsonb;
begin
  select * into current_check
  from public.assert_preference_application_plan_current_v1(
    'edit-reference-production-persistence-contract-v6',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    ),
    'aaaaaaaa-7000-4000-8000-000000000001',
    repeat('7', 64), repeat('8', 64),
    'aaaaaaaa-b000-4000-8000-000000000001',
    'worker_claim'
  );
  if (current_check->>'current')::boolean is not true then
    raise exception 'LIFECYCLE_APPROVED_APPLICATION_NOT_CURRENT_%', current_check;
  end if;

  select * into replaced
  from public.mutate_edit_reference_application_lifecycle_v3(
    'edit-reference-production-persistence-contract-v6',
    (select payload from lifecycle_test_requests where name = 'replace')
  );
  if replaced->>'mutation' <> 'replace'
    or replaced->>'previousApplicationId' <> 'aaaaaaaa-7000-4000-8000-000000000001'
    or replaced->>'executionAuthorizationDisposition' <> 'revoked' then
    raise exception 'LIFECYCLE_REPLACE_RECEIPT_INVALID_%', replaced;
  end if;
  insert into lifecycle_test_results values ('replace', replaced);

  select * into state_read
  from public.read_exact_edit_reference_application_state_v2(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-planning-authority-read-v2',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    )
  );
  if state_read->'application'->>'id' <> 'aaaaaaaa-7000-4000-8000-000000000002'
    or state_read->'lifecycleReceipt'->>'mutation' <> 'replace' then
    raise exception 'LIFECYCLE_REPLACED_READ_INVALID_%', state_read;
  end if;

  select * into current_check
  from public.assert_preference_application_plan_current_v1(
    'edit-reference-production-persistence-contract-v6',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    ),
    'aaaaaaaa-7000-4000-8000-000000000001',
    repeat('7', 64), repeat('8', 64),
    'aaaaaaaa-b000-4000-8000-000000000001',
    'worker_claim'
  );
  if (current_check->>'current')::boolean is not false
    or current_check->>'planLifecycleStatus' <> 'stale' then
    raise exception 'LIFECYCLE_REPLACED_APPLICATION_STILL_CURRENT_%', current_check;
  end if;
end;
$$;

reset role;

do $$
begin
  if (select status from public.edit_execution_authorizations where id = 'aaaaaaaa-c000-4000-8000-000000000001') <> 'revoked' then
    raise exception 'LIFECYCLE_ACTIVE_EXECUTION_NOT_REVOKED';
  end if;
  if (select status from public.edit_plan_versions where id = 'aaaaaaaa-9000-4000-8000-000000000003') <> 'stale' then
    raise exception 'LIFECYCLE_REPLACEMENT_PLAN_NOT_STALE';
  end if;
  if (select snapshot_json from public.approved_plan_snapshots where id = 'aaaaaaaa-b000-4000-8000-000000000001')
      <> '{"immutable":true,"version":1}'::jsonb then
    raise exception 'LIFECYCLE_APPROVED_SNAPSHOT_CHANGED';
  end if;
  if not exists (
    select 1 from public.preference_applications
    where id = 'aaaaaaaa-7000-4000-8000-000000000001'
      and status = 'replaced' and connection_state = 'invalidated'
      and replaced_by_application_id = 'aaaaaaaa-7000-4000-8000-000000000002'
  ) then raise exception 'LIFECYCLE_OLD_APPLICATION_NOT_REPLACED'; end if;
end;
$$;

insert into public.edit_plan_versions (
  id, workspace_id, project_id, edit_session_id, version, status,
  plan_digest_sha256, preference_application_id
) values (
  'aaaaaaaa-9000-4000-8000-000000000004',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  4, 'approved', repeat('a', 64),
  'aaaaaaaa-7000-4000-8000-000000000002'
);
insert into public.approved_plan_snapshots (
  id, workspace_id, project_id, edit_session_id, edit_plan_version_id,
  preference_application_id, preference_application_content_digest_sha256,
  preference_application_context_hash_sha256, snapshot_digest_sha256,
  snapshot_json, approved_by_user_id
) values (
  'aaaaaaaa-b000-4000-8000-000000000002',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  'aaaaaaaa-9000-4000-8000-000000000004',
  'aaaaaaaa-7000-4000-8000-000000000002',
  repeat('c', 64), repeat('d', 64), repeat('b', 64),
  '{"immutable":true,"version":2}'::jsonb,
  '11111111-1111-4111-8111-111111111111'
);
insert into public.edit_execution_authorizations (
  id, workspace_id, project_id, edit_session_id, approved_plan_snapshot_id,
  edit_plan_version_id, preference_application_id,
  preference_application_content_digest_sha256,
  preference_application_context_hash_sha256, status
) values (
  'aaaaaaaa-c000-4000-8000-000000000002',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-2000-4000-8000-000000000001',
  'aaaaaaaa-b000-4000-8000-000000000002',
  'aaaaaaaa-9000-4000-8000-000000000004',
  'aaaaaaaa-7000-4000-8000-000000000002',
  repeat('c', 64), repeat('d', 64), 'active'
);

with request_without_digest as (
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
    'applicationId', 'aaaaaaaa-7000-4000-8000-000000000002',
    'expectedCurrentApplicationId', 'aaaaaaaa-7000-4000-8000-000000000002',
    'mutation', 'remove',
    'expectedReferenceRevision', 3,
    'expectedPlanningInputRevision', 2,
    'applicationContentDigestSha256', repeat('c', 64),
    'applicationContextHashSha256', repeat('d', 64),
    'targetUnderstandingPackageDigestSha256', null,
    'outputFrameConfirmation', null,
    'idempotencyKeyHashSha256', repeat('d', 64),
    'requestedAt', '2026-07-21T12:04:00.000Z'
  ) as value
)
insert into lifecycle_test_requests (name, payload)
select 'remove', value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from request_without_digest;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  removed jsonb;
  state_read jsonb;
begin
  select * into removed
  from public.mutate_edit_reference_application_lifecycle_v3(
    'edit-reference-production-persistence-contract-v6',
    (select payload from lifecycle_test_requests where name = 'remove')
  );
  if removed->>'mutation' <> 'remove'
    or removed->>'applicationStatusAfter' <> 'cleared'
    or removed->>'executionAuthorizationDisposition' <> 'revoked' then
    raise exception 'LIFECYCLE_REMOVE_RECEIPT_INVALID_%', removed;
  end if;

  select * into state_read
  from public.read_exact_edit_reference_application_state_v2(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-planning-authority-read-v2',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    )
  );
  if state_read->>'currentState' <> 'cleared'
    or state_read ? 'application'
    or state_read->'lifecycleReceipt'->>'mutation' <> 'remove' then
    raise exception 'LIFECYCLE_CLEARED_READ_INVALID_%', state_read;
  end if;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from public.exact_edit_preference_states
    where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and current_application_state = 'cleared'
      and current_application_id is null
      and planning_input_revision = 3
  ) then raise exception 'LIFECYCLE_EXACT_STATE_NOT_CLEARED'; end if;
  if not exists (
    select 1 from public.preference_applications
    where id = 'aaaaaaaa-7000-4000-8000-000000000002'
      and status = 'cleared' and connection_state = 'invalidated'
  ) then raise exception 'LIFECYCLE_APPLICATION_NOT_CLEARED'; end if;
  if (select status from public.edit_execution_authorizations where id = 'aaaaaaaa-c000-4000-8000-000000000002') <> 'revoked' then
    raise exception 'LIFECYCLE_REMOVE_DID_NOT_REVOKE_EXECUTION';
  end if;
  if (select count(*) from public.approved_plan_snapshots) <> 2 then
    raise exception 'LIFECYCLE_APPROVED_HISTORY_NOT_PRESERVED';
  end if;
  if (select count(*) from public.preference_application_lifecycle_events) <> 3 then
    raise exception 'LIFECYCLE_EVENT_COUNT_INVALID';
  end if;

  begin
    update public.approved_plan_snapshots
      set snapshot_json = '{"tampered":true}'::jsonb
      where id = 'aaaaaaaa-b000-4000-8000-000000000001';
    raise exception 'LIFECYCLE_APPROVED_SNAPSHOT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

rollback;

\echo 'PASS 002_edit_reference_v6_lifecycle_rpc'
