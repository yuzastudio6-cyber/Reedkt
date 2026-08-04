\set ON_ERROR_STOP on
\echo 'canonical-v3-local: exact-edit Apply authority read and tenant isolation'

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
  without_application jsonb;
  cross_tenant_allowed boolean := false;
  initial_event_count bigint;
  final_event_count bigint;
begin
  select count(*) into initial_event_count
  from public.exact_edit_preference_apply_events;

  select * into authority
  from public.read_exact_edit_apply_authority_v1(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-exact-edit-apply-authority-read-v1',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'selectedApplicationId', 'aaaaaaaa-7000-4000-8000-000000000001'
    )
  );

  if authority->>'schemaVersion'
      <> 'edit-reference-production-exact-edit-apply-authority-read-v1'
    or authority->>'sourceAuthority'
      <> 'canonical_exact_edit_preference_repository'
    or authority->>'runtimeSource' <> 'verified_live'
    or authority->>'workspaceId' <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    or authority->>'projectId' <> 'aaaaaaaa-1000-4000-8000-000000000001'
    or authority->>'editSessionId' <> 'aaaaaaaa-2000-4000-8000-000000000001'
    or (authority->>'recordRevision')::bigint <> 0
    or (authority->>'preferenceRevision')::bigint <> 0
    or (authority->>'planningInputRevision')::bigint <> 0
    or authority->>'preferenceFingerprintSha256'
      <> '30ea22e2fda1b205f8f907010c394abf88cfb7e12397935997ed812bf921fb00'
    or authority->>'lifecyclePhase' <> 'planning'
    or (authority->>'locked')::boolean is not false
    or authority->>'currentApplicationState' <> 'not_selected'
    or authority->'currentApplicationId' <> 'null'::jsonb
    or (authority->>'browserMutationAuthorityGranted')::boolean is not false
    or (authority->>'productionReleaseReadinessEvaluatedSeparately')::boolean is not true then
    raise exception 'EXACT_EDIT_APPLY_READ_AUTHORITY_INVALID_%', authority;
  end if;

  if authority->'outputFrameAuthority'->>'sourceAuthority'
      <> 'canonical_exact_edit_preference_frame_confirmation'
    or authority->'outputFrameAuthority'->>'repositoryAuthority'
      <> 'supabase_rls_transactional'
    or authority->'outputFrameAuthority'->>'aspectRatio' <> '16:9'
    or authority->'outputFrameAuthority'->>'authorityDigestSha256'
      <> 'b84f8097002fd92d09ada47a4a2d0c08c61a6fdc94eaf10917d40725e839e9ba' then
    raise exception 'EXACT_EDIT_APPLY_READ_FRAME_INVALID_%', authority->'outputFrameAuthority';
  end if;

  if authority->'selectedApplicationAuthority'->>'applicationId'
      <> 'aaaaaaaa-7000-4000-8000-000000000001'
    or authority->'selectedApplicationAuthority'->>'sourceAuthority'
      <> 'canonical_preference_application_repository'
    or authority->'selectedApplicationAuthority'->>'applicationContentDigestSha256'
      <> repeat('7', 64)
    or authority->'selectedApplicationAuthority'->>'applicationContextHashSha256'
      <> repeat('8', 64)
    or authority->'selectedApplicationAuthority'->>'targetUnderstandingPackageDigestSha256'
      <> repeat('9', 64)
    or (authority->'selectedApplicationAuthority'->>'expectedReferenceRevision')::bigint <> 1
    or authority->'selectedApplicationAuthority'->>'connectionState' <> 'not_connected' then
    raise exception 'EXACT_EDIT_APPLY_READ_APPLICATION_INVALID_%',
      authority->'selectedApplicationAuthority';
  end if;

  select * into without_application
  from public.read_exact_edit_apply_authority_v1(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-exact-edit-apply-authority-read-v1',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'selectedApplicationId', null
    )
  );
  if without_application->'selectedApplicationAuthority' <> 'null'::jsonb then
    raise exception 'EXACT_EDIT_APPLY_READ_HIDDEN_APPLICATION_%', without_application;
  end if;

  begin
    perform * from public.read_exact_edit_apply_authority_v1(
      'edit-reference-production-persistence-contract-v6',
      'edit-reference-production-exact-edit-apply-authority-read-v1',
      jsonb_build_object(
        'actorUserId', '11111111-1111-4111-8111-111111111111',
        'workspaceId', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'projectId', 'bbbbbbbb-1000-4000-8000-000000000001',
        'editSessionId', 'bbbbbbbb-2000-4000-8000-000000000001',
        'selectedApplicationId', 'bbbbbbbb-7000-4000-8000-000000000001'
      )
    );
    cross_tenant_allowed := true;
  exception when sqlstate '42501' then null;
  end;
  if cross_tenant_allowed then
    raise exception 'EXACT_EDIT_APPLY_READ_CROSS_TENANT_ALLOWED';
  end if;

  select count(*) into final_event_count
  from public.exact_edit_preference_apply_events;
  if final_event_count <> initial_event_count then
    raise exception 'EXACT_EDIT_APPLY_READ_MUTATED_EVENT_STATE';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

do $$
declare
  authority jsonb;
begin
  select * into authority
  from public.read_exact_edit_apply_authority_v1(
    'edit-reference-production-persistence-contract-v6',
    'edit-reference-production-exact-edit-apply-authority-read-v1',
    jsonb_build_object(
      'actorUserId', '22222222-2222-4222-8222-222222222222',
      'workspaceId', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'projectId', 'bbbbbbbb-1000-4000-8000-000000000001',
      'editSessionId', 'bbbbbbbb-2000-4000-8000-000000000001',
      'selectedApplicationId', 'bbbbbbbb-7000-4000-8000-000000000001'
    )
  );
  if authority->>'workspaceId' <> 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    or authority->'selectedApplicationAuthority'->>'applicationId'
      <> 'bbbbbbbb-7000-4000-8000-000000000001' then
    raise exception 'EXACT_EDIT_APPLY_READ_TENANT_B_INVALID_%', authority;
  end if;
end;
$$;

reset role;
rollback;

\echo 'PASS 006_exact_edit_apply_authority_read'
