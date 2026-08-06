\set ON_ERROR_STOP on
\echo 'canonical-v3-local: Edit Reference library/study commands, replay, CAS, and tenant isolation'

begin;
\ir _fixture.sql

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare
  created jsonb;
  replayed jsonb;
  appended jsonb;
  renamed jsonb;
  aggregate_read jsonb;
  reference_id uuid;
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
        'name', 'Restrained documentary',
        'description', 'Evidence-first pacing and sound.',
        'initialGoals', jsonb_build_array(
          'visual_language', 'story_and_pacing', 'audio_and_sfx'
        )
      )
    ),
    repeat('1', 64),
    repeat('a', 64)
  );

  if created->>'replayed' <> 'false'
    or created->'aggregate'->>'schemaVersion' <> 'edit-reference-private-v2'
    or created->'aggregate'->>'ownerUserId'
      <> '11111111-1111-4111-8111-111111111111'
    or created->'aggregate'->>'workspaceId'
      <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    or created->'aggregate'->>'scopeHash'
      <> public.reeditpro_edit_reference_domain_scope_hash(
        '11111111-1111-4111-8111-111111111111',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      )
    or jsonb_array_length(created->'aggregate'->'references') <> 1
    or jsonb_array_length(created->'aggregate'->'studies') <> 1
    or jsonb_array_length(created->'aggregate'->'messages') <> 2
    or jsonb_array_length(created->'aggregate'->'usageLogs') <> 2
    or jsonb_array_length(created->'auditEvents') <> 1
    or created->'receipt'->>'operation' <> 'edit_reference.create'
  then raise exception 'EDIT_REFERENCE_DOMAIN_CREATE_INVALID_%', created; end if;

  reference_id := (created->'receipt'->'result'->>'editReferenceId')::uuid;
  study_id := (created->'receipt'->'result'->>'studySessionId')::uuid;

  select * into replayed
  from public.mutate_edit_reference_domain_command_v1(
    'edit-reference-domain-command-v1',
    '11111111-1111-4111-8111-111111111111',
    jsonb_build_object(
      'schemaVersion', 'edit-reference-domain-command-v1',
      'operation', 'edit_reference.create',
      'request', jsonb_build_object(
        'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'name', 'Restrained documentary',
        'description', 'Evidence-first pacing and sound.',
        'initialGoals', jsonb_build_array(
          'visual_language', 'story_and_pacing', 'audio_and_sfx'
        )
      )
    ),
    repeat('1', 64),
    repeat('a', 64)
  );
  if replayed->>'replayed' <> 'true'
    or replayed->'receipt' <> created->'receipt'
    or replayed->'aggregate' <> created->'aggregate'
  then raise exception 'EDIT_REFERENCE_DOMAIN_REPLAY_CHANGED'; end if;

  begin
    perform * from public.mutate_edit_reference_domain_command_v1(
      'edit-reference-domain-command-v1',
      '11111111-1111-4111-8111-111111111111',
      jsonb_build_object(
        'schemaVersion', 'edit-reference-domain-command-v1',
        'operation', 'edit_reference.create',
        'request', jsonb_build_object(
          'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'name', 'Changed request',
          'initialGoals', jsonb_build_array('visual_language')
        )
      ),
      repeat('1', 64),
      repeat('b', 64)
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_IDEMPOTENCY_CONFLICT_NOT_REJECTED';
  exception when unique_violation then null;
  end;

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
          'clientMessageId', 'local-domain-message-1',
          'content', 'Preserve silence before important testimony.'
        )
      )
    ),
    repeat('2', 64),
    repeat('c', 64)
  );
  if appended->>'replayed' <> 'false'
    or appended->'aggregate'->'studies'->0->>'revision' <> '2'
    or jsonb_array_length(appended->'aggregate'->'messages') <> 4
    or jsonb_array_length(appended->'aggregate'->'evidence') <> 1
    or jsonb_array_length(appended->'receipt'->'result'->'appendedMessageIds') <> 2
  then raise exception 'EDIT_REFERENCE_DOMAIN_APPEND_INVALID_%', appended; end if;

  begin
    perform * from public.mutate_edit_reference_domain_command_v1(
      'edit-reference-domain-command-v1',
      '11111111-1111-4111-8111-111111111111',
      jsonb_build_object(
        'schemaVersion', 'edit-reference-domain-command-v1',
        'operation', 'preference_study.update',
        'request', jsonb_build_object(
          'studyId', study_id::text,
          'input', jsonb_build_object(
            'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'expectedStudyRevision', 1,
            'title', 'Stale title'
          )
        )
      ),
      repeat('3', 64),
      repeat('d', 64)
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_STALE_REVISION_NOT_REJECTED';
  exception when serialization_failure then null;
  end;

  select * into renamed
  from public.mutate_edit_reference_domain_command_v1(
    'edit-reference-domain-command-v1',
    '11111111-1111-4111-8111-111111111111',
    jsonb_build_object(
      'schemaVersion', 'edit-reference-domain-command-v1',
      'operation', 'edit_reference.update',
      'request', jsonb_build_object(
        'referenceId', reference_id::text,
        'input', jsonb_build_object(
          'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'expectedReferenceRevision', 1,
          'name', 'Restrained investigative documentary'
        )
      )
    ),
    repeat('4', 64),
    repeat('e', 64)
  );
  if renamed->'aggregate'->'references'->0->>'name'
      <> 'Restrained investigative documentary'
    or renamed->'aggregate'->'references'->0->>'revision' <> '2'
    or renamed->'aggregate'->>'revision' <> '3'
    or jsonb_array_length(renamed->'auditEvents') <> 3
  then raise exception 'EDIT_REFERENCE_DOMAIN_UPDATE_INVALID_%', renamed; end if;

  select * into aggregate_read
  from public.read_edit_reference_domain_aggregate_v1(
    'edit-reference-domain-aggregate-read-v1',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
  );
  if aggregate_read->'aggregate' <> renamed->'aggregate'
    or aggregate_read->'auditEvents' <> renamed->'auditEvents'
    or (aggregate_read::text ~* '(signed.?url|service.?role.?key|access.?token|raw.?frame|raw.?provider.?payload)')
  then raise exception 'EDIT_REFERENCE_DOMAIN_READ_INVALID_%', aggregate_read; end if;

  begin
    perform * from public.mutate_edit_reference_domain_command_v1(
      'edit-reference-domain-command-v1',
      '22222222-2222-4222-8222-222222222222',
      jsonb_build_object(
        'schemaVersion', 'edit-reference-domain-command-v1',
        'operation', 'edit_reference.create',
        'request', jsonb_build_object(
          'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'name', 'Cross workspace attempt',
          'initialGoals', jsonb_build_array('visual_language')
        )
      ),
      repeat('5', 64),
      repeat('f', 64)
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_CROSS_WORKSPACE_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
begin
  if has_function_privilege(
    'authenticated',
    'public.mutate_edit_reference_domain_command_v1(text,uuid,jsonb,text,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.read_edit_reference_domain_aggregate_v1(text,jsonb)',
    'EXECUTE'
  ) then raise exception 'EDIT_REFERENCE_DOMAIN_RPC_ROLE_BOUNDARY_TOO_BROAD'; end if;

  begin
    insert into public.edit_reference_domain_states (workspace_id, owner_user_id)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111'
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_DIRECT_MUTATION_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
\echo 'PASS 010_edit_reference_domain_library_study_rpcs'
