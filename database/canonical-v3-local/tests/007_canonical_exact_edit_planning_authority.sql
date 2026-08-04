\set ON_ERROR_STOP on
\echo 'canonical-v3-local: exact-edit planning authority, replay, and RLS'

begin;
\ir _fixture.sql

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  authority jsonb;
  prepared jsonb;
  replayed jsonb;
  baseline_id text;
  cross_tenant_allowed boolean := false;
begin
  select * into authority
  from public.read_exact_edit_planning_authority_v1(
    'canonical-exact-edit-planning-authority-read-v1',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001'
    )
  );
  baseline_id := authority->'baseline'->>'preferenceSnapshotId';
  if authority->>'schemaVersion'
      <> 'canonical-exact-edit-planning-authority-read-v1'
    or authority->>'sourceAuthority'
      <> 'canonical_exact_edit_preference_repository'
    or authority->>'runtimeSource' <> 'verified_live'
    or authority->'sourcePreparation'->>'status' <> 'not_ready'
    or authority->'frameConfirmation'->>'status' <> 'confirmed'
    or authority->'frameConfirmation'->>'aspectRatio' <> '16:9'
    or baseline_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]+$'
    or authority->'baseline'->>'preferenceFingerprintSha256'
      <> authority->>'preferenceFingerprintSha256'
    or (authority->>'browserMutationAuthorityGranted')::boolean is not false then
    raise exception 'EXACT_EDIT_PLANNING_READ_INVALID_%', authority;
  end if;

  select * into prepared
  from public.record_exact_edit_planning_evidence_v1(
    jsonb_build_object(
      'schemaVersion', 'canonical-exact-edit-planning-evidence-request-v1',
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'expectedPreferenceRevision', 0,
      'expectedPlanningInputRevision', 0,
      'expectedPreferenceFingerprintSha256',
        '30ea22e2fda1b205f8f907010c394abf88cfb7e12397935997ed812bf921fb00',
      'expectedBaselinePreferenceSnapshotId', baseline_id,
      'sourceCandidateHashSha256', repeat('a', 64),
      'sourcePreparationEvidenceHashSha256', repeat('b', 64),
      'confirmedAspectRatio', '16:9'
    )
  );
  if (prepared->>'recordRevision')::bigint <> 1
    or (prepared->>'preferenceRevision')::bigint <> 0
    or (prepared->>'planningInputRevision')::bigint <> 0
    or prepared->'sourcePreparation'->>'status' <> 'ready'
    or prepared->'sourcePreparation'->>'sourceCandidateHashSha256'
      <> repeat('a', 64)
    or prepared->'sourcePreparation'->>'evidenceHashSha256'
      <> repeat('b', 64)
    or prepared->'baseline'->>'preferenceSnapshotId' <> baseline_id then
    raise exception 'EXACT_EDIT_PLANNING_PREPARE_INVALID_%', prepared;
  end if;

  select * into replayed
  from public.record_exact_edit_planning_evidence_v1(
    jsonb_build_object(
      'schemaVersion', 'canonical-exact-edit-planning-evidence-request-v1',
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'expectedPreferenceRevision', 0,
      'expectedPlanningInputRevision', 0,
      'expectedPreferenceFingerprintSha256',
        '30ea22e2fda1b205f8f907010c394abf88cfb7e12397935997ed812bf921fb00',
      'expectedBaselinePreferenceSnapshotId', baseline_id,
      'sourceCandidateHashSha256', repeat('a', 64),
      'sourcePreparationEvidenceHashSha256', repeat('b', 64),
      'confirmedAspectRatio', '16:9'
    )
  );
  if (replayed->>'recordRevision')::bigint <> 1
    or replayed->'sourcePreparation' <> prepared->'sourcePreparation' then
    raise exception 'EXACT_EDIT_PLANNING_REPLAY_INVALID_%', replayed;
  end if;

  begin
    perform * from public.read_exact_edit_planning_authority_v1(
      'canonical-exact-edit-planning-authority-read-v1',
      jsonb_build_object(
        'actorUserId', '11111111-1111-4111-8111-111111111111',
        'workspaceId', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'projectId', 'bbbbbbbb-1000-4000-8000-000000000001',
        'editSessionId', 'bbbbbbbb-2000-4000-8000-000000000001'
      )
    );
    cross_tenant_allowed := true;
  exception when sqlstate '42501' then null;
  end;
  if cross_tenant_allowed then
    raise exception 'EXACT_EDIT_PLANNING_CROSS_TENANT_ALLOWED';
  end if;
end;
$$;

reset role;

do $$
declare
  baseline_mutation_allowed boolean := false;
  invalidated public.exact_edit_preference_states%rowtype;
  changed_values jsonb;
begin
  begin
    update public.exact_edit_preference_states
    set baseline_preference_snapshot_id = 'tampered-baseline'
    where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001';
    baseline_mutation_allowed := true;
  exception when check_violation then null;
  end;
  if baseline_mutation_allowed then
    raise exception 'EXACT_EDIT_BASELINE_MUTATION_ALLOWED';
  end if;

  select preference_values || jsonb_build_object(
    'cleanupPreference', 'light_cleanup'
  ) into changed_values
  from public.exact_edit_preference_states
  where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
    and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001';
  update public.exact_edit_preference_states
  set preference_values = changed_values,
      preference_fingerprint_sha256 = public.reeditpro_sha256_json(changed_values)
  where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
    and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001';
  select * into invalidated
  from public.exact_edit_preference_states
  where workspace_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and project_id = 'aaaaaaaa-1000-4000-8000-000000000001'
    and edit_session_id = 'aaaaaaaa-2000-4000-8000-000000000001';
  if invalidated.source_preparation_status <> 'requires_repreparation'
    or invalidated.source_candidate_hash_sha256 is not null
    or invalidated.source_preparation_evidence_hash_sha256 is not null
    or invalidated.source_preparation_confirmed_at is not null then
    raise exception 'EXACT_EDIT_CLEANUP_DID_NOT_INVALIDATE_SOURCE_PREP';
  end if;
end;
$$;

rollback;
