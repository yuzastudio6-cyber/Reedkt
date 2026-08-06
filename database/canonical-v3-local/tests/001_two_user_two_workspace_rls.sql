\set ON_ERROR_STOP on
\echo 'canonical-v3-local: two-user/two-workspace RLS isolation'

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
  visible_count bigint;
begin
  if auth.uid() <> '11111111-1111-4111-8111-111111111111'::uuid then
    raise exception 'RLS_TEST_ACTOR_A_NOT_ACTIVE';
  end if;

  select count(*) into visible_count from public.workspaces;
  if visible_count <> 1 then raise exception 'RLS_TEST_A_WORKSPACE_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.projects;
  if visible_count <> 1 then raise exception 'RLS_TEST_A_PROJECT_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.edit_sessions;
  if visible_count <> 1 then raise exception 'RLS_TEST_A_EDIT_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.edit_references;
  if visible_count <> 1 then raise exception 'RLS_TEST_A_REFERENCE_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.preference_study_sessions;
  if visible_count <> 1 then raise exception 'RLS_TEST_A_STUDY_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.preference_dna_versions;
  if visible_count <> 1 then raise exception 'RLS_TEST_A_DNA_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.preference_applications;
  if visible_count <> 2 then raise exception 'RLS_TEST_A_APPLICATION_COUNT_%', visible_count; end if;

  if exists (
    select 1 from public.edit_references
    where id = 'bbbbbbbb-3000-4000-8000-000000000001'::uuid
  ) then
    raise exception 'RLS_TEST_A_CROSS_WORKSPACE_REFERENCE_VISIBLE';
  end if;

  begin
    insert into public.edit_references (
      workspace_id, owner_user_id, name
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Forbidden direct write'
    );
    raise exception 'RLS_TEST_A_DIRECT_INSERT_WAS_ALLOWED';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform * from public.read_exact_edit_reference_application_state_v2(
      'edit-reference-production-persistence-contract-v6',
      'edit-reference-production-planning-authority-read-v2',
      jsonb_build_object(
        'actorUserId', '11111111-1111-4111-8111-111111111111',
        'workspaceId', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'projectId', 'bbbbbbbb-1000-4000-8000-000000000001',
        'editSessionId', 'bbbbbbbb-2000-4000-8000-000000000001'
      )
    );
    raise exception 'RLS_TEST_A_CROSS_WORKSPACE_RPC_WAS_ALLOWED';
  exception
    when sqlstate '42501' then null;
  end;
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
  visible_count bigint;
begin
  if auth.uid() <> '22222222-2222-4222-8222-222222222222'::uuid then
    raise exception 'RLS_TEST_ACTOR_B_NOT_ACTIVE';
  end if;

  select count(*) into visible_count from public.workspaces;
  if visible_count <> 1 then raise exception 'RLS_TEST_B_WORKSPACE_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.projects;
  if visible_count <> 1 then raise exception 'RLS_TEST_B_PROJECT_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.edit_sessions;
  if visible_count <> 1 then raise exception 'RLS_TEST_B_EDIT_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.edit_references;
  if visible_count <> 1 then raise exception 'RLS_TEST_B_REFERENCE_COUNT_%', visible_count; end if;
  select count(*) into visible_count from public.preference_applications;
  if visible_count <> 1 then raise exception 'RLS_TEST_B_APPLICATION_COUNT_%', visible_count; end if;

  if exists (
    select 1 from public.edit_references
    where id = 'aaaaaaaa-3000-4000-8000-000000000001'::uuid
  ) then
    raise exception 'RLS_TEST_B_CROSS_WORKSPACE_REFERENCE_VISIBLE';
  end if;
end;
$$;

reset role;
rollback;

\echo 'PASS 001_two_user_two_workspace_rls'
