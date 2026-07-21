\set ON_ERROR_STOP on
\echo 'canonical-v3-local: materialize durable recovery fixture'
\ir _fixture.sql

create temporary table recovery_exact_apply_request (
  payload jsonb not null
) on commit preserve rows;
grant select on recovery_exact_apply_request to authenticated;

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
    'idempotencyKeyHashSha256', repeat('a', 64),
    'requestedAt', '2026-07-21T16:00:00.000Z'
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
    'accessCheckReceiptId', 'recovery-access-check-a',
    'exactEditPreferenceAuthorityReadReceiptId', 'recovery-preference-read-a',
    'expectedPreferenceRecordRevision', 0,
    'expectedPreferenceRevision', 0,
    'expectedPlanningInputRevision', 0,
    'expectedPreferenceFingerprintSha256', state_row.preference_fingerprint_sha256,
    'preferencePatch', '{}'::jsonb,
    'changedPreferenceFields', '[]'::jsonb,
    'referenceLifecycleRequest', lifecycle_request.value,
    'referenceLifecycleExecutionPolicy', 'nested_same_transaction_never_called_separately',
    'planningInputRevisionIncrement', 1,
    'sourcePreparationDisposition', 'unchanged',
    'outputFrameDisposition', 'unchanged',
    'freshPlanAndEstimateRequired', true,
    'approvedSnapshotPreserved', true,
    'historicalPrivatePreviewPreserved', true,
    'idempotencyKeyHashSha256', repeat('a', 64),
    'requestedAt', '2026-07-21T16:00:00.000Z',
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
insert into recovery_exact_apply_request (payload)
select value || jsonb_build_object(
  'requestDigestSha256', public.reeditpro_sha256_json(value)
) from outer_without_digest;

set role authenticated;
\o /dev/null
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  false
);
\o

do $$
declare
  applied jsonb;
begin
  select * into applied
  from public.apply_exact_edit_preferences_and_reference_v1(
    'edit-reference-production-persistence-contract-v6',
    (select payload from recovery_exact_apply_request)
  );
  if applied->>'referenceMutation' <> 'apply'
    or applied->'changedPreferenceFields' <> '[]'::jsonb
    or (applied->>'committedPreferenceRecordRevision')::bigint <> 1
    or (applied->>'committedPreferenceRevision')::bigint <> 0
    or (applied->>'committedPlanningInputRevision')::bigint <> 1
    or (applied->>'customerPriceCalculated')::boolean is not false
    or (applied->>'customerCreditsMutated')::boolean is not false
    or (applied->>'serviceFeeIncluded')::boolean is not false
    or (applied->>'providerOrWorkerExecutionStarted')::boolean is not false then
    raise exception 'RECOVERY_SEED_EXACT_APPLY_INVALID_%', applied;
  end if;
end;
$$;

reset role;
\o /dev/null
select set_config('request.jwt.claims', '{}', false);
\o

set role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

do $$
declare
  created jsonb;
  appended jsonb;
  study_id uuid;
begin
  select * into created
  from public.mutate_edit_reference_domain_command_v1(
    'edit-reference-domain-command-v1',
    '11111111-1111-4111-8111-111111111111',
    jsonb_build_object(
      'schemaVersion', 'edit-reference-domain-command-v1',
      'operation', 'edit_reference.create',
      'request', jsonb_build_object(
        'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'name', 'Recovery domain preference',
        'description', 'Durable library and Study Chat recovery proof.',
        'initialGoals', jsonb_build_array('story_and_pacing', 'audio_and_sfx')
      )
    ),
    repeat('d', 64),
    repeat('e', 64)
  );
  study_id := (created->'receipt'->'result'->>'studySessionId')::uuid;

  select * into appended
  from public.mutate_edit_reference_domain_command_v1(
    'edit-reference-domain-command-v1',
    '11111111-1111-4111-8111-111111111111',
    jsonb_build_object(
      'schemaVersion', 'edit-reference-domain-command-v1',
      'operation', 'preference_study.message.append',
      'request', jsonb_build_object(
        'studyId', study_id::text,
        'input', jsonb_build_object(
          'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'expectedStudyRevision', 1,
          'clientMessageId', 'recovery-domain-message-1',
          'content', 'Preserve the quiet pause before the central testimony.'
        )
      )
    ),
    repeat('f', 64),
    repeat('0', 64)
  );
  if created->>'replayed' <> 'false'
    or appended->>'replayed' <> 'false'
    or appended->'aggregate'->>'revision' <> '2'
    or jsonb_array_length(appended->'aggregate'->'evidence') <> 1
  then raise exception 'RECOVERY_DOMAIN_SEED_INVALID_%_%', created, appended; end if;
end;
$$;

reset role;
\o /dev/null
select set_config('request.jwt.claims', '{}', false);
\o

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
  '{"immutable":true,"recoveryProof":true,"version":1}'::jsonb,
  '11111111-1111-4111-8111-111111111111',
  '2026-07-21T16:01:00.000Z'
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

\echo 'PASS durable recovery fixture materialized'
